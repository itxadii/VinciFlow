import json
import boto3
import os
import uuid
import time
import base64
import hashlib
import secrets
import traceback # <-- Golden tool for debugging
import requests 
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

# --- Configuration (VinciFlow Specs) ---
AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'Y65UM8CFJP') 
AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'TSTALIASID') 
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME') 
BRANDS_TABLE = os.environ.get('BRANDS_TABLE_NAME') 
X_CLIENT_ID = os.environ.get('X_CLIENT_ID')
X_CLIENT_SECRET = os.environ.get('X_CLIENT_SECRET')
X_REDIRECT_URI = "https://dev.d8aheoykcvs8k.amplifyapp.com/chat" 

# --- CLIENTS ---
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1") 
dynamodb_resource = boto3.resource('dynamodb', region_name="ap-south-1")

ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://dev.d8aheoykcvs8k.amplifyapp.com',
    'https://main.d8aheoykcvs8k.amplifyapp.com'
]

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_cors_headers(event):
    request_origin = event.get('headers', {}).get('origin')
    origin = request_origin if request_origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
    }

def get_user_id(event):
    """Robust UserID extraction"""
    try:
        # Standard HTTP API v2 path
        return event['requestContext']['authorizer']['jwt']['claims']['sub']
    except:
        try:
            # REST API or Custom Authorizer path
            return event['requestContext']['authorizer']['claims']['sub']
        except:
            return None

