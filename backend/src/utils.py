import json
import boto3
import os
from decimal import Decimal

# --- Common Config ---
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
BRANDS_TABLE = os.environ.get('BRANDS_TABLE_NAME')
ASSETS_BUCKET = os.environ.get('ASSETS_BUCKET_NAME')
SCHEDULER_ROLE_ARN = os.environ.get('SCHEDULER_ROLE_ARN')

# --- Shared Clients ---
dynamodb_resource = boto3.resource('dynamodb', region_name="ap-south-1")
ssm_client = boto3.client('ssm', region_name="ap-south-1")
s3_client = boto3.client('s3', region_name="ap-south-1")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)

def get_cors_headers(event):
    allowed_origins = [
        'http://localhost:5173',
        'https://dev.d8aheoykcvs8k.amplifyapp.com',
        'https://main.d8aheoykcvs8k.amplifyapp.com'
    ]
    request_origin = event.get('headers', {}).get('origin')
    origin = request_origin if request_origin in allowed_origins else allowed_origins[1]
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    }

def get_user_id(event):
    try:
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('jwt', {}).get('claims', {}) or authorizer.get('claims', {})
        return claims.get('sub')
    except:
        return None

def get_gemini_key():
    try:
        res = ssm_client.get_parameter(Name="/corex/gemini_api_key", WithDecryption=True)
        return res['Parameter']['Value']
    except Exception as e:
        print(f"ERROR | Gemini Key Fetch Failed: {str(e)}")
        return None