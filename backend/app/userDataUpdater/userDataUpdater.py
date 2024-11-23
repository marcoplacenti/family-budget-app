from decimal import Decimal
import boto3
import json
import jwt
import os
from botocore.exceptions import ClientError

from datetime import datetime
from dateutil.relativedelta import relativedelta

# cognito_client = boto3.client('cognito-idp')
dynamodb_resource = boto3.resource('dynamodb')

USER_POOL_ID = os.environ['USER_POOL_ID']
APP_CLIENT_ID = os.environ['APP_CLIENT_ID']

def lambda_handler(event, context):
    print(event)
    # """
    # {
    #     'idToken': 'eyJraWQiOiI0WHd3QmFtSDlZVGlzV1JDaER3TWFQUFRRRStkenNWVllNcWJ4RFRmTEdjPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI0MzY0MzgyMi0zMDUxLTcwNDItYjAzYS05MWFkN2U4NGVmZDYiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tXC9ldS1jZW50cmFsLTFfRlRYeEFPNGRVIiwiY29nbml0bzp1c2VybmFtZSI6IjQzNjQzODIyLTMwNTEtNzA0Mi1iMDNhLTkxYWQ3ZTg0ZWZkNiIsIm9yaWdpbl9qdGkiOiIxYjRlYTQ3NC05ODAyLTQ4ZWQtYjI3ZC03YWJjZGVmNWNlMmEiLCJhdWQiOiIybm5qMjNwcDh1Z29wcWtjcXQ3dWNvazFlYiIsImV2ZW50X2lkIjoiNDk5NWVkNGQtOTExMC00ZTk3LWE1NzUtNGMxNzAwOTU0MmE3IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzIxMjM4NjIsImV4cCI6MTczMjEyNzQ2MiwiaWF0IjoxNzMyMTIzODYyLCJqdGkiOiIwNDFhYzg0Yy0xYjYxLTQ1ODgtOGI4Ni1iMDAwY2EzOTlhNGQiLCJlbWFpbCI6InBsYWNlbnRpLm1hcmNvQGdtYWlsLmNvbSJ9.af_6845ZuEndcfH26DVhqXHobwfzcU12jb1mFlGSm2jhRrgAzcYYBqmwKwcWB2K3e2P-b3c6B99HWvPAKjeI0ZIyEI27voly8LM9DV3bQ-sOym0yItpesmCujN0VzrUcMqYgEOIKaZ8Jxy_sjWRzAOVbEXgVHJU78Y_etDSFrLEh6saCWKquHvL_rjkIKu0TP4PsXh3hUQQY6nwjA4t7LQ7T3QsNeqfNA7kB40nbN6RmlOSjo6iq_WdR7xfLHy8eDs961oRlzNHva5GhAQm2BSEg7GzLNOCE7XjEzWWp_ZUN4SsCqvfoBw850gqMX3tqwD2KGTdpfldA9FSkVEghGA',
    #     'balances': {'Affitto': 'aa', 'Elettricità': 'bb', 'Assicurazione': 'hh', 'Alimentari': 'gg', 'Uscite': 'tt'}
    # }

    # """
    # id_token = event.get("idToken")
    # decoded_payload = jwt.decode(id_token, options={"verify_signature": False})
    # user = decoded_payload.get('sub')

    # print(user)

    # start_month = event.get("startMonth")
    # currency = event.get("currency")
    # balances = event.get("balances")

    # currency_table = dynamodb_resource.Table('AccountsCurrency')
    # response = currency_table.put_item(
    #     Item={
    #         'User': user,
    #         'Currency': currency
    #     }
    # )

    # print(user, start_month)
    # periods_table = dynamodb_resource.Table('AccountsAvailablePeriods')
    # response = periods_table.put_item(
    #     Item={
    #         'User': user,
    #         'Periods': [start_month]
    #     }
    # )

    # balances_table = dynamodb_resource.Table('AccountsBalances')
    # provisions_table = dynamodb_resource.Table('AccountsProvisions')
    # for account, amount in balances.items():
    #     response = balances_table.put_item(
    #         Item={
    #             'User': user,
    #             'PeriodAccount': f"{start_month}_{account}",
    #             'Amount': Decimal(amount)
    #         }
    #     )

    #     date_obj = datetime.strptime(start_month, '%Y-%m')
    #     previous_month = date_obj - relativedelta(months=1)
    #     previous_month_str = previous_month.strftime('%Y-%m')
    #     response = balances_table.put_item(
    #         Item={
    #             'User': user,
    #             'PeriodAccount': f"{previous_month_str}_{account}",
    #             'Amount': Decimal(amount)
    #         }
    #     )

    #     response = provisions_table.put_item(
    #         Item={
    #             'User': user,
    #             'PeriodAccount': f"{start_month}_{account}",
    #             'Amount': Decimal(0)
    #         }
    #     )


    # print(response)

    # return {
    #         "statusCode": 200,
    #         "body": json.dumps({
    #             "message": "Data Inserted",
    #             "userSub": "nvcidvcn"
    #         })
    #     }
    
    # if not email or not password:
    #     return {
    #         "statusCode": 400,
    #         "body": json.dumps({"message": "Email and password are required."})
    #     }

    # try:
    #     response = client.sign_up(
    #         ClientId=APP_CLIENT_ID,
    #         Username=email,
    #         Password=password,
    #         UserAttributes=[
    #             {
    #                 'Name': 'email',
    #                 'Value': email
    #             }
    #         ]
    #     )
    #     return {
    #         "statusCode": 200,
    #         "body": json.dumps({
    #             "message": "User successfully registered",
    #             "userSub": response['UserSub']
    #         })
    #     }
    # except ClientError as e:
    #     return {
    #         "statusCode": 400,
    #         "body": json.dumps({
    #             "message": "Registration failed",
    #             "error": str(e)
    #         })
    #     }
