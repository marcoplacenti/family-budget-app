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
        response = client.sign_up(
            ClientId=APP_CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                }
            ]
        )
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "User successfully registered",
                "userSub": response['UserSub']
            })
        }
    except ClientError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({
                "message": "Registration failed",
                "error": str(e)
            })
        }
