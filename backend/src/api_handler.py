import json, uuid, time, base64, hashlib, secrets, traceback, requests, boto3, os
from utils import dynamodb_resource, get_cors_headers, get_user_id, BRANDS_TABLE, TABLE_NAME, ASSETS_BUCKET, DecimalEncoder

# API-Specific Clients
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1")
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
sfn_client = boto3.client('stepfunctions', region_name="ap-south-1")
ssm_client = boto3.client('ssm', region_name="ap-south-1")
s3_client = boto3.client('s3', region_name="ap-south-1")

X_CLIENT_ID = os.environ.get('X_CLIENT_ID')
X_CLIENT_SECRET = os.environ.get('X_CLIENT_SECRET')
X_REDIRECT_URI = "https://dev.d8aheoykcvs8k.amplifyapp.com/chat"

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod')
    path = event.get('rawPath') or event.get('path') or '/'
    cors_headers = get_cors_headers(event)

    if method == 'OPTIONS': return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
    user_id = get_user_id(event)
    if not user_id: return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}

    try:
        # --- AUTH LOGIC ---
        if "/auth/x" in path:
            table = dynamodb_resource.Table(BRANDS_TABLE)
            if method == "GET":
                code_verifier = secrets.token_urlsafe(64)
                code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode()).digest()).decode().replace('=', '')
                state = secrets.token_urlsafe(16)
                table.update_item(Key={'UserId': user_id}, UpdateExpression="SET x_code_verifier = :cv, x_state = :st", ExpressionAttributeValues={':cv': code_verifier, ':st': state})
                auth_url = f"https://x.com/i/oauth2/authorize?response_type=code&client_id={X_CLIENT_ID}&redirect_uri={X_REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={state}&code_challenge={code_challenge}&code_challenge_method=s256"
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'authUrl': auth_url})}
            
            if method == "POST" and "/callback" in path:
                body = json.loads(event.get('body', '{}'))
                user_brand = table.get_item(Key={'UserId': user_id}).get('Item', {})
                auth_header = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
                resp = requests.post("https://api.x.com/2/oauth2/token", headers={"Authorization": f"Basic {auth_header}", "Content-Type": "application/x-www-form-urlencoded"}, 
                                     data={"code": body.get('code'), "grant_type": "authorization_code", "redirect_uri": X_REDIRECT_URI, "code_verifier": user_brand.get('x_code_verifier')})
                tokens = resp.json()
                if 'access_token' in tokens:
                    table.update_item(Key={'UserId': user_id}, UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt, x_connected = :c REMOVE x_code_verifier, x_state", 
                                     ExpressionAttributeValues={':at': tokens['access_token'], ':rt': tokens.get('refresh_token'), ':c': True})
                    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'X successfully linked!'})}
                return {'statusCode': 400, 'headers': cors_headers, 'body': json.dumps({'error': tokens})}

        # --- CHAT & STEP FUNCTION LOGIC ---
        if path == "/" or path == "":
            if method == 'GET':
                table = dynamodb_resource.Table(TABLE_NAME)
                response = table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key('UserId').eq(user_id), ScanIndexForward=True, Limit=50)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'history': response.get('Items', [])}, cls=DecimalEncoder)}

            if method == 'POST':
                body = json.loads(event.get('body', '{}'))
                user_prompt = body.get('prompt', '').strip() or "Hello"
                session_id = body.get('sessionId') or str(uuid.uuid4())
                brand_info = dynamodb_resource.Table(BRANDS_TABLE).get_item(Key={'UserId': user_id}).get('Item', {})
                
                if any(w in user_prompt.lower() for w in ["create", "generate", "post"]) and any(c.isdigit() for c in user_prompt):
                    sfn_arn = ssm_client.get_parameter(Name=f"/vinciflow/dev/state_machine_arn")['Parameter']['Value']
                    sfn_client.start_execution(stateMachineArn=sfn_arn, input=json.dumps({"userId": user_id, "sessionId": session_id, "prompt": user_prompt, "task": "PARSE", "brandContext": {"name": brand_info.get('BrandName'), "industry": brand_info.get('Industry'), "tone": brand_info.get('Tone')}}))
                    return {'statusCode': 202, 'headers': cors_headers, 'body': json.dumps({'message': 'Pipeline Started'})}

                # Multimodal / Agent logic exactly as provided
                file_obj = body.get('file')
                if file_obj:
                    file_bytes = base64.b64decode(file_obj['data'])
                    msg = [{"role": "user", "content": [{"text": f"Act as AI for {brand_info.get('BrandName')}. User: {user_prompt}"}]}]
                    if file_obj['type'] == 'application/pdf': msg[0]['content'].insert(0, {"document": {"name": "doc", "format": "pdf", "source": {"bytes": file_bytes}}})
                    res = bedrock_runtime.converse(modelId="us.amazon.nova-lite-v1:0", messages=msg)
                    ai_response = res['output']['message']['content'][0]['text']
                else:
                    res = agent_client.invoke_agent(agentId=os.environ.get('BEDROCK_AGENT_ID'), agentAliasId=os.environ.get('BEDROCK_AGENT_ALIAS_ID'), sessionId=session_id, inputText=user_prompt)
                    ai_response = "".join([chunk.get('chunk', {}).get('bytes', b'').decode('utf-8') for chunk in res.get('completion')])
                
                dynamodb_resource.Table(TABLE_NAME).put_item(Item={'UserId': user_id, 'Timestamp': int(time.time()), 'SessionId': session_id, 'UserMessage': user_prompt, 'AgentResponse': ai_response})
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'response': ai_response, 'sessionId': session_id})}

        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Not Found'})}
    except Exception as e:
        traceback.print_exc()
        return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}