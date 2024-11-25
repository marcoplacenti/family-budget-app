import boto3
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.types import TypeDeserializer
import json
import jwt

from botocore.exceptions import ClientError

from decimal import Decimal
from datetime import datetime
from dateutil.relativedelta import relativedelta

dynamodb_resource = boto3.resource('dynamodb')
dynamodb_client = boto3.client('dynamodb')

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

def get_balance_or_provisions(user, period, table_name):
    response = dynamodb_client.query(
        TableName=table_name,
        KeyConditionExpression="#userID = :user AND begins_with(PeriodAccount, :period)",
        ExpressionAttributeNames={
            "#userID": "User"  # Alias for the reserved word User
        },
        ExpressionAttributeValues={
            ":user": {"S": user},
            ":period": {"S": period}
        }
    )

    deserializer = TypeDeserializer()

    # Convert the DynamoDB response into native Python types
    converted_items = {}
    for item in response.get('Items'):
        converted_item = {key: deserializer.deserialize(value) for key, value in item.items()}
        account = converted_item['PeriodAccount'].split('_')[1]
        converted_items[account] = str(converted_item['Amount'].quantize(Decimal('0.00'))).replace('.', ',')

    return converted_items

def lambda_handler(event, context):
    id_token = event.get("idToken")
    decoded_payload = jwt.decode(id_token, options={"verify_signature": False})
    user = decoded_payload.get('sub')

    available_periods_table = dynamodb_resource.Table('AccountsAvailablePeriods')
    available_periods_response = available_periods_table.get_item(Key={'User': user})
    available_periods = available_periods_response.get('Item')['Periods']

    period = available_periods[-1]

    date_obj = datetime.strptime(period, '%Y-%m')
    successive_period = date_obj + relativedelta(months=1)
    successive_period = successive_period.strftime('%Y-%m')

    available_periods.append(successive_period)
    available_periods_table.put_item(
        Item={
            'User': user,
            'Periods': available_periods
        }
    )

    current_balance = get_balance_or_provisions(user, period, 'AccountsBalances')
    # provisions = get_balance_or_provisions(user, period, 'AccountsProvisions')

    response = []
    balances_table = dynamodb_resource.Table('AccountsBalances')
    provisions_table = dynamodb_resource.Table('AccountsProvisions')
    for account, amount in current_balance.items():
        print(account, amount)
        balances_table.put_item(
            Item={
                'User': user,
                'PeriodAccount': f"{successive_period}_{account}",
                'Amount': Decimal(amount.replace(',', '.'))
            }
        )

        provisions_table.put_item(
            Item={
                'User': user,
                'PeriodAccount': f"{successive_period}_{account}",
                'Amount': Decimal(0)
            }
        )

    return {
        "statusCode": 200,
        "new_period": successive_period
    }
