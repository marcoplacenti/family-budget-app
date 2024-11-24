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

    if event.get("period") is not None:
        period = event.get("period")
    else:
        period = available_periods[-1]

    date_obj = datetime.strptime(period, '%Y-%m')
    previous_period = date_obj - relativedelta(months=1)
    previous_period = previous_period.strftime('%Y-%m')
    
    currency_table = dynamodb_resource.Table('AccountsCurrency')
    try:
        response = currency_table.get_item(
            Key={
                'User': user
            }
        )
        if 'Item' not in response:
            raise KeyError
    except KeyError as e:
        print(e)
        return {
            "statusCode": 400,
            "body": json.dumps({"Message": "This user data have not been initialized yet."})
        }

    init_balance = get_balance_or_provisions(user, previous_period, 'AccountsBalances')
    current_balance = get_balance_or_provisions(user, period, 'AccountsBalances')
    provisions = get_balance_or_provisions(user, period, 'AccountsProvisions')

    response = []
    assert init_balance.keys() == current_balance.keys() == provisions.keys()
    for account in init_balance.keys():
        response.append({
            "name": account,
            "category": account_category[account],
            "initial_balance": str(init_balance[account]),
            "provision": str(provisions[account]),
            "transactions": str(Decimal('0').quantize(Decimal('0.00'))).replace('.', ','),
            "current_balance": str(current_balance[account]),
            "available_periods": available_periods
        })
     
    print(json.dumps(response))
    return {
        "statusCode": 200,
        "accountsData": json.dumps(response),
        "availablePeriods": json.dumps({"available_periods": available_periods})
    }
