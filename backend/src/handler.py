import json
import boto3
import os
import uuid
import time
import base64
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

# --- Configuration (VinciFlow Specs) ---
AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'Y65UM8CFJP') 
AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'TSTALIASID') 
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME') 
BRANDS_TABLE = os.environ.get('BRANDS_TABLE_NAME') 

# --- CLIENTS ---
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1") 
dynamodb_resource = boto3.resource('dynamodb', region_name="ap-south-1")

ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'https://main.d3h4csxsp92hux.amplifyapp.com',
    'https://dev.d3h4csxsp92hux.amplifyapp.com'
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
    try:
        return event['requestContext']['authorizer']['jwt']['claims']['sub']
    except:
        try:
            return event['requestContext']['authorizer']['claims']['sub']
        except:
            return None

def handler(event, context):
    path = event.get('rawPath', '/') 
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    cors_headers = get_cors_headers(event)

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    user_id = get_user_id(event)
    if not user_id:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}

    # --- 1. BRAND PROFILE ROUTES (/brand) ---
    if path == "/brand":
        table = dynamodb_resource.Table(BRANDS_TABLE)
        
        if method == 'POST':
            try:
                body = json.loads(event.get('body', '{}'))
                
                # Constructing the Item with V1 and V1.5 fields
                brand_item = {
                    'UserId': user_id,
                    # Mandatory (v1)
                    'BrandName': body.get('brandName'),
                    'Industry': body.get('industry'),
                    'Region': body.get('region'),
                    'Tone': body.get('tone'), # Now a long defined string
                    'LogoUrl': body.get('logoUrl'),
                    'Colors': body.get('colors', []), # List of hex codes
                    'Platforms': body.get('platforms', ['Instagram']), # Default V1
                    'UpdatedAt': int(time.time())
                }

                # Optional (v1.5) - Sirf tabhi add honge jab body mein honge
                if body.get('targetAudience'): brand_item['TargetAudience'] = body.get('targetAudience')
                if body.get('doWords'): brand_item['DoWords'] = body.get('doWords')
                if body.get('dontWords'): brand_item['DontWords'] = body.get('dontWords')
                if body.get('competitors'): brand_item['Competitors'] = body.get('competitors')

                table.put_item(Item=brand_item)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Aura Initialized'})}
            except Exception as e:
                return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}

        elif method == 'GET':
            try:
                response = table.get_item(Key={'UserId': user_id})
                if 'Item' in response:
                    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(response['Item'], cls=DecimalEncoder)}
                return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Brand not found'})}
            except Exception as e:
                return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}

    # --- 2. CHAT & HISTORY ROUTES (Default /) ---
    else:
        # GET: Fetch History
        if method == 'GET':
            try:
                table = dynamodb_resource.Table(TABLE_NAME)
                response = table.query(
                    KeyConditionExpression=Key('UserId').eq(user_id), 
                    ScanIndexForward=False, Limit=50
                )
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'history': response.get('Items', [])}, cls=DecimalEncoder)}
            except Exception as e:
                return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}

        # POST: AI Chat Logic
        elif method == 'POST':
            try:
                body = json.loads(event.get('body', '{}'))
                user_prompt = body.get('prompt', '')
                session_id = body.get('sessionId') or str(uuid.uuid4())
                file_obj = body.get('file')

                ai_response = ""
                # Logic to fetch brand context for AI could go here in Phase 2
                
                if file_obj:
                    file_bytes = base64.b64decode(file_obj['data'])
                    message_content = []
                    if file_obj['type'] == 'application/pdf':
                        message_content.append({"document": {"name": "doc", "format": "pdf", "source": {"bytes": file_bytes}}})
                    elif file_obj['type'].startswith('image/'):
                        fmt = file_obj['type'].split('/')[-1].replace('jpg', 'jpeg')
                        message_content.append({"image": {"format": fmt, "source": {"bytes": file_bytes}}})
                    if user_prompt: message_content.append({"text": user_prompt})
                    
                    response = bedrock_runtime.converse(
                        modelId="us.amazon.nova-lite-v1:0", 
                        messages=[{"role": "user", "content": message_content}]
                    )
                    ai_response = response['output']['message']['content'][0]['text']
                else:
                    response = agent_client.invoke_agent(
                        agentId=AGENT_ID, agentAliasId=AGENT_ALIAS_ID,
                        sessionId=session_id, inputText=user_prompt
                    )
                    completion = "".join([chunk.get('chunk', {}).get('bytes', b'').decode('utf-8') for chunk in response.get('completion')])
                    ai_response = completion

                # Save to Memory Table
                memory_table = dynamodb_resource.Table(TABLE_NAME)
                memory_table.put_item(Item={
                    'UserId': user_id,
                    'Timestamp': int(time.time()),
                    'SessionId': session_id,
                    'UserMessage': f"[File: {file_obj['name']}] {user_prompt}" if file_obj else user_prompt,
                    'AgentResponse': ai_response
                })

                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'response': ai_response, 'sessionId': session_id})}
            except Exception as e:
                return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}
                
    return {'statusCode': 405, 'headers': cors_headers, 'body': 'Method Not Allowed'}