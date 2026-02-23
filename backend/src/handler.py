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

# --- CLIENTS ---
# Bedrock Multimodal (Nova Lite) calls us-east-1
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
# Agent calls Mumbai
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
            # Agar decimal hai toh integer bana do (Timestamp ke liye)
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
    """Robust Cognito sub extraction for HTTP API v2 and REST v1"""
    try:
        # HTTP API v2 logic (jwt object)
        return event['requestContext']['authorizer']['jwt']['claims']['sub']
    except:
        try:
            # REST API v1 fallback
            return event['requestContext']['authorizer']['claims']['sub']
        except:
            return None

def handler(event, context):
    print(f"Bhai Event Aaya: {json.dumps(event)}")
    
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    cors_headers = get_cors_headers(event)

    # 1. OPTIONS check (CORS Handshake)
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    user_id = get_user_id(event)
    if not user_id:
        return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized: No token'})}

    # --- GET: Fetch History (For Sidebar) ---
    if method == 'GET':
        if not user_id: return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}
        try:
            table = dynamodb_resource.Table(TABLE_NAME)
            response = table.query(
                KeyConditionExpression=Key('UserId').eq(user_id), 
                ScanIndexForward=False,
                Limit=50
            )
            
            # FIX: DecimalEncoder use karo taaki Timestamp crash na ho
            return {
                'statusCode': 200, 
                'headers': cors_headers, 
                'body': json.dumps({'history': response.get('Items', [])}, cls=DecimalEncoder)
            }
        except Exception as e:
            print(f"GET Error: {str(e)}")
            return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}

    # --- POST: AI Chat Logic ---
    elif method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            user_prompt = body.get('prompt', '')
            session_id = body.get('sessionId') or str(uuid.uuid4())
            file_obj = body.get('file')

            ai_response = ""

            # PATH A: MULTIMODAL (Nova Lite)
            if file_obj:
                print(f"Multimodal Path (us-east-1) | Session {session_id}")
                message_content = []
                file_bytes = base64.b64decode(file_obj['data'])
                
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

            # PATH B: AGENT (ap-south-1)
            else:
                print(f"Agent Path (ap-south-1) | Session {session_id}")
                response = agent_client.invoke_agent(
                    agentId=AGENT_ID, agentAliasId=AGENT_ALIAS_ID,
                    sessionId=session_id, inputText=user_prompt
                )
                completion = "".join([chunk.get('chunk', {}).get('bytes', b'').decode('utf-8') 
                                    for chunk in response.get('completion')])
                ai_response = completion

            # --- DYNAMODB SAVE (Fixed Timestamp Type) ---
            table = dynamodb_resource.Table(TABLE_NAME)
            table.put_item(Item={
                'UserId': user_id,
                'Timestamp': int(time.time()), # Store as Number (N)
                'SessionId': session_id,
                'UserMessage': f"[File: {file_obj['name']}] {user_prompt}" if file_obj else user_prompt,
                'AgentResponse': ai_response
            })

            return {
                'statusCode': 200, 
                'headers': cors_headers, 
                'body': json.dumps({'response': ai_response, 'sessionId': session_id})
            }

        except Exception as e:
            print(f"POST Error: {e}")
            return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}
            
    return {'statusCode': 405, 'headers': cors_headers, 'body': 'Method Not Allowed'}