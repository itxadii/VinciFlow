import json, time, traceback, boto3, base64, io, requests
import google.generativeai as genai
from PIL import Image, ImageDraw, ImageFont
from utils import (
    dynamodb_resource, s3_client, get_gemini_key,
    TABLE_NAME, BRANDS_TABLE, ASSETS_BUCKET
)
from boto3.dynamodb.conditions import Key, Attr

bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")

# ─────────────────────────────────────────────
# IMAGE GENERATION
# ─────────────────────────────────────────────

def generate_image_gemini(prompt: str, api_key: str) -> bytes:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash-image")
    response = model.generate_content(
        contents=prompt,
        generation_config={"response_modalities": ["IMAGE"]}
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            return part.inline_data.data
    raise Exception("No image returned from Gemini")

# ─────────────────────────────────────────────
# BRANDING
# ─────────────────────────────────────────────

def fetch_logo(logo_url: str):
    try:
        r = requests.get(logo_url, timeout=10)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGBA")
    except Exception:
        return None

def apply_branding(image_bytes: bytes, logo_url: str | None, brand_name: str, user_id: str = None) -> bytes:
    base = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    W, H = base.size

    logo = None

    # ✅ Try PNG then JPG only
    if user_id:
        for ext in ['png', 'jpg']:
            try:
                s3_key = f"logos/{user_id}_logo.{ext}"
                s3_obj = s3_client.get_object(Bucket=ASSETS_BUCKET, Key=s3_key)
                logo = Image.open(io.BytesIO(s3_obj['Body'].read())).convert("RGBA")
                print(f"Logo loaded: {s3_key}")
                break
            except Exception:
                continue

    # Fallback — logoUrl from brandContext
    if not logo and logo_url:
        try:
            r = requests.get(logo_url, timeout=10)
            r.raise_for_status()
            logo = Image.open(io.BytesIO(r.content)).convert("RGBA")
        except Exception as e:
            print(f"Logo URL fetch failed: {e}")

    # ── Place logo bottom-right or fallback to text ───────────────
    if logo:
        logo_size = int(H * 0.10)
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
        margin = 20
        lx = W - logo_size - margin
        ly = H - logo_size - margin
        draw = ImageDraw.Draw(base)
        draw.ellipse(
            [lx - 6, ly - 6, lx + logo_size + 6, ly + logo_size + 6],
            fill=(255, 255, 255, 180)
        )
        base.paste(logo, (lx, ly), logo)
    else:
        # Text fallback bottom-right
        draw = ImageDraw.Draw(base)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=28)
        except Exception:
            font = ImageFont.load_default()
        text = brand_name.upper()
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        margin = 20
        tx, ty = W - tw - margin, H - th - margin
        draw.rectangle([tx - 8, ty - 6, tx + tw + 8, ty + th + 6], fill=(0, 0, 0, 120))
        draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 220))

    buf = io.BytesIO()
    base.convert("RGB").save(buf, format="PNG", optimize=True)
    return buf.getvalue()

# ─────────────────────────────────────────────
# S3 UPLOAD
# ─────────────────────────────────────────────

def upload_to_s3(image_bytes: bytes, user_id: str, session_id: str, suffix: str = "final") -> tuple[str, str]:
    key = f"generated/{user_id}/{session_id}/{int(time.time())}_{suffix}.png"
    s3_client.put_object(
        Bucket=ASSETS_BUCKET,
        Key=key,
        Body=image_bytes,
        ContentType="image/png"
    )
    url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': ASSETS_BUCKET, 'Key': key},
        ExpiresIn=604800
    )
    return url, key  # ✅ return both

# ─────────────────────────────────────────────
# HANDLER
# ─────────────────────────────────────────────

