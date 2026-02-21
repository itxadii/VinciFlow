import os
import json
import boto3
import time
from boto3.dynamodb.conditions import Key
# Naya SDK import karo
from google import genai

# Initialize outside for Lambda 'Warm Starts'
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

# Naya Client initialization syntax
client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
MODEL_ID = "gemini-2.5-flash" # Standard string for new SDK

def handler(event, context):
    print(f"DEBUG: Full Event received: {json.dumps(event)}")
    
    try:
        request_context = event.get('requestContext', {})
        # Identity Extraction for personalized response
        user_id = request_context.get('authorizer', {}).get('jwt', {}).get('claims', {}).get('sub', 'anonymous')

        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        
        if not user_message:
            return respond(400, {"error": "No message provided"})

        # A. Fetch chat history (Memory)
        history_items = table.query(
            KeyConditionExpression=Key('UserId').eq(user_id),
            Limit=5,
            ScanIndexForward=False
        ).get('Items', [])
        
        # B. Build prompt with context
        memory_string = " ".join([item.get('Message', '') for item in history_items])
        full_prompt = f"System: Use context: {memory_string}. User: {user_message}"

        # C. Call Gemini using NEW SDK syntax
        ai_response = client.models.generate_content(
            model=MODEL_ID,
            contents=full_prompt
        )
        
        final_text = ai_response.text if ai_response.text else "Response blocked by AI safety."

        # D. Save interaction to DynamoDB
        table.put_item(Item={
            'UserId': user_id,
            'Timestamp': int(time.time()),
            'Message': user_message,
            'AIResponse': final_text
        })

        return respond(200, {"message": final_text, "status": "success"})

    except Exception as e:
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