import json
import boto3
import os
import uuid
import time
import base64
import hashlib
import secrets
import traceback
import requests 
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr
import google.generativeai as genai

# --- Configuration ---
AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'Y65UM8CFJP') 
AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'TSTALIASID') 
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME') 
BRANDS_TABLE = os.environ.get('BRANDS_TABLE_NAME') 
X_CLIENT_ID = os.environ.get('X_CLIENT_ID')
X_CLIENT_SECRET = os.environ.get('X_CLIENT_SECRET')
X_REDIRECT_URI = "https://dev.d8aheoykcvs8k.amplifyapp.com" 
ASSETS_BUCKET = os.environ.get('ASSETS_BUCKET_NAME', 'vinciflow-dev-assets') 
SCHEDULER_ROLE_ARN = os.environ.get('SCHEDULER_ROLE_ARN')
ENV = os.environ.get('ENV', 'dev')

# --- CLIENTS ---
s3_client = boto3.client('s3', region_name="ap-south-1")
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1") 
dynamodb_resource = boto3.resource('dynamodb', region_name="ap-south-1")
sfn_client = boto3.client('stepfunctions', region_name="ap-south-1")
ssm_client = boto3.client('ssm', region_name="ap-south-1")
scheduler_client = boto3.client('scheduler', region_name="ap-south-1") #

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_cors_headers(event):
    allowed_origins = [
        'http://localhost:5173',
        'https://dev.d8aheoykcvs8k.amplifyapp.com',
        'https://main.d8aheoykcvs8k.amplifyapp.com'
    ]
    request_origin = event.get('headers', {}).get('origin')
    origin = request_origin if request_origin in allowed_origins else allowed_origins[1]
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }

def get_gemini_key():
    param_path = "/corex/gemini_api_key" #
    try:
        res = ssm_client.get_parameter(Name=param_path, WithDecryption=True)
        return res['Parameter']['Value'] # Value: AlzaSyBAE8YIH...
    except Exception as e:
        print(f"ERROR | Gemini Key Fetch Failed: {str(e)}")
        return None
    
def get_user_id(event):
    try:
        claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
        if not claims:
            claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        return claims.get('sub')
    except:
        return None

def get_state_machine_arn():
    """Late-binding fetch to break Terraform cycles."""
    param_path = f"/vinciflow/dev/state_machine_arn"
    try:
        response = ssm_client.get_parameter(Name=param_path)
        return response['Parameter']['Value']
    except Exception as e:
        print(f"ERROR | SSM ARN Fetch Failed: {str(e)}")
        return None
    
def refresh_x_token(user_id, refresh_token):
    """X API OAuth 2.0 Refresh Token Logic"""
    print(f"DEBUG | Refreshing token for user: {user_id}")
    
    # Client ID aur Secret Basic Auth ke liye
    auth_b64 = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
    
    headers = {
        "Authorization": f"Basic {auth_b64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
        "client_id": X_CLIENT_ID
    }
    
    response = requests.post("https://api.twitter.com/2/oauth2/token", headers=headers, data=data)
    
    if response.status_code == 200:
        new_tokens = response.json()
        dynamodb_resource.Table(BRANDS_TABLE).update_item(
            Key={'UserId': user_id},
            UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt",
            ExpressionAttributeValues={
                ':at': new_tokens['access_token'],
                ':rt': new_tokens['refresh_token'] # X rotates this too!
            }
        )
        return new_tokens['access_token']
    else:
        print(f"ERROR | Refresh Failed: {response.text}")
        return None

