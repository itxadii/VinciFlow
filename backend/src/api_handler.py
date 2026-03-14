import json, uuid, time, base64, hashlib, secrets, traceback, requests, boto3, os
from utils import dynamodb_resource, get_cors_headers, get_user_id, BRANDS_TABLE, TABLE_NAME, DecimalEncoder, s3_client, ssm_client

# Specific Clients
agent_client = boto3.client('bedrock-agent-runtime', region_name="ap-south-1")
bedrock_runtime = boto3.client('bedrock-runtime', region_name="us-east-1")
sfn_client = boto3.client('stepfunctions', region_name="ap-south-1")
scheduler_client = boto3.client('scheduler', region_name="ap-south-1")

# Env Config
X_CLIENT_ID = os.environ.get('X_CLIENT_ID')
X_CLIENT_SECRET = os.environ.get('X_CLIENT_SECRET')
X_REDIRECT_URI = "https://dev.d8aheoykcvs8k.amplifyapp.com/chat"
ASSETS_BUCKET = os.environ.get('ASSETS_BUCKET_NAME')
SCHEDULER_ROLE_ARN = os.environ.get('SCHEDULER_ROLE_ARN')
PUBLISH_LAMBDA_ARN = os.environ.get('PUBLISH_LAMBDA_ARN') 
AGENT_ID = os.environ.get('BEDROCK_AGENT_ID')
AGENT_ALIAS_ID = os.environ.get('BEDROCK_AGENT_ALIAS_ID')

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath') or event.get('path') or '/'
    normalized_path = path.strip('/') 
    cors_headers = get_cors_headers(event)

    if method == 'OPTIONS': return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
    user_id = get_user_id(event)
    if not user_id: return {'statusCode': 401, 'headers': cors_headers, 'body': json.dumps({'error': 'Unauthorized'})}

    try:
        # --- 1. BRAND & ONBOARDING ---
        if normalized_path == "brand":
            table = dynamodb_resource.Table(BRANDS_TABLE)
            if method == 'GET':
                item = table.get_item(Key={'UserId': user_id}).get('Item')
                if not item: return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': 'Profile not found'})}
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(item, cls=DecimalEncoder)}
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                logo_url = body.get('logoUrl')
                if body.get('logoBase64'):
                    logo_content = base64.b64decode(body['logoBase64'].split(',')[-1])
                    s3_key = f"logos/{user_id}_logo.svg"
                    s3_client.put_object(Bucket=ASSETS_BUCKET, Key=s3_key, Body=logo_content, ContentType='image/svg+xml')
                    logo_url = f"https://{ASSETS_BUCKET}.s3.amazonaws.com/{s3_key}"
                brand_item = {'UserId': user_id, 'BrandName': body.get('brandName') or body.get('BrandName'), 'Industry': body.get('industry') or body.get('Industry'), 'Tone': body.get('tone') or body.get('Tone'), 'LogoUrl': logo_url, 'UpdatedAt': int(time.time())}
                table.put_item(Item=brand_item)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Aura Initialized', 'logoUrl': logo_url})}

        # --- 2. AUTH & SCHEDULING ---
        if "auth/x" in normalized_path:
            table = dynamodb_resource.Table(BRANDS_TABLE)
            if method == "GET" and normalized_path == "auth/x":
                cv, st = secrets.token_urlsafe(64), secrets.token_urlsafe(16)
                ch = base64.urlsafe_b64encode(hashlib.sha256(cv.encode()).digest()).decode().replace('=', '')
                table.update_item(Key={'UserId': user_id}, UpdateExpression="SET x_code_verifier = :cv, x_state = :st", ExpressionAttributeValues={':cv': cv, ':st': st})
                auth_url = f"https://x.com/i/oauth2/authorize?response_type=code&client_id={X_CLIENT_ID}&redirect_uri={X_REDIRECT_URI}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={st}&code_challenge={ch}&code_challenge_method=s256"
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'authUrl': auth_url})}

        if normalized_path == "schedule" and method == "POST":
            body = json.loads(event.get('body', '{}'))
            post_id, target_time = int(body.get('timestamp')), body.get('scheduledTime')
            dynamodb_resource.Table(TABLE_NAME).update_item(Key={'UserId': user_id, 'Timestamp': post_id}, UpdateExpression="SET #s = :s, ScheduledTime = :st", ExpressionAttributeNames={'#s': 'Status'}, ExpressionAttributeValues={':s': 'SCHEDULED', ':st': target_time})
            scheduler_client.create_schedule(
                Name=f"VF-Post-{user_id[:8]}-{post_id}", ScheduleExpression=f"at({target_time})", FlexibleTimeWindow={'Mode': 'OFF'}, ScheduleExpressionTimezone="Asia/Kolkata",
                Target={'Arn': PUBLISH_LAMBDA_ARN, 'RoleArn': SCHEDULER_ROLE_ARN, 'Input': json.dumps({'userId': user_id, 'timestamp': post_id, 'task': 'PUBLISH_X'})},
                ActionAfterCompletion='DELETE'
            )
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'message': 'Scheduled!'})}

        # --- 4. CHAT / ROOT ---
        if normalized_path == "" or normalized_path == "/":
            if method == 'GET':
                res = dynamodb_resource.Table(TABLE_NAME).query(KeyConditionExpression=boto3.dynamodb.conditions.Key('UserId').eq(user_id), ScanIndexForward=False, Limit=50)
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'history': res.get('Items', [])}, cls=DecimalEncoder)}
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                user_prompt = body.get('prompt', '').strip() or "Hello"
                session_id = body.get('sessionId') or str(uuid.uuid4())
                file_obj = body.get('file')
                brand_info = dynamodb_resource.Table(BRANDS_TABLE).get_item(Key={'UserId': user_id}).get('Item', {})
                b_name = brand_info.get('BrandName', 'Global Brand')
                b_industry = brand_info.get('Industry', 'Lifestyle')
                b_tone = brand_info.get('Tone', 'Professional')

                # ── Fetch last 5 messages for this session as conversation history ──
                hist_resp = dynamodb_resource.Table(TABLE_NAME).query(
                    KeyConditionExpression=boto3.dynamodb.conditions.Key('UserId').eq(user_id),
                    FilterExpression=boto3.dynamodb.conditions.Attr('SessionId').eq(session_id),
                    ScanIndexForward=False,
                    Limit=10
                )
                past = list(reversed(hist_resp.get('Items', [])))[-5:]  # last 5 pairs

                # Build Nova Lite conversation history
                conversation = []
                for h in past:
                    if h.get('UserMessage'):
                        conversation.append({"role": "user", "content": [{"text": h['UserMessage']}]})
                    if h.get('AgentResponse'):
                        conversation.append({"role": "assistant", "content": [{"text": h['AgentResponse']}]})
                # Add current message
                conversation.append({"role": "user", "content": [{"text": user_prompt}]})

                system_instr = (
                    f"You are VinciFlow Aura, the dedicated Creative Partner for '{b_name}' ({b_industry}). "
                    f"Your role is to help the brand automate social media content using a {b_tone} tone. "
                    f"IMPORTANT FLOW: When a user wants to create a post but hasn't given a date/time, "
                    f"ask them for the schedule time. Once they provide it, confirm back with: "
                    f"'Got it! I'll generate a post about [TOPIC] scheduled for [TIME]. Preparing your flow now...'. "
                    f"Do NOT trigger anything yourself — just confirm clearly so the system can detect it."
                )

                # ── Check if this is a follow-up with timing info ──
                # Look back in history for pending topic
                pending_topic = None
                for h in reversed(past):
                    agent_resp = h.get('AgentResponse', '').lower()
                    # Detect if previous assistant message was asking for time
                    if any(phrase in agent_resp for phrase in ['what time', 'when would you like', 'schedule it', 'provide the time', 'what date']):
                        pending_topic = h.get('UserMessage', '')
                        break

                # ── If user is providing time as follow-up to a topic ──
                has_date = any(w in user_prompt.lower() for w in ['january', 'february', 'march', 'april', 'may', 'june',
                    'july', 'august', 'september', 'october', 'november', 'december',
                    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                    'tomorrow', 'tonight', 'today', 'pm', 'am', ':']) or any(c.isdigit() for c in user_prompt)

                is_post_request = any(w in user_prompt.lower() for w in ["create", "generate", "post", "make"])

                # Trigger Step Function if:
                # 1. Direct request with date in same message
                # 2. Follow-up providing time after topic was already given
                should_trigger_sfn = (
                    (is_post_request and has_date) or
                    (pending_topic and has_date and not is_post_request)
                )

                if should_trigger_sfn:
                    # Build combined prompt from topic + timing if it's a follow-up
                    if pending_topic and not is_post_request:
                        combined_prompt = f"{pending_topic} Schedule it for: {user_prompt}"
                    else:
                        combined_prompt = user_prompt

                    sfn_arn = ssm_client.get_parameter(Name="/vinciflow/dev/state_machine_arn")['Parameter']['Value']
                    execution = sfn_client.start_execution(
                        stateMachineArn=sfn_arn,
                        input=json.dumps({
                            "userId": user_id,
                            "sessionId": session_id,
                            "prompt": combined_prompt,  # ✅ full context: topic + time
                            "task": "PARSE",
                            "brandContext": {
                                "name": brand_info.get('BrandName'),
                                "industry": brand_info.get('Industry'),
                                "tone": brand_info.get('Tone')
                            }
                        })
                    )
                    execution_arn = execution['executionArn']

                    # Poll for result
                    start = time.time()
                    while time.time() - start < 25:
                        time.sleep(2)
                        desc = sfn_client.describe_execution(executionArn=execution_arn)
                        sfn_status = desc['status']

                        if sfn_status == 'SUCCEEDED':
                            output = json.loads(desc['output'])
                            if output.get('task') == 'AWAIT_CLARIFICATION':
                                return {
                                    'statusCode': 200,
                                    'headers': cors_headers,
                                    'body': json.dumps({
                                        'task': 'AWAIT_CLARIFICATION',
                                        'message': output.get('message'),
                                        'response': output.get('message')
                                    })
                                }
                            return {
                                'statusCode': 200,
                                'headers': cors_headers,
                                'body': json.dumps({'message': 'Pipeline Started'})
                            }
                        elif sfn_status in ('FAILED', 'TIMED_OUT', 'ABORTED'):
                            return {
                                'statusCode': 500,
                                'headers': cors_headers,
                                'body': json.dumps({'error': f'Pipeline {sfn_status}'})
                            }

                    return {
                        'statusCode': 202,
                        'headers': cors_headers,
                        'body': json.dumps({'message': 'Pipeline Started'})
                    }

                # ── Normal conversational response ──────────────────────────────
                ai_response = ""
                if file_obj:
                    file_bytes = base64.b64decode(file_obj['data'])
                    system_instr_file = (
                        f"You are VinciFlow Aura, Creative Partner for '{b_name}' ({b_industry}). "
                        f"Tone: {b_tone}. Analyze the file and help with content creation."
                    )
                    message_content = []
                    if file_obj['type'] == 'application/pdf':
                        message_content.append({"document": {"name": "doc", "format": "pdf", "source": {"bytes": file_bytes}}})
                    elif file_obj['type'].startswith('image/'):
                        fmt = file_obj['type'].split('/')[-1].replace('jpg', 'jpeg')
                        message_content.append({"image": {"format": fmt, "source": {"bytes": file_bytes}}})
                    message_content.append({"text": f"{system_instr_file}\n\nUser: {user_prompt}"})
                    response = bedrock_runtime.converse(
                        modelId="us.amazon.nova-lite-v1:0",
                        messages=[{"role": "user", "content": message_content}]
                    )
                    ai_response = response['output']['message']['content'][0]['text']
                else:
                    # ✅ Pass full conversation history — this IS the memory
                    response = bedrock_runtime.converse(
                        modelId="us.amazon.nova-lite-v1:0",
                        system=[{"text": system_instr}],
                        messages=conversation  # ✅ full history included
                    )
                    ai_response = response['output']['message']['content'][0]['text']

                # Save to DynamoDB
                dynamodb_resource.Table(TABLE_NAME).put_item(Item={
                    'UserId': user_id,
                    'Timestamp': int(time.time()),
                    'SessionId': session_id,
                    'UserMessage': user_prompt,
                    'AgentResponse': ai_response
                })
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'response': ai_response, 'sessionId': session_id})
                }

        return {'statusCode': 404, 'headers': cors_headers, 'body': json.dumps({'error': f"Route {path} Not Found"})}
    except Exception as e:
        traceback.print_exc(); return {'statusCode': 500, 'headers': cors_headers, 'body': json.dumps({'error': str(e)})}