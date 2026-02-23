import json
import boto3
import os
import uuid
import datetime
import base64
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key, Attr

# --- Configuration (VinciFlow Specs) ---
# Terraform se ye env vars set honge
AGENT_ID = os.environ.get('BEDROCK_AGENT_ID', 'Y65UM8CFJP') 
AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID', 'TSTALIASID') 
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'vinciflow-dev-memory')

# --- CLIENT CONFIGURATION ---

# 1. For Multimodal/Files (Bypass Agent for speed)
# Nova Lite is extremely fast on US Inference Profiles
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")

# 2. For Agent Logic (Action Groups & Search)
# Mumbai region jahan aapka Bedrock Agent reside karta hai
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1") 

# 3. Database (Memory Storage)
dynamodb = boto3.resource('dynamodb', region_name="ap-south-1")

ALLOWED_ORIGINS = {
    'http://localhost:5173',
    'https://main.d3h4csxsp92hux.amplifyapp.com', # Aapka production link
}

# --- Helper Functions (CoreX Legacy) ---
def get_header(headers, key):
    if not headers: return None
    key_lower = key.lower()
    for k, v in headers.items():
        if k.lower() == key_lower: return v
    return None

def get_cors_headers(request_origin):
    origin = request_origin if request_origin in ALLOWED_ORIGINS else list(ALLOWED_ORIGINS)[1]
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

def get_user_id(event):
    """Extracts Cognito sub for personalization"""
    try:
        if 'requestContext' in event and 'authorizer' in event['requestContext']:
            claims = event['requestContext']['authorizer'].get('claims', {})
            return claims.get('sub')
    except Exception: return None
    return None

def get_recent_history_as_text(user_id, session_id, limit=6):
    """Fetches history from DynamoDB for context injection"""
    try:
        table = dynamodb.Table(TABLE_NAME)
        response = table.query(
            KeyConditionExpression=Key('UserId').eq(user_id),
            FilterExpression=Attr('SessionId').eq(session_id),
            ScanIndexForward=False 
        )
        items = response.get('Items', [])
        recent_items = items[:limit]
        recent_items.reverse()
        
        history_text = ""
        for item in recent_items:
            u_msg = item.get('UserMessage', '')
            a_msg = item.get('AgentResponse', '')
            if u_msg: history_text += f"User: {u_msg}\n"
            if a_msg: history_text += f"Assistant: {a_msg}\n"
        return history_text
    except Exception as e:
        print(f"Error fetching history: {e}")
        return ""

# --- CORE HANDLER ---
def handler(event, context):
    headers = event.get('headers', {}) or {}
    request_origin = get_header(headers, 'origin')
    cors_headers = get_cors_headers(request_origin)

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    user_id = get_user_id(event)
    method = event.get('httpMethod')

    # --- GET: Fetch VinciFlow Chat History ---
    if method == 'GET':
        if not user_id: return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}
        try:
            table = dynamodb.Table(TABLE_NAME)
            response = table.query(KeyConditionExpression=Key('UserId').eq(user_id), ScanIndexForward=True)
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'history': response.get('Items', [])})}
        except Exception as e:
            return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}

    # --- POST: AI Engine Logic ---
    elif method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            user_prompt = body.get('prompt', '')
            session_id = body.get('sessionId') or str(uuid.uuid4())
            is_temporary = body.get('isTemporary', False)
            file_obj = body.get('file', None)

            if not user_prompt and not file_obj:
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': 'No input provided'})}

            ai_response = ""

            # PATH A: MULTIMODAL (Nova Lite Converse API)
            # Efficient for logo/image analysis in branding tasks
            if file_obj:
                print(f"Multimodal Path (us-east-1) | Session {session_id}")
                history_text = get_recent_history_as_text(user_id, session_id) if user_id and not is_temporary else ""
                full_prompt = f"History:\n{history_text}\n\nUser: {user_prompt}" if history_text else user_prompt
                
                message_content = []
                file_bytes = base64.b64decode(file_obj['data'])
                
                if file_obj['type'] == 'application/pdf':
                    message_content.append({"document": {"name": "doc", "format": "pdf", "source": {"bytes": file_bytes}}})
                elif file_obj['type'].startswith('image/'):
                    fmt = file_obj['type'].split('/')[-1].replace('jpg', 'jpeg')
                    message_content.append({"image": {"format": fmt, "source": {"bytes": file_bytes}}})
                
                if full_prompt: message_content.append({"text": full_prompt})

                response = bedrock_runtime.converse(
                    modelId="us.amazon.nova-lite-v1:0", # Cross-region profile
                    messages=[{"role": "user", "content": message_content}],
                    inferenceConfig={"maxTokens": 1000, "temperature": 0.7}
                )
                ai_response = response['output']['message']['content'][0]['text']

            # PATH B: STRATEGIC TEXT (Bedrock Agent)
            # Handles branding strategy and Action Group execution
            else:
                print(f"Agent Path (ap-south-1) | Session {session_id}")
                history_text = get_recent_history_as_text(user_id, session_id) if user_id and not is_temporary else ""
                agent_input = f"Context:\n{history_text}\n\nRequest: {user_prompt}" if history_text else user_prompt

                response = agent_client.invoke_agent(
                    agentId=AGENT_ID,
                    agentAliasId=AGENT_ALIAS_ID,
                    sessionId=session_id,
                    inputText=agent_input
                )

                completion = ""
                for event_stream in response.get('completion'):
                    chunk = event_stream.get('chunk')
                    if chunk: completion += chunk.get('bytes').decode('utf-8')
                ai_response = completion

            # --- SAVE INTERACTION ---
            if user_id and not is_temporary:
                try:
                    table = dynamodb.Table(TABLE_NAME)
                    user_msg_stored = f"[File: {file_obj['name']}] {user_prompt}" if file_obj else user_prompt
                    table.put_item(Item={
                        'UserId': user_id,
                        'Timestamp': datetime.datetime.utcnow().isoformat(),
                        'SessionId': session_id,
                        'UserMessage': user_msg_stored,
                        'AgentResponse': ai_response
                    })
                except Exception as e: print(f"DB Save Error: {e}")

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'response': ai_response, 'sessionId': session_id})
            }

        except Exception as e:
            print(f"Error: {e}")
            return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}
            
    return {'statusCode': 405, 'headers': cors_headers, 'body': ''}