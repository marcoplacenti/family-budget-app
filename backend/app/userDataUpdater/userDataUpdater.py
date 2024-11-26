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
    """
    {
        'idToken': '', 
        'selectedPeriod': '2024-12', 
        'basicNeedsAccountsEditProvisions': [{'name': 'Affitto', 'category': 'basic', 'initial_balance': '0,00', 'provision': '200,00', 'transactions': '0,00', 'current_balance': '8,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Assicurazione', 'category': 'basic', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Elettricità', 'category': 'basic', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Sindacato', 'category': 'basic', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'TV', 'category': 'basic', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Telefonia', 'category': 'basic', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}], 
        'dailyNeedsAccountsEditProvisions': [{'name': 'Alimentari', 'category': 'daily', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Complementari', 'category': 'daily', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Medicinali', 'category': 'daily', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Mobilio', 'category': 'daily', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Trasporto', 'category': 'daily', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Visite Mediche', 'category': 'daily', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}],
        'entertainmentsAccountsEditProvisions': [{'name': 'Personali Marco', 'category': 'entertainment', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Personali Miriam', 'category': 'entertainment', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Uscite', 'category': 'entertainment', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Viaggi Palermo', 'category': 'entertainment', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Viaggi Ricreativi', 'category': 'entertainment', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}],
        'savingsAccountsEditProvisions': [{'name': 'Automobile', 'category': 'saving', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Casa Danimarca', 'category': 'saving', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Casa Palermo', 'category': 'saving', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Cassa', 'category': 'saving', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Investimenti', 'category': 'saving', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}, {'name': 'Safety Net', 'category': 'saving', 'initial_balance': '0,00', 'provision': '0,00', 'transactions': '0,00', 'current_balance': '0,00', 'available_periods': ['2024-11', '2024-12']}]}
    """

    id_token = event.get("idToken")
    decoded_payload = jwt.decode(id_token, options={"verify_signature": False})
    user = decoded_payload.get('sub')

    period = event.get("period")
    basic = event.get("basic")
    daily = event.get("daily")
    entertainment = event.get("entertainment")
    saving = event.get("saving")

    data = []
    data.extend(basic)
    data.extend(daily)
    data.extend(entertainment)
    data.extend(saving)
    print(data)

    balances_table = dynamodb_resource.Table('AccountsBalances')
    provisions_table = dynamodb_resource.Table('AccountsProvisions')
    for item in data:
        account = item['name']
        provision = Decimal(float(item['provision'].replace(',', '.'))).quantize(Decimal('0.01'))
        current_balance = Decimal(float(item['current_balance'].replace(',', '.'))).quantize(Decimal('0.01'))
        # provision = Decimal(round(float(item['provision'].replace(',', '.')),2))
        print(period, account, provision, type(provision))
    #     response = balances_table.put_item(
    #         Item={
    #             'User': user,
    #             'PeriodAccount': f"{start_month}_{account}",
    #             'Amount': Decimal(amount)
    #         }
    #     )

        response = balances_table.update_item(
            Key={'User': user, 'PeriodAccount': f'{period}_{account}'},
            UpdateExpression='SET Amount = :attrValue',
            ExpressionAttributeValues={':attrValue': current_balance}
        )

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

        response = provisions_table.update_item(
            Key={'User': user, 'PeriodAccount': f'{period}_{account}'},
            UpdateExpression='SET Amount = :attrValue',
            ExpressionAttributeValues={':attrValue': provision}
        )


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
