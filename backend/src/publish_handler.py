import json, base64, traceback, requests, os
from utils import dynamodb_resource, BRANDS_TABLE, TABLE_NAME

X_CLIENT_ID = os.environ.get('X_CLIENT_ID')
X_CLIENT_SECRET = os.environ.get('X_CLIENT_SECRET')

def refresh_x_token(user_id, refresh_token):
    auth_b64 = base64.b64encode(f"{X_CLIENT_ID}:{X_CLIENT_SECRET}".encode()).decode()
    resp = requests.post("https://api.x.com/2/oauth2/token", headers={"Authorization": f"Basic {auth_b64}", "Content-Type": "application/x-www-form-urlencoded"}, 
                         data={"refresh_token": refresh_token, "grant_type": "refresh_token", "client_id": X_CLIENT_ID})
    if resp.status_code == 200:
        new = resp.json()
        dynamodb_resource.Table(BRANDS_TABLE).update_item(Key={'UserId': user_id}, UpdateExpression="SET x_access_token = :at, x_refresh_token = :rt", ExpressionAttributeValues={':at': new['access_token'], ':rt': new['refresh_token']})
        return new['access_token']
    return None


def publish_x(user_id, timestamp, brand_data, post_data, tweet_text):
    def post_tweet(token):
        return requests.post(
            "https://api.x.com/2/tweets",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"text": tweet_text}
        )

    res = post_tweet(brand_data.get('x_access_token'))
    if res.status_code == 401:
        new_at = refresh_x_token(user_id, brand_data.get('x_refresh_token'))
        if new_at:
            res = post_tweet(new_at)

    if res.status_code == 201:
        dynamodb_resource.Table(TABLE_NAME).update_item(
            Key={'UserId': user_id, 'Timestamp': int(timestamp)},
            UpdateExpression="SET #s = :s, TweetId = :tid",
            ExpressionAttributeNames={'#s': 'Status'},
            ExpressionAttributeValues={':s': 'PUBLISHED', ':tid': res.json()['data']['id']}
        )
        return {"status": "success"}
    return {"status": "error", "details": res.text}

def handler(event, context):
    user_id = event.get('userId')
    timestamp = event.get('timestamp')
    platform = event.get('platform', 'X')

    try:
        brand_data = dynamodb_resource.Table(BRANDS_TABLE).get_item(Key={'UserId': user_id}).get('Item', {})
        post_data = dynamodb_resource.Table(TABLE_NAME).get_item(
            Key={'UserId': user_id, 'Timestamp': int(timestamp)}
        ).get('Item', {})

        tweet_text = post_data.get('PostContent') or post_data.get('AgentResponse', '')

        if platform == 'X':
            return publish_x(user_id, timestamp, brand_data, post_data, tweet_text)
        elif platform == 'INSTAGRAM':
            return {"status": "error", "message": "Instagram publishing coming soon"}
        elif platform == 'FACEBOOK':
            return {"status": "error", "message": "Facebook publishing coming soon"}
        else:
            return {"status": "error", "message": f"Unknown platform: {platform}"}

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