def handler(event, context):
    # --- 1. STEP FUNCTION TASK ROUTING ---
    if "requestContext" not in event:
        # SFN input se task, ids aur contexts fetch karna
        task = event.get('task', 'PARSE')
        user_id = event.get('userId')
        session_id = event.get('sessionId')
        user_prompt = event.get('prompt', '')
        brand_ctx = event.get('brandContext', {})
        timestamp = event.get('timestamp')

        # --- TASK: PUBLISH_X (Scheduled Execution with Auto-Refresh) ---
        if task == "PUBLISH_X":
            print(f"DEBUG | Scheduled Execution for User: {user_id} | Post: {timestamp}")
            try:
                # 1. Fetch Tokens & Content
                brands_table = dynamodb_resource.Table(BRANDS_TABLE)
                brand_data = brands_table.get_item(Key={'UserId': user_id}).get('Item', {})
                
                access_token = brand_data.get('x_access_token')
                refresh_token = brand_data.get('x_refresh_token')

                memory_table = dynamodb_resource.Table(TABLE_NAME)
                post_data = memory_table.get_item(Key={'UserId': user_id, 'Timestamp': int(timestamp)}).get('Item', {})
                caption = post_data.get('AgentResponse', 'VinciFlow Auto-Post')

                # Helper: Tweet Posting Logic
                def post_tweet(token):
                    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
                    return requests.post("https://api.twitter.com/2/tweets", headers=headers, json={"text": caption})

                # 2. First Attempt to Post
                x_resp = post_tweet(access_token)
                print(f"DEBUG | Initial Attempt Status: {x_resp.status_code}")

                # 3. IF UNAUTHORIZED (401): Refresh and Retry
                if x_resp.status_code == 401 and refresh_token:
                    print("DEBUG | Token expired. Attempting refresh...")
                    
                    # OAuth 2.0 Refresh Call
                    auth_b64 = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
                    token_url = "https://api.twitter.com/2/oauth2/token"
                    refresh_data = {
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                        "client_id": X_CLIENT_ID
                    }
                    
                    refresh_resp = requests.post(token_url, headers={"Authorization": f"Basic {auth_b64}"}, data=refresh_data)
                    
                    if refresh_resp.status_code == 200:
                        new_tokens = refresh_resp.json()
                        access_token = new_tokens['access_token']
                        
                        # 🚀 Update DB with BOTH new tokens (Rotation)
                        brands_table.update_item(
                            Key={'UserId': user_id},
                            UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt",
                            ExpressionAttributeValues={
                                ':at': access_token,
                                ':rt': new_tokens['refresh_token']
                            }
                        )
                        
                        # Retry Posting
                        x_resp = post_tweet(access_token)
                        print(f"DEBUG | Retry Attempt Status: {x_resp.status_code}")
                    else:
                        print(f"ERROR | Refresh Failed: {refresh_resp.text}")

                # 4. Final Result Handling
                print(f"X API Response Body: {x_resp.text}")

                if x_resp.status_code == 201:
                    memory_table.update_item(
                        Key={'UserId': user_id, 'Timestamp': int(timestamp)},
                        UpdateExpression="SET #s = :s, TweetId = :tid",
                        ExpressionAttributeNames={'#s': 'Status'},
                        ExpressionAttributeValues={':s': 'PUBLISHED', ':tid': x_resp.json()['data']['id']}
                    )
                    return {"status": "success", "tweetId": x_resp.json()['data']['id']}
                
                return {"status": "error", "details": x_resp.text}

            except Exception as e:
                traceback.print_exc()
                return {"status": "error", "message": str(e)}
        
        # Configure Gemini using SSM Key
        api_key = get_gemini_key()
        genai.configure(api_key=api_key)

        # --- TASK A: PARSE (Dynamic Intent Extraction) ---
        if task == "PARSE":
            # 1. Fetch Session Context (Pichli 5 baatein)
            memory_table = dynamodb_resource.Table(TABLE_NAME)
            
            # Hum UserId (PK) use karenge aur SessionId par filter lagayenge
            response = memory_table.query(
                KeyConditionExpression=Key('UserId').eq(user_id),
                FilterExpression=Attr('SessionId').eq(session_id), 
                ScanIndexForward=False, # Latest first
                Limit=50
            )
            history = response.get('Items', [])[:5]
            
            # Context ko string mein convert karein
            context_str = "\n".join([
                f"User: {h['UserMessage']}\nAgent: {h.get('AgentResponse', '')}" 
                for h in reversed(history)
            ])
            current_time = time.strftime("%Y-%m-%dT%H:%M:%S")

            # 2. Nova-Lite: The Brain
            synthesis_instr = f"""
            System Time: {current_time}
            System Timezone: Indian Standard Time (IST) UTC+05:30
            Year: 2026

            Role: Social Media Architect & Scheduling Interpreter.

            Your job is to analyze the user's message and extract:
            1. TOPIC of the content (campaign, promotion, festival, announcement, etc.)
            2. SCHEDULE time.

            STRICT RULES FOR SCHEDULE:
            - All schedules MUST be returned in ISO-8601 format.
            - Format: YYYY-MM-DDTHH:mm:ss
            - Time MUST be in Indian Standard Time (IST).
            - Do NOT convert to UTC.
            - Do NOT append timezone offsets.
            - Convert any user time (AM/PM or natural language) into 24-hour format.
            - Example:
                6 March 2026 9:51 PM → 2026-03-06T21:51:00
                March 7 at 3:21 AM → 2026-03-07T03:21:00

            LOGIC:
            1. Detect the campaign/topic from the user input.
            2. Detect any date and time expressions.
            3. Normalize them into ISO format using IST.
            4. If date OR time is missing → status = NEED_TIME.
            5. If both topic and schedule exist → generate FinalPrompt.

            FinalPrompt must instruct a content generator to create:
            - platform-ready social media content
            - captions
            - hashtags
            - CTA
            - tone aligned with the topic

            OUTPUT RULES:
            - Return ONLY valid JSON.
            - No explanations.
            - No extra text.

            JSON FORMAT:
            {{
                "status": "READY" | "NEED_TIME",
                "topic": "...",
                "schedule": "YYYY-MM-DDTHH:mm:ss",
                "finalPrompt": "...",
                "askUser": "If schedule missing ask for exact date and time in IST"
            }}
            """
            response = bedrock_runtime.converse(
                modelId="us.amazon.nova-lite-v1:0",
                messages=[{"role": "user", "content": [{"text": f"{synthesis_instr}\nContext:\n{context_str}\n\nCurrent Prompt: {user_prompt}"}]}]
            )

            try:
                llm_out = response['output']['message']['content'][0]['text']
                parsed = json.loads(llm_out[llm_out.find('{'):llm_out.rfind('}')+1])
            except:
                parsed = {"status": "NEED_TIME", "askUser": "Bhai, pichli baat samajh nahi aayi. Kab schedule karna hai?"}

            # 3. Decision Logic
            if parsed.get('status') == "NEED_TIME":
                # Save current intent so we don't forget it in next turn
                return {
                    "task": "AWAIT_CLARIFICATION", 
                    "message": parsed.get('askUser', "Please specify date and time to schedule."),
                    "userId": user_id, "sessionId": session_id
                }

            # 4. Success: Feeding synthesized prompt to GENERATE
            return {
                "userId": user_id, 
                "sessionId": session_id,
                "brandContext": brand_ctx, 
                "prompt": parsed.get('finalPrompt'),
                "posts": [{
                    "date": parsed.get('schedule'),
                    "topic": parsed.get('topic'),
                    "type": "IMAGE"
                }],
                "task": "GENERATE"
            }
        # --- TASK B: GENERATE (Content Generation) ---
        if task == "GENERATE":
            topic = event.get('topic')
            date = event.get('date')
            
            # Dynamic variables from brandContext
            brand_name = brand_ctx.get('name', 'Global Brand')
            industry = brand_ctx.get('industry', 'Lifestyle')
            tone = brand_ctx.get('tone', 'Professional')

            model = genai.GenerativeModel('gemini-2.5-flash') #
            
            # 🚀 Dynamic Multi-Brand Prompt
            prompt = f"""
            Act as the Social Media Head for {brand_name}. 
            Tone: {tone}.
            
            Task: Write a viral post/caption and 5 hashtags for: "{topic}".
            IMPORTANT: Do NOT include labels like 'Caption:' or 'Hashtags:'. 
            Just give me the raw text and the tags.
            """
            
            try:
                response = model.generate_content(prompt)
                # Passing content to 'BRAND' task for final check
                return {**event, "rawContent": response.text, "task": "BRAND"}
            except Exception as e:
                print(f"ERROR | Gemini call failed: {str(e)}")
                return {"status": "error", "message": str(e)}

        # --- TASK C: BRAND (Branding Refinement) ---
        if task == "BRAND":
            raw = event.get('rawContent', "")
            
            clean_content = raw.replace("Caption:", "").replace("Hashtags:", "").replace("**Caption:**", "").replace("**Hashtags:**", "").strip()
            final_content = f"{clean_content}" 
            
            return {**event, "finalContent": final_content, "task": "STORE"}

        # --- TASK D: STORE (Unified Memory Save) ---
        if task == "STORE":
            table = dynamodb_resource.Table(TABLE_NAME) # vinciflow-dev-memory
            # Save so it appears in Sidebar Recent History
            table.put_item(Item={
                'UserId': user_id,
                'Timestamp': int(time.time()),
                'SessionId': session_id,
                'UserMessage': f"📅 Drafted Flow: {event.get('date')}", 
                'AgentResponse': event.get('finalContent'),
                'ScheduledDate': event.get('date'),
                'Status': 'DRAFT' # Ready for Accept/Reject on frontend
            })
            return {"status": "success"}

    # --- 2. EXISTING API GATEWAY LOGIC (UNTOUCHED) ---
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    path = event.get('rawPath') or event.get('path') or '/' 
    print(f"DEBUG | method={method} path={path}") 
    cors_headers = get_cors_headers(event)
    
    # Ab ye line perfectly kaam karegi
    print(f"DEBUG | method={method} path={path}") 
    
    cors_headers = get_cors_headers(event)

    # Preflight fix
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    # Authentication
    user_id = get_user_id(event)
    if not user_id:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}

    try:
        # --- 2. X (TWITTER) AUTH LOGIC ---
        if "/auth/x" in path:
            table = dynamodb_resource.Table(BRANDS_TABLE)
            if method == "GET" and path.endswith("/auth/x"):
                code_verifier = secrets.token_urlsafe(64)
                code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).decode().replace('=', '')
                state = secrets.token_urlsafe(16)
                table.update_item(
                    Key={'UserId': user_id},
                    UpdateExpression="SET x_code_verifier = :cv, x_state = :st",
                    ExpressionAttributeValues={':cv': code_verifier, ':st': state}
                )
                auth_url = f"https://twitter.com/i/oauth2/authorize?response_type=code&client_id={X_CLIENT_ID}&redirect_uri={X_REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={state}&code_challenge={code_challenge}&code_challenge_method=s256"
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'authUrl': auth_url})}

            if method == "POST" and "/callback" in path:
                body = json.loads(event.get('body', '{}'))
                user_brand = table.get_item(Key={'UserId': user_id}).get('Item', {})
                if body.get('state') != user_brand.get('x_state'):
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid Auth State'})}
                auth_header = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
                resp = requests.post("https://api.twitter.com", headers={"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"}, 
                                    data={"code": body.get('code'), "grant_type": "authorization_code", "redirect_uri": X_REDIRECT_URI, "code_verifier": user_brand.get('x_code_verifier')})
                tokens = resp.json()
                if 'access_token' in tokens:
                    table.update_item(Key={'UserId': user_id}, UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt, x_connected = :c REMOVE x_code_verifier, x_state",
                                     ExpressionAttributeValues={':at': tokens['access_token'], ':rt': tokens.get('refresh_token'), ':c': True})
                    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'X successfully linked!'})}
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': tokens})}

        # --- Updated Consolidated Route Logic ---

        normalized_path = path.strip('/') 

        if normalized_path == "schedule" and method == "POST":
            body = json.loads(event.get('body', '{}'))
            post_id = int(body.get('timestamp'))
            target_time = body.get('scheduledTime') # Format: 2026-03-07T10:00:00

            # 1. Update Status to SCHEDULED in Memory Table
            dynamodb_resource.Table(TABLE_NAME).update_item(
                Key={'UserId': user_id, 'Timestamp': post_id},
                UpdateExpression="SET #s = :s, ScheduledTime = :st",
                ExpressionAttributeNames={'#s': 'Status'},
                ExpressionAttributeValues={':s': 'SCHEDULED', ':st': target_time}
            )

            # 2. Create EventBridge One-Time Schedule
            scheduler_client.create_schedule(
                Name=f"VF-Post-{user_id[:8]}-{post_id}",
                ScheduleExpression=f"at({target_time})",
                FlexibleTimeWindow={'Mode': 'OFF'},
                ScheduleExpressionTimezone="Asia/Kolkata",
                Target={
                    'Arn': context.invoked_function_arn, # Ye Lambda khud ko wapas call karegi
                    'RoleArn': SCHEDULER_ROLE_ARN,
                    'Input': json.dumps({
                        'userId': user_id,
                        'timestamp': post_id,
                        'task': 'PUBLISH_X' # Internal trigger task
                    })
                },
                ActionAfterCompletion='DELETE'
            )
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Scheduled!'})}

        if normalized_path in ["brand", "onboarding"]:
            table = dynamodb_resource.Table(BRANDS_TABLE)
            
            # --- GET: Profile Fetch (Breaking the Onboarding Loop) ---
            if method == 'GET':
                response = table.get_item(Key={'UserId': user_id})
                item = response.get('Item')
                
                if not item:
                    # Frontend is data ke base par decide karta hai ki onboarding dikhani hai ya nahi
                    return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Profile not found'})}
                
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(item, cls=DecimalEncoder)}

            # --- POST: Logo Upload & Profile Save ---
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                logo_url = body.get('logoUrl') 
                
                # S3 Logo Logic
                if body.get('logoBase64'):
                    try:
                        logo_content = base64.b64decode(body['logoBase64'].split(',')[-1])
                        content_type = body.get('contentType', 'image/svg+xml')
                        ext = 'svg' if 'svg' in content_type else 'jpg'
                        s3_key = f"logos/{user_id}_logo.{ext}"
                        
                        s3_client.put_object(
                            Bucket=ASSETS_BUCKET,
                            Key=s3_key,
                            Body=logo_content,
                            ContentType=content_type
                        )
                        logo_url = f"https://{ASSETS_BUCKET}.s3.amazonaws.com/{s3_key}"
                    except Exception as e:
                        print(f"ERROR | Logo S3 Upload Failed: {str(e)}")

                # DynamoDB Save
                brand_item = {
                    'UserId': user_id,
                    'BrandName': body.get('brandName') or body.get('BrandName'),
                    'Industry': body.get('industry') or body.get('Industry'),
                    'Region': body.get('region') or body.get('Region'),
                    'Tone': body.get('tone') or body.get('Tone'),
                    'LogoUrl': logo_url, 
                    'Colors': body.get('colors') or body.get('Colors', []),
                    'Platforms': body.get('platforms') or body.get('Platforms', ['Twitter']),
                    'UpdatedAt': int(time.time())
                }
                table.put_item(Item=brand_item)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Aura Initialized', 'logoUrl': logo_url})}
            
        # --- 4. CHAT, HISTORY, & STEP FUNCTIONS ---
        if path == "/" or path == "":
            if method == 'GET':
                table = dynamodb_resource.Table(TABLE_NAME)
                response = table.query(KeyConditionExpression=Key('UserId').eq(user_id), ScanIndexForward=True, Limit=50)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'history': response.get('Items', [])}, cls=DecimalEncoder)}

            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                user_prompt = body.get('prompt', '').strip() or "Hello"
                session_id = body.get('sessionId') or str(uuid.uuid4())
                file_obj = body.get('file')

                # Fetch Brand Context
                brand_table = dynamodb_resource.Table(BRANDS_TABLE)
                brand_info = brand_table.get_item(Key={'UserId': user_id}).get('Item', {})
                b_name = brand_info.get('BrandName', 'Global Brand')
                b_industry = brand_info.get('Industry', 'Lifestyle')
                b_tone = brand_info.get('Tone', 'Professional')

                # --- STEP FUNCTION TRIGGER ---
                keywords = ["create", "generate", "post", "posts"]
                if any(w in user_prompt.lower() for w in keywords) and any(c.isdigit() for c in user_prompt):
                    sfn_arn = get_state_machine_arn()
                    if sfn_arn:
                        sfn_input = {
                            "userId": user_id, "sessionId": session_id, "prompt": user_prompt,
                            "brandContext": {"name": b_name, "industry": b_industry, "tone": b_tone},
                            "task": "PARSE" 
                        }
                        sfn_res = sfn_client.start_execution(
                            stateMachineArn=sfn_arn,
                            name=f"VF-{uuid.uuid4().hex[:8]}-{int(time.time())}",
                            input=json.dumps(sfn_input)
                        )
                        return {'statusCode': 202, 'headers': cors_headers, 'body': json.dumps({'message': 'Pipeline Started', 'executionArn': sfn_res['executionArn']})}

                # --- MULTIMODAL / AGENT CHAT PATH ---
                ai_response = ""
                if file_obj:
                    file_bytes = base64.b64decode(file_obj['data'])
                    system_instr = f"Act as AI for {b_name} ({b_industry}). Tone: {b_tone}."
                    message_content = []
                    if file_obj['type'] == 'application/pdf':
                        message_content.append({"document": {"name": "doc", "format": "pdf", "source": {"bytes": file_bytes}}})
                    elif file_obj['type'].startswith('image/'):
                        fmt = file_obj['type'].split('/')[-1].replace('jpg', 'jpeg')
                        message_content.append({"image": {"format": fmt, "source": {"bytes": file_bytes}}})
                    message_content.append({"text": f"{system_instr}\n\nUser: {user_prompt}"})
                    response = bedrock_runtime.converse(modelId="us.amazon.nova-lite-v1:0", messages=[{"role": "user", "content": message_content}])
                    ai_response = response['output']['message']['content'][0]['text']
                else:
                    injected_prompt = f"[SYSTEM: Act as {b_name} ({b_industry}) with {b_tone} tone] {user_prompt}"
                    response = agent_client.invoke_agent(
                        agentId=AGENT_ID, agentAliasId=AGENT_ALIAS_ID,
                        sessionId=session_id, inputText=injected_prompt,
                        sessionState={'sessionAttributes': {'brandContext': json.dumps({"BrandName": b_name, "Industry": b_industry, "Tone": b_tone})}}
                    )
                    ai_response = "".join([chunk.get('chunk', {}).get('bytes', b'').decode('utf-8') for chunk in response.get('completion')])

                # Save Memory
                dynamodb_resource.Table(TABLE_NAME).put_item(Item={
                    'UserId': user_id, 'Timestamp': int(time.time()), 'SessionId': session_id,
                    'UserMessage': user_prompt, 'AgentResponse': ai_response
                })
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'response': ai_response, 'sessionId': session_id})}

        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Route Not Found'})}

    except Exception as e:
        traceback.print_exc() 
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e), 'stack': traceback.format_exc()})}

