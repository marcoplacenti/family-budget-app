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

account_category = {
    'Affitto': 'basic',
    'Assicurazione': 'basic',
    'Elettricità': 'basic',
    'Sindacato': 'basic',
    'Telefonia': 'basic',
    'TV': 'basic',
    'Alimentari': 'daily',
    'Complementari': 'daily',
    'Medicinali': 'daily',
    'Mobilio': 'daily',
    'Trasporto': 'daily',
    'Visite Mediche': 'daily',
    'Personali Marco': 'entertainment',
    'Personali Miriam': 'entertainment',
    'Uscite': 'entertainment',
    'Viaggi Palermo': 'entertainment',
    'Viaggi Ricreativi': 'entertainment',
    'Automobile': 'saving',
    'Casa Danimarca': 'saving',
    'Casa Palermo': 'saving',
    'Cassa': 'saving',
    'Investimenti': 'saving',
    'Safety Net': 'saving'
}

def lambda_handler(event, context):
    print(event)
    """
    {
        'idToken': 'eyJraWQiOiJhSnkzaE5KM01mR3dkMVVnSkpCUFZ5UGJoVGRXMnQ3RTllTWFnNk5RYTQ0PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkMzY0MDhiMi0zMDQxLTcwZWMtMTA0MS0zZmZjNDY4Y2U3ZDIiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5ldS1jZW50cmFsLTEuYW1hem9uYXdzLmNvbVwvZXUtY2VudHJhbC0xX1ZjZ3RpNmlXOSIsImNvZ25pdG86dXNlcm5hbWUiOiJkMzY0MDhiMi0zMDQxLTcwZWMtMTA0MS0zZmZjNDY4Y2U3ZDIiLCJvcmlnaW5fanRpIjoiMjNhZTAxNTgtMGQyNi00NmY2LWE5NGUtM2EzOWIwOGU0ZmEwIiwiYXVkIjoiYjkxcXMybmJjZWxzcGFkMzRoYzJwNGtwaiIsImV2ZW50X2lkIjoiNTA3ZjM3NTQtMjExYy00OTM3LTg3YmItN2RlOWYyYmZkMWQzIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzIzNjE4MjEsImV4cCI6MTczMjM2NTQyMSwiaWF0IjoxNzMyMzYxODIxLCJqdGkiOiI2MmM1ZDZkMC1kODM3LTRjZGMtYTExZS05M2YwNWQ3ZjUwMTciLCJlbWFpbCI6InBsYWNlbnRpLm1hcmNvQGdtYWlsLmNvbSJ9.dSLUZHQryM097JyO8NUPWo3AkHpMa4rKNbLGn_0KrzANRddgkCGa2-VMd4rkNGvE2D1emdhjVx87lhyZnwUdCJTMfXbBuNLfEd-_19DoK7GUije9ruCsreuCdwMMB8HuKnBhDGn8aiP3lwIWdcSVE--vRCxwE7NxfwvtL34eGp4geSZOMORHgpPxXuzS9_xFQnG54nLlAMUZJTVs3Eaysi08-nx_989sacVnoe6qhcqD0WY_hmhqh3Xdq26hlnu-3b4WPsOlkGIc8ZcNRUwDZnlqvWhBwwDdMyX5rgZ7-bLb5RaQ9SqW5-0o67P6L189hbQlQL3C4qA2daEzFYCYPQ',
        'startMonth': '2024-11',
        'currency': 'DKK', 
        'allBalances': {
            'Affitto': '0,00', 'Assicurazione': '0,00', 'Elettricità': '0,00', 'Sindacato': '0,00', 'Telefonia': '0,00', 'TV': '0,00', 
            'Alimentari': '0,00', 'Complementari': '0,00', 'Medicinali': '0,00', 'Mobilio': '0,00', 'Trasporto': '0,00', 'Visite Mediche': '0,00', 
            'Personali Marco': '0,00', 'Personali Miriam': '0,00', 'Uscite': '0,00', 'Viaggi Palermo': '0,00', 'Viaggi Ricreativi': '0,00', 
            'Automobile': '0,00', 'Casa Danimarca': '0,00', 'Casa Palermo': '0,00', 'Cassa': '0,00', 'Investimenti': '0,00', 'Safety Net': '0,00'
        }
    }
    """
    id_token = event.get("idToken")
    decoded_payload = jwt.decode(id_token, options={"verify_signature": False})
    user = decoded_payload.get('sub')

    start_month = event.get("startMonth")
    currency = event.get("currency")
    balances = event.get("allBalances")

    print(balances)

    currency_table = dynamodb_resource.Table('AccountsCurrency')
    currency_table.put_item(
        Item={
            'User': user,
            'Currency': currency
        }
    )

    periods_table = dynamodb_resource.Table('AccountsAvailablePeriods')
    periods_table.put_item(
        Item={
            'User': user,
            'Periods': [start_month]
        }
    )

    balances_table = dynamodb_resource.Table('AccountsBalances')
    provisions_table = dynamodb_resource.Table('AccountsProvisions')
    for account, amount in balances.items():
        print(account, amount)
        balances_table.put_item(
            Item={
                'User': user,
                'PeriodAccount': f"{start_month}_{account}",
                'Amount': Decimal(amount.replace(',', '.'))
            }
        )

        date_obj = datetime.strptime(start_month, '%Y-%m')
        previous_month = date_obj - relativedelta(months=1)
        previous_month_str = previous_month.strftime('%Y-%m')
        balances_table.put_item(
            Item={
                'User': user,
                'PeriodAccount': f"{previous_month_str}_{account}",
                'Amount': Decimal(amount.replace(',', '.'))
            }
        )

        provisions_table.put_item(
            Item={
                'User': user,
                'PeriodAccount': f"{start_month}_{account}",
                'Amount': Decimal(0)
            }
        )

    return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Data Inserted",
                "userSub": "nvcidvcn"
            })
        }
