import os
import json
import boto3
import time
from boto3.dynamodb.conditions import Key
import google.generativeai as genai

# Initialize outside handler for Lambda 'Warm Starts'
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def handler(event, context):
    # 1. IMMEDIATE LOGGING: This is what you see in CloudWatch
    print(f"DEBUG: Full Event received: {json.dumps(event)}")
    
    try:
        request_context = event.get('requestContext', {})
        http_info = request_context.get('http', {})
        method = http_info.get('method')
        
        # Identity Extraction (Matches your Cognito setup)
        user_id = request_context.get('authorizer', {}).get('jwt', {}).get('claims', {}).get('sub', 'anonymous')

        if method == 'POST':
            try:
                body = json.loads(event.get('body', '{}'))
                user_message = body.get('message', '')
                
                if not user_message:
                    return respond(400, {"error": "No message provided"})

                # A. Fetch Brand Memory
                history_items = table.query(
                    KeyConditionExpression=Key('UserId').eq(user_id),
                    Limit=5,
                    ScanIndexForward=False
                ).get('Items', [])
                
                # B. Build context
                memory_string = " ".join([item.get('Message', '') for item in history_items])
                full_prompt = f"System: Use this context: {memory_string}. User: {user_message}"

                # C. Call Gemini
                ai_response = model.generate_content(full_prompt)
                
                # Safety handle for blocked responses
                if hasattr(ai_response, 'text') and ai_response.text:
                    final_text = ai_response.text
                else:
                    print("DEBUG: Gemini response was blocked or empty")
                    final_text = "I'm sorry, I couldn't generate a response for that."

                # D. Save to DynamoDB
                table.put_item(Item={
                    'UserId': user_id,
                    'Timestamp': int(time.time()),
                    'Message': user_message,
                    'AIResponse': final_text
                })

                return respond(200, {"message": final_text, "status": "success"})

            except json.JSONDecodeError as json_err:
                print(f"ERROR: JSON Parsing failed: {str(json_err)}")
                return respond(400, {"error": "Invalid JSON body"})

        return respond(405, {"error": "Method not allowed"})

    except Exception as e:
        # 2. CRITICAL LOGGING: Logs the exact traceback to CloudWatch
        print(f"CRITICAL ERROR: {str(e)}")
        return respond(500, {"error": "Internal Server Error", "details": str(e)})

def respond(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        "body": json.dumps(body)
    }