def handler(event, context):
    # --- LOG START ---
    path = event.get('rawPath') or event.get('path') or '/' # Support both API types
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    cors_headers = get_cors_headers(event)
    
    print(f"DEBUG | Request Received | Path: {path} | Method: {method}")

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    user_id = get_user_id(event)
    print(f"DEBUG | Auth Check | UserID: {user_id}")

    if not user_id:
        print("ERROR | No UserID found in context")
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}

    try:
        # --- 1. X (TWITTER) AUTH ---
        if "/auth/x" in path: # Flexible path check to avoid 404
            if method == "GET" and path.endswith("/auth/x"):
                print("DEBUG | Route Hit: X Auth Start")
                code_verifier = secrets.token_urlsafe(64)
                code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).decode().replace('=', '')
                state = secrets.token_urlsafe(16)

                table = dynamodb_resource.Table(BRANDS_TABLE)
                table.update_item(
                    Key={'UserId': user_id},
                    UpdateExpression="SET x_code_verifier = :cv, x_state = :st",
                    ExpressionAttributeValues={':cv': code_verifier, ':st': state}
                )

                auth_url = (
                    f"https://twitter.com/i/oauth2/authorize?response_type=code&"
                    f"client_id={X_CLIENT_ID}&redirect_uri={X_REDIRECT_URI}&"
                    f"scope=tweet.read%20tweet.write%20users.read%20offline.access&"
                    f"state={state}&code_challenge={code_challenge}&code_challenge_method=s256"
                )
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'authUrl': auth_url})}

            if method == "POST" and "/callback" in path:
                print("DEBUG | Route Hit: X Callback")
                body = json.loads(event.get('body', '{}'))
                code = body.get('code')
                state = body.get('state')
                table = dynamodb_resource.Table(BRANDS_TABLE)
                user_brand = table.get_item(Key={'UserId': user_id}).get('Item', {})

                if state != user_brand.get('x_state'):
                    return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'Invalid Auth State'})}

                token_url = "https://api.twitter.com/2/oauth2/token"
                auth_header = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
                resp = requests.post(token_url, headers={"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"}, 
                                    data={"code": code, "grant_type": "authorization_code", "redirect_uri": X_REDIRECT_URI, "code_verifier": user_brand.get('x_code_verifier')})
                tokens = resp.json()
                if 'access_token' in tokens:
                    table.update_item(Key={'UserId': user_id}, UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt, x_connected = :c REMOVE x_code_verifier, x_state",
                                      ExpressionAttributeValues={':at': tokens['access_token'], ':rt': tokens.get('refresh_token'), ':c': True})
                    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'X successfully linked!'})}
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': tokens})}

        # --- 2. BRAND PROFILE ROUTES (/brand) ---
        if "/brand" in path:
            table = dynamodb_resource.Table(BRANDS_TABLE)
            print(f"DEBUG | Route Hit: Brand | Method: {method}")
            
            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                brand_item = {
                    'UserId': user_id,
                    'BrandName': body.get('brandName'),
                    'Industry': body.get('industry'),
                    'Region': body.get('region'),
                    'Tone': body.get('tone'),
                    'LogoUrl': body.get('logoUrl'),
                    'Colors': body.get('colors', []),
                    'Platforms': body.get('platforms', ['Instagram']),
                    'UpdatedAt': int(time.time())
                }
                if body.get('targetAudience'): brand_item['TargetAudience'] = body.get('targetAudience')
                table.put_item(Item=brand_item)
                print(f"SUCCESS | Brand saved for {user_id}")
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Aura Initialized'})}
            
            elif method == 'GET':
                response = table.get_item(Key={'UserId': user_id})
                if 'Item' in response:
                    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(response['Item'], cls=DecimalEncoder)}
                print(f"INFO | Brand not found for user {user_id}")
                return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Brand not found'})}

        # --- 3. CHAT & HISTORY (Root Path) ---
        if path == "/" or path == "":
            print(f"DEBUG | Route Hit: Chat/History | Method: {method}")
            if method == 'GET':
                table = dynamodb_resource.Table(TABLE_NAME)
                response = table.query(KeyConditionExpression=Key('UserId').eq(user_id), ScanIndexForward=False, Limit=50)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'history': response.get('Items', [])}, cls=DecimalEncoder)}

            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                user_prompt = body.get('prompt', '')
                session_id = body.get('sessionId') or str(uuid.uuid4())
                file_obj = body.get('file')

                # Fetch Brand Context
                brand_table = dynamodb_resource.Table(BRANDS_TABLE)
                brand_res = brand_table.get_item(Key={'UserId': user_id})
                brand_info = brand_res.get('Item', {})
                
                brand_context = "No specific brand context found."
                if brand_info:
                    brand_context = (
                        f"Brand Name: {brand_info.get('BrandName')}\n"
                        f"Industry: {brand_info.get('Industry')}\n"
                        f"Tone: {brand_info.get('Tone')}\n"
                    )

                ai_response = ""
                if file_obj:
                    # Multimodal Logic (No changes to your core logic)
                    file_bytes = base64.b64decode(file_obj['data'])
                    message_content = []
                    system_instr = f"Act as an AI for the following brand:\n{brand_context}"
                    if file_obj['type'] == 'application/pdf':
                        message_content.append({"document": {"name": "doc", "format": "pdf", "source": {"bytes": file_bytes}}})
                    elif file_obj['type'].startswith('image/'):
                        fmt = file_obj['type'].split('/')[-1].replace('jpg', 'jpeg')
                        message_content.append({"image": {"format": fmt, "source": {"bytes": file_bytes}}})
                    message_content.append({"text": f"{system_instr}\n\nUser Question: {user_prompt}"})
                    response = bedrock_runtime.converse(modelId="us.amazon.nova-lite-v1:0", messages=[{"role": "user", "content": message_content}])
                    ai_response = response['output']['message']['content'][0]['text']
                else:
                    # Agent Path
                    print(f"DEBUG | Invoking Agent for session {session_id}")
                    response = agent_client.invoke_agent(
                        agentId=AGENT_ID, agentAliasId=AGENT_ALIAS_ID,
                        sessionId=session_id, inputText=user_prompt,
                        sessionState={'sessionAttributes': {'brandContext': brand_context}}
                    )
                    ai_response = "".join([chunk.get('chunk', {}).get('bytes', b'').decode('utf-8') for chunk in response.get('completion')])

                # Save Memory
                memory_table = dynamodb_resource.Table(TABLE_NAME)
                memory_table.put_item(Item={
                    'UserId': user_id, 'Timestamp': int(time.time()), 'SessionId': session_id,
                    'UserMessage': user_prompt, 'AgentResponse': ai_response
                })
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'response': ai_response, 'sessionId': session_id})}

        # Catch-all for undefined routes
        print(f"WARNING | Unhandled Route: {method} {path}")
        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Route Not Found'})}

    except Exception as e:
        # FULL STACK TRACE IN CLOUDWATCH
        print("!!! CRITICAL ERROR !!!")
        traceback.print_exc() 
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e), 'stack': traceback.format_exc()})}