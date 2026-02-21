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
    try:
        # 1. Correct HTTP API v2 metadata extraction
        request_context = event.get('requestContext', {})
        http_info = request_context.get('http', {})
        method = http_info.get('method')
        
        # 2. Secure Identity Extraction (JWT Authorizer path)
        user_id = request_context.get('authorizer', {}).get('jwt', {}).get('claims', {}).get('sub', 'anonymous')

        # --- Handle POST (The Chat/Generate Flow) ---
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_message = body.get('message', '')

            # A. Fetch last 5 messages for Brand Memory
            history_items = table.query(
                KeyConditionExpression=Key('UserId').eq(user_id),
                Limit=5,
                ScanIndexForward=False
            ).get('Items', [])
            
            # B. Build context for Gemini
            memory_string = " ".join([item.get('Message', '') for item in history_items])
            full_prompt = f"System: Use this previous context: {memory_string}. User: {user_message}"

            # C. Call Gemini
            ai_response = model.generate_content(full_prompt)
            final_text = ai_response.text

            # D. Save this turn to DynamoDB
            table.put_item(Item={
                'UserId': user_id,
                'Timestamp': int(time.time()), # Faster native timestamp
                'Message': user_message,
                'AIResponse': final_text
            })

            return respond(200, {
                "message": final_text,
                "status": "success"
            })

        return respond(405, {"error": "Method not allowed"})

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        return respond(500, {"error": "Internal Server Error", "details": str(e)})

def respond(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", # Matches your TF config
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        "body": json.dumps(body)
    }