def handler(event, context):
    if event.get('status') == 'error':
        return event

    task = event.get('task', 'PARSE')
    user_id = event.get('userId')
    session_id = event.get('sessionId')
    user_prompt = event.get('prompt', '')
    brand_ctx = event.get('brandContext', {})

    try:
        # ── PARSE ──────────────────────────────────────────────────────
        if task == "PARSE":
            memory_table = dynamodb_resource.Table(TABLE_NAME)
            response = memory_table.query(
                KeyConditionExpression=Key('UserId').eq(user_id),
                FilterExpression=Attr('SessionId').eq(session_id),
                ScanIndexForward=False,
                Limit=50
            )
            history = response.get('Items', [])[:5]
            context_str = "\n".join([
                f"User: {h['UserMessage']}\nAgent: {h.get('AgentResponse', '')}"
                for h in reversed(history)
            ])
            current_time = time.strftime("%Y-%m-%dT%H:%M:%S")

            synthesis_instr = f"""
            System Time: {current_time}
            System Timezone: Indian Standard Time (IST) UTC+05:30
            Year: 2026

            Role: Social Media Architect & Scheduling Interpreter.

            CRITICAL: If the user message contains ANY date or time information — even approximate like "tomorrow", "6pm", "March 22", "next Monday" — you MUST return status: READY. NEVER ask for time if any time hint exists in the message.

            Your job:
            1. Extract TOPIC (campaign, promotion, festival, announcement)
            2. Extract SCHEDULE time — be aggressive, extract even partial times

            SCHEDULE RULES:
            - Return ISO-8601 format: YYYY-MM-DDTHH:mm:ss in IST
            - Do NOT convert to UTC, do NOT append offsets
            - "6:00 pm" = 18:00:00
            - "6 pm" = 18:00:00
            - "tomorrow 6pm" = next day 18:00:00

            DECISION RULES:
            - Has date AND time in any form → status: READY
            - Has date but NO time → status: READY, use 12:00:00 as default
            - Has ZERO date/time info → status: NEED_TIME

            OUTPUT: Return ONLY valid JSON. No markdown, no backticks.
            {{
            "status": "READY" | "NEED_TIME",
            "topic": "...",
            "schedule": "YYYY-MM-DDTHH:mm:ss",
            "finalPrompt": "...",
            "imagePrompt": "Photorealistic high-resolution social media ad image. Describe exact scene, lighting, colors, mood, objects relevant to topic. No text in image.",
            "askUser": "..."
            }}
            """

            res = bedrock_runtime.converse(
                modelId="us.amazon.nova-lite-v1:0",
                messages=[{"role": "user", "content": [{"text": f"{synthesis_instr}\nContext:\n{context_str}\n\nCurrent Prompt: {user_prompt}"}]}]
            )
            llm_out = res['output']['message']['content'][0]['text']
            parsed = json.loads(llm_out[llm_out.find('{'):llm_out.rfind('}') + 1])

            if parsed.get('status') == "NEED_TIME":
                return {
                    "task": "AWAIT_CLARIFICATION",
                    "message": parsed.get('askUser'),
                    "userId": user_id,
                    "sessionId": session_id
                }

            return {
                "userId": user_id,
                "sessionId": session_id,
                "brandContext": brand_ctx,
                "prompt": parsed.get('finalPrompt'),
                "imagePrompt": parsed.get('imagePrompt'),
                "posts": [{"date": parsed.get('schedule'), "topic": parsed.get('topic'), "type": "IMAGE"}],
                "task": "GENERATE"
            }

        # ── GENERATE ───────────────────────────────────────────────────
        if task == "GENERATE":
            api_key = get_gemini_key()
            print(f"DEBUG | api_key present: {bool(api_key)}")
            print(f"DEBUG | image_prompt: {event.get('imagePrompt')}")
            print(f"DEBUG | topic: {event.get('topic')}")

            if not api_key:
                return {"status": "error", "message": "Gemini API key not found in SSM"}

            brand_name = brand_ctx.get('name', 'Global Brand')
            tone = brand_ctx.get('tone', 'Professional')
            topic = event.get('topic') or event.get('posts', [{}])[0].get('topic', '')
            date = event.get('date') or event.get('posts', [{}])[0].get('date', '')
            image_prompt = event.get('imagePrompt') or (
                f"A stunning photorealistic social media advertisement for {brand_name}. "
                f"Theme: {topic}. Style: {tone.lower()}, premium, no text overlays."
            )

            genai.configure(api_key=api_key)

            # 1. Caption
            model = genai.GenerativeModel('gemini-2.5-flash')
            caption_response = model.generate_content(
                f"Act as Social Media Head for {brand_name}. Tone: {tone}. "
                f"Write a viral caption + 5 hashtags for: '{topic}'. No labels."
            )

            # 2. Image
            raw_image_bytes = generate_image_gemini(image_prompt, api_key)

            # 3. Upload raw to S3 — unpack both url and key ✅
            raw_image_url, raw_image_key = upload_to_s3(raw_image_bytes, user_id, session_id, suffix="raw")

            return {
                # ✅ Only pass what downstream tasks need — drop heavy/unused fields
                "task": "BRAND",
                "userId": user_id,
                "sessionId": session_id,
                "brandContext": brand_ctx,
                "rawContent": caption_response.text,
                "rawImageUrl": raw_image_url,
                "rawImageS3Key": raw_image_key,
                "posts": [{"date": date, "topic": topic, "type": "IMAGE"}],
                # intentionally NOT spreading **event — avoids carrying imagePrompt, prompt, type etc.
            }

        # ── BRAND ──────────────────────────────────────────────────────
        if task == "BRAND":
            brand_name = brand_ctx.get('name', 'Global Brand')
            logo_url = brand_ctx.get('logoUrl')

            clean_content = (
                event.get('rawContent', '')
                .replace("Caption:", "").replace("Hashtags:", "")
                .replace("**Caption:**", "").replace("**Hashtags:**", "")
                .strip()
            )

            raw_image_s3_key = event.get('rawImageS3Key')
            if raw_image_s3_key:
                s3_obj = s3_client.get_object(Bucket=ASSETS_BUCKET, Key=raw_image_s3_key)
                raw_image_bytes = s3_obj['Body'].read()
            else:
                raw_image_bytes = base64.b64decode(event.get('rawImageBytes', ''))

            branded_bytes = apply_branding(raw_image_bytes, logo_url, brand_name)
            branded_image_url, _ = upload_to_s3(branded_bytes, user_id, session_id, suffix="branded")  # ✅ unpack

            return {
                # ✅ Only pass what STORE needs
                "task": "STORE",
                "userId": user_id,
                "sessionId": session_id,
                "finalContent": clean_content,
                "finalImageUrl": branded_image_url,
                "rawImageUrl": event.get('rawImageUrl'),
                "posts": event.get('posts', []),
            }
        # ── STORE ──────────────────────────────────────────────────────
        if task == "STORE":
            post = event.get('posts', [{}])[0]
            topic = post.get('topic', 'your campaign')
            scheduled_date = post.get('date', '')
            brand_name = brand_ctx.get('name', 'Brand') if brand_ctx else 'Brand'

            try:
                from datetime import datetime
                dt = datetime.fromisoformat(scheduled_date)
                formatted_date = dt.strftime("%-d %B %Y at %-I:%M %p IST")
            except Exception:
                formatted_date = scheduled_date

            personalized_msg = (
                f"✦ {brand_name} · {topic.title()}\n"
                f"Scheduled for {formatted_date}"
            )

            dynamodb_resource.Table(TABLE_NAME).put_item(Item={
                'UserId': user_id,
                'Timestamp': int(time.time()),
                'SessionId': session_id,
                'UserMessage': f"📅 {topic.title()}",
                'AgentResponse': personalized_msg,       # ✅ shown in chat history
                'PostContent': event.get('finalContent'), # ✅ actual caption for ResultCard
                'ScheduledDate': post.get('date'),
                'ImageUrl': event.get('finalImageUrl'),
                'RawImageUrl': event.get('rawImageUrl'),
                'Status': 'DRAFT'
            })

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}