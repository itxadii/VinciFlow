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
ENV = os.environ.get('ENV', 'dev')

# --- CLIENTS ---
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1") 
dynamodb_resource = boto3.resource('dynamodb', region_name="ap-south-1")
sfn_client = boto3.client('stepfunctions', region_name="ap-south-1")
ssm_client = boto3.client('ssm', region_name="ap-south-1")

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

def handler(event, context):
    # --- 1. STEP FUNCTION TASK ROUTING ---
    if "requestContext" not in event:
        # SFN input se task, ids aur contexts fetch karna
        task = event.get('task', 'PARSE')
        user_id = event.get('userId')
        session_id = event.get('sessionId')
        user_prompt = event.get('prompt', '')
        brand_ctx = event.get('brandContext', {})
        
        # Configure Gemini using SSM Key
        api_key = get_gemini_key()
        genai.configure(api_key=api_key)

        # --- TASK A: PARSE (Dynamic Intent Extraction) ---
        if task == "PARSE":
            # Bedrock Nova-Lite is best for JSON extraction
            parsing_instr = """
            Extract social media posts. Return ONLY valid JSON: {"posts": [{"date": "YYYY-MM-DD", "topic": "...", "type": "IMAGE"}]}.
            Year: 2026. Identify specific dates.
            """
            response = bedrock_runtime.converse(
                modelId="us.amazon.nova-lite-v1:0",
                messages=[{"role": "user", "content": [{"text": f"{parsing_instr}\nPrompt: {user_prompt}"}]}]
            )
            try:
                llm_out = response['output']['message']['content'][0]['text']
                parsed_data = json.loads(llm_out[llm_out.find('{'):llm_out.rfind('}')+1])
            except:
                parsed_data = {"posts": []}

            # Return 'posts' array to fuel SFN Map State
            return {
                "posts": parsed_data.get('posts', []),
                "userId": user_id, 
                "sessionId": session_id,
                "brandContext": brand_ctx, 
                "prompt": user_prompt,
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
            Act as the Head of Social Media for {brand_name} in the {industry} industry. 
            Your brand tone is {tone}.
            
            Task: Create a viral social media caption and 5 trending hashtags for: "{topic}" 
            Scheduled Date: {date}.
            
            Format your response clearly:
            Caption: [High-quality text in {tone} tone]
            Hashtags: #Tag1 #Tag2 ...
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
            # Apply brand tone and industrial context
            tone = brand_ctx.get('tone', 'Bold')
            raw = event.get('rawContent')
            final_content = f"[{tone} Mode] {raw} #JustDoIt"
            return {**event, "finalContent": final_content, "task": "STORE"}

        # --- TASK D: STORE (Unified Memory Save) ---
        if task == "STORE":
            table = dynamodb_resource.Table(TABLE_NAME) # vinciflow-dev-memory
            # Save so it appears in Sidebar Recent History
            table.put_item(Item={
                'UserId': user_id,
                'Timestamp': int(time.time()),
                'SessionId': session_id,
                'UserMessage': f"📅 Scheduled Flow: {event.get('date')}", 
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

    # Fix: 'path' ko yahan define kar diya taaki print crash na ho
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    path = event.get('rawPath') or event.get('path') or '/' 
    
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
                auth_url = f"https://twitter.com{X_CLIENT_ID}&redirect_uri={X_REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={state}&code_challenge={code_challenge}&code_challenge_method=s256"
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

        # --- 3. BRAND PROFILE & ONBOARDING ---
        if "/brand" in path or "/onboarding" in path:
            table = dynamodb_resource.Table(BRANDS_TABLE)
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                brand_item = {
                    'UserId': user_id,
                    'BrandName': body.get('brandName') or body.get('BrandName'),
                    'Industry': body.get('industry') or body.get('Industry'),
                    'Region': body.get('region') or body.get('Region'),
                    'Tone': body.get('tone') or body.get('Tone'),
                    'LogoUrl': body.get('logoUrl') or body.get('LogoUrl'),
                    'Colors': body.get('colors') or body.get('Colors', []),
                    'Platforms': body.get('platforms') or body.get('Platforms', ['Twitter']),
                    'UpdatedAt': int(time.time())
                }
                table.put_item(Item=brand_item)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Aura Initialized'})}
            elif method == 'GET':
                response = table.get_item(Key={'UserId': user_id})
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(response.get('Item', {}), cls=DecimalEncoder)}

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

