import os
import json
import boto3
from boto3.dynamodb.conditions import Key
import google.generativeai as genai

# 1. Initialize Clients outside the handler for warm-start performance
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

# 2. Configure Gemini API
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod')
    # Extracts User ID from Cognito Token
    user_id = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('sub', 'guest-user')

    try:
        # --- Logic for SAVING Memory (POST) ---
        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            table.put_item(Item={
                'UserId': user_id,
                'Timestamp': int(os.popen('date +%s').read()), # Unix timestamp
                'BrandContext': body.get('brandContext'),
                'Message': body.get('message')
            })
            return respond(201, {"message": "Brand memory updated successfully!"})

        # --- Logic for GENERATING with Memory (GET) ---
        if http_method == 'GET':
            # 1. Fetch History from DynamoDB
            history = table.query(
                KeyConditionExpression=Key('UserId').eq(user_id),
                Limit=5,
                ScanIndexForward=False
            ).get('Items', [])

            # 2. Build the "Brand-Friendly" Prompt
            brand_memory = " ".join([item['BrandContext'] for item in history if 'BrandContext' in item])
            user_prompt = f"Using this brand context: {brand_memory}. Generate a social media post about: {event.get('queryStringParameters', {}).get('topic', 'innovation')}"

            # 3. Call Gemini API
            response = model.generate_content(user_prompt)
            
            return respond(200, {
                "generatedPost": response.text,
                "usedMemory": brand_memory
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return respond(500, {"error": str(e)})

def respond(status, body):
    return {
        "statusCode": status,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "body": json.dumps(body)
    }