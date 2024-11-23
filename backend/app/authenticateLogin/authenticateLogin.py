import json
import jwt
import boto3
import os
from botocore.exceptions import ClientError

client = boto3.client('cognito-idp')
dynamodb_resource = boto3.resource('dynamodb')

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

        print(response)

        id_token = response["AuthenticationResult"]["IdToken"]
        decoded_payload = jwt.decode(id_token, options={"verify_signature": False})
        user = decoded_payload.get('sub')

        currency_table = dynamodb_resource.Table('AccountsCurrency')
        dynamodb_response = currency_table.get_item(
            Key={
                'User': user
            }
        )
        if 'Item' not in dynamodb_response:
            isInitialized = False
        else:
            isInitialized = True


        # Return tokens on success
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Login successful",
                "idToken": response["AuthenticationResult"]["IdToken"],
                "accessToken": response["AuthenticationResult"]["AccessToken"],
                "refreshToken": response["AuthenticationResult"]["RefreshToken"],
                "isInitialized": isInitialized,
            })
        }
    except ClientError as e:
        return {
            "statusCode": 401,
            "body": json.dumps({"message": "Invalid email or password.", "error": str(e)})
        }
