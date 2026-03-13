import json, time, traceback, boto3, google.generativeai as genai
from utils import dynamodb_resource, get_gemini_key, TABLE_NAME, BRANDS_TABLE
from boto3.dynamodb.conditions import Key, Attr

bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")

def handler(event, context):
    task = event.get('task', 'PARSE')
    user_id = event.get('userId'); session_id = event.get('sessionId')
    user_prompt = event.get('prompt', ''); brand_ctx = event.get('brandContext', {})

    genai.configure(api_key=get_gemini_key())

    try:
        if task == "PARSE":
            memory_table = dynamodb_resource.Table(TABLE_NAME)
            response = memory_table.query(KeyConditionExpression=Key('UserId').eq(user_id), FilterExpression=Attr('SessionId').eq(session_id), ScanIndexForward=False, Limit=50)
            history = response.get('Items', [])[:5]
            context_str = "\n".join([f"User: {h['UserMessage']}\nAgent: {h.get('AgentResponse', '')}" for h in reversed(history)])
            current_time = time.strftime("%Y-%m-%dT%H:%M:%S")

            # 🚀 EXACT ORIGINAL PROMPT
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

            OUTPUT RULES: Return ONLY valid JSON.
            JSON FORMAT: {{"status": "READY" | "NEED_TIME", "topic": "...", "schedule": "YYYY-MM-DDTHH:mm:ss", "finalPrompt": "...", "askUser": "..."}}
            """
            res = bedrock_runtime.converse(modelId="us.amazon.nova-lite-v1:0", messages=[{"role": "user", "content": [{"text": f"{synthesis_instr}\nContext:\n{context_str}\n\nCurrent Prompt: {user_prompt}"}]}] )
            llm_out = res['output']['message']['content'][0]['text']
            parsed = json.loads(llm_out[llm_out.find('{'):llm_out.rfind('}')+1])

            if parsed.get('status') == "NEED_TIME":
                return {"task": "AWAIT_CLARIFICATION", "message": parsed.get('askUser'), "userId": user_id, "sessionId": session_id}
            
            return {"userId": user_id, "sessionId": session_id, "brandContext": brand_ctx, "prompt": parsed.get('finalPrompt'), "posts": [{"date": parsed.get('schedule'), "topic": parsed.get('topic'), "type": "IMAGE"}], "task": "GENERATE"}

        if task == "GENERATE":
            model = genai.GenerativeModel('gemini-2.5-flash')
            brand_name = brand_ctx.get('name', 'Global Brand'); tone = brand_ctx.get('tone', 'Professional')
            # 🚀 EXACT ORIGINAL GENERATE PROMPT
            prompt = f"Act as the Social Media Head for {brand_name}. Tone: {tone}. Task: Write a viral post/caption and 5 hashtags for: '{event.get('topic')}'. No labels."
            response = model.generate_content(prompt)
            return {**event, "rawContent": response.text, "task": "BRAND"}

        if task == "BRAND":
            clean_content = event.get('rawContent', "").replace("Caption:", "").replace("Hashtags:", "").replace("**Caption:**", "").replace("**Hashtags:**", "").strip()
            return {**event, "finalContent": clean_content, "task": "STORE"}

        if task == "STORE":
            dynamodb_resource.Table(TABLE_NAME).put_item(Item={'UserId': user_id, 'Timestamp': int(time.time()), 'SessionId': session_id, 'UserMessage': f"📅 Drafted Flow: {event.get('date')}", 'AgentResponse': event.get('finalContent'), 'ScheduledDate': event.get('date'), 'Status': 'DRAFT'})
            return {"status": "success"}

    except Exception as e:
        traceback.print_exc(); return {"status": "error", "message": str(e)}