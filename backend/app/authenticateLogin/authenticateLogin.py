import json
import boto3
import os
from botocore.exceptions import ClientError

client = boto3.client('cognito-idp')

USER_POOL_ID = os.environ['USER_POOL_ID']
APP_CLIENT_ID = os.environ['APP_CLIENT_ID']

def lambda_handler(event, context):
    email = event.get("email")
    password = event.get("password")
    
    if not email or not password:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Email and password are required."})
        }

    try:
        response = client.admin_initiate_auth(
            UserPoolId=USER_POOL_ID,
            ClientId=APP_CLIENT_ID,
            AuthFlow="ADMIN_NO_SRP_AUTH",  # Switch to ADMIN_NO_SRP_AUTH
            AuthParameters={
                "USERNAME": email,
                "PASSWORD": password,
            }
        )
        # Return tokens on success
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Login successful",
                "idToken": response["AuthenticationResult"]["IdToken"],
                "accessToken": response["AuthenticationResult"]["AccessToken"],
                "refreshToken": response["AuthenticationResult"]["RefreshToken"],
            })
        }
    except ClientError as e:
        return {
            "statusCode": 401,
            "body": json.dumps({"message": "Invalid email or password.", "error": str(e)})
        }
