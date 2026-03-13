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
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(
        contents=prompt,
        generation_config={"response_modalities": ["IMAGE", "TEXT"]}
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

def apply_branding(image_bytes: bytes, logo_url: str | None, brand_name: str) -> bytes:
    base = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    W, H = base.size

    # Semi-transparent bottom bar
    bar_h = int(H * 0.10)
    bar = Image.new("RGBA", (W, bar_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bar)
    for y in range(bar_h):
        alpha = int(180 * (y / bar_h))
        draw.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    base.paste(bar, (0, H - bar_h), bar)

    # Brand name text
    draw = ImageDraw.Draw(base)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=36)
    except Exception:
        font = ImageFont.load_default()

    text = brand_name.upper()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (W - tw) // 2
    ty = H - bar_h + (bar_h - th) // 2
    draw.text((tx + 2, ty + 2), text, font=font, fill=(0, 0, 0, 120))  # shadow
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 230))

    # Logo bottom-right
    if logo_url:
        logo = fetch_logo(logo_url)
        if logo:
            logo_size = int(H * 0.12)
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
            base.paste(logo, (W - logo_size - 20, H - logo_size - 20), logo)

    buf = io.BytesIO()
    base.convert("RGB").save(buf, format="PNG", optimize=True)
    return buf.getvalue()

# ─────────────────────────────────────────────
# S3 UPLOAD — uses ASSETS_BUCKET + s3_client from utils
# ─────────────────────────────────────────────

def upload_to_s3(image_bytes: bytes, user_id: str, session_id: str, suffix: str = "final") -> str:
    key = f"generated/{user_id}/{session_id}/{int(time.time())}_{suffix}.png"
    s3_client.put_object(
        Bucket=ASSETS_BUCKET,
        Key=key,
        Body=image_bytes,
        ContentType="image/png"
    )
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': ASSETS_BUCKET, 'Key': key},
        ExpiresIn=604800  # 7 days
    )

# ─────────────────────────────────────────────
# HANDLER
# ─────────────────────────────────────────────

def handler(event, context):
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
            Your job is to analyze the user's message and extract:
            1. TOPIC of the content (campaign, promotion, festival, announcement, etc.)
            2. SCHEDULE time.

            STRICT RULES FOR SCHEDULE:
            - All schedules MUST be returned in ISO-8601 format (YYYY-MM-DDTHH:mm:ss) in IST.
            - Do NOT convert to UTC. Do NOT append offsets.
            - Convert natural language (e.g. 9:51 PM) into 24-hour format.

            LOGIC:
            1. Detect campaign topic. 2. Detect date/time. 3. Normalize to IST.
            4. If missing time -> status = NEED_TIME.
            5. If both exist -> generate FinalPrompt instructing content generator for platform-ready posts.

            OUTPUT RULES: Return ONLY valid JSON. No markdown, no backticks.
            JSON FORMAT: {{
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
            brand_name = brand_ctx.get('name', 'Global Brand')
            tone = brand_ctx.get('tone', 'Professional')
            topic = event.get('posts', [{}])[0].get('topic', '')
            image_prompt = event.get('imagePrompt') or (
                f"A stunning photorealistic social media advertisement for {brand_name}. "
                f"Theme: {topic}. Style: {tone.lower()}, premium, no text overlays."
            )

            genai.configure(api_key=get_gemini_key())

            # 1. Caption
            model = genai.GenerativeModel('gemini-2.5-flash')
            caption_response = model.generate_content(
                f"Act as Social Media Head for {brand_name}. Tone: {tone}. "
                f"Write a viral caption + 5 hashtags for: '{topic}'. No labels."
            )

            # 2. Image
            raw_image_bytes = generate_image_gemini(image_prompt, get_gemini_key())

            # 3. Upload raw to S3
            raw_image_url = upload_to_s3(raw_image_bytes, user_id, session_id, suffix="raw")

            return {
                **event,
                "rawContent": caption_response.text,
                "rawImageUrl": raw_image_url,
                "rawImageBytes": base64.b64encode(raw_image_bytes).decode(),
                "task": "BRAND"
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

            raw_image_bytes = base64.b64decode(event.get('rawImageBytes', ''))
            branded_bytes = apply_branding(raw_image_bytes, logo_url, brand_name)
            branded_image_url = upload_to_s3(branded_bytes, user_id, session_id, suffix="branded")

            return {
                **event,
                "finalContent": clean_content,
                "finalImageUrl": branded_image_url,
                "rawImageBytes": None,  # clear heavy payload
                "task": "STORE"
            }

        # ── STORE ──────────────────────────────────────────────────────
        if task == "STORE":
            post = event.get('posts', [{}])[0]
            dynamodb_resource.Table(TABLE_NAME).put_item(Item={
                'UserId': user_id,
                'Timestamp': int(time.time()),
                'SessionId': session_id,
                'UserMessage': f"📅 Drafted Flow: {post.get('date')}",
                'AgentResponse': event.get('finalContent'),
                'ScheduledDate': post.get('date'),
                'ImageUrl': event.get('finalImageUrl'),
                'RawImageUrl': event.get('rawImageUrl'),
                'Status': 'DRAFT'
            })
            return {
                "status": "success",
                "imageUrl": event.get('finalImageUrl'),
                "content": event.get('finalContent'),
                "scheduledDate": post.get('date')
            }

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}