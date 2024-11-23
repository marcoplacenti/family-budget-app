import { Construct } from 'constructs';


import {
  Stack,
  StackProps,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda as lambda,
} from "aws-cdk-lib";

import path = require('path');

import {PythonFunction} from "@aws-cdk/aws-lambda-python-alpha"


export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // COGNITO STUFF
    const userPool = new cognito.UserPool(this, 'cognitoUserPool', {
      userPoolName: 'FamilyBudgetAppUserPool',
      signInAliases: {
        email: true, // Enable email sign-in
        username: false, // Disable username sign-in
        phone: false, // Disable phone number sign-in
      },
      mfa: cognito.Mfa.OFF,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for our app',
        emailBody: 'Hello {username},\n\nPlease verify your email address by clicking the link below:\n{##Verify Email##}', // Default template variables
        emailStyle: cognito.VerificationEmailStyle.LINK, // Use a verification link in the email
      },
    });

    // Create a User Pool Client with specific authentication flows
    const userPoolClient = new cognito.UserPoolClient(this, 'MyUserPoolClient', {
      userPool: userPool,
      userPoolClientName: 'CustomAuthClientApp',
      authFlows: {
        adminUserPassword: true, // ALLOW_ADMIN_USER_PASSWORD_AUTH
        custom: true,            // ALLOW_CUSTOM_AUTH
        userPassword: true,      // ALLOW_USER_PASSWORD_AUTH
        userSrp: true,           // ALLOW_USER_SRP_AUTH
      },
    });

    userPool.addDomain("myCognitoDomain", {
      cognitoDomain: {domainPrefix: "familybudgetapp"}
    })

    
    // LAMBDA STUFF
    const authRole = new iam.Role(this, 'authRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });
    
    authRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    authRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonESCognitoAccess')
    );


    const signinLambda = new lambda.Function(this, 'signinLambda',
      {
        functionName: 'AuthenticateSignin',
        code: lambda.Code.fromAsset(path.join(__dirname, '../app/authenticateSignin')),
        handler: "authenticateSignin.lambda_handler",
        runtime: lambda.Runtime.PYTHON_3_12,
        role: authRole,
        environment: {
          "USER_POOL_ID": userPool.userPoolId,
          "APP_CLIENT_ID": userPoolClient.userPoolClientId
        }
      }
    )

    const loginLambda = new lambda.Function(this, 'logininLambda',
      {
        functionName: 'AuthenticateLogin',
        code: lambda.Code.fromAsset(path.join(__dirname, '../app/authenticateLogin')),
        handler: "authenticateLogin.lambda_handler",
        runtime: lambda.Runtime.PYTHON_3_12,
        role: authRole,
        environment: {
          "USER_POOL_ID": userPool.userPoolId,
          "APP_CLIENT_ID": userPoolClient.userPoolClientId
        }
      }
    )

    const userDataLambdaRole = new iam.Role(this, 'userDataLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    userDataLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    );

    userDataLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );

    const initUserDataLambda = new PythonFunction(this, 'initUserDataLambda', {
      functionName: 'InitializeUserData',
      entry: './app/initUserData',
      runtime: lambda.Runtime.PYTHON_3_12,
      index: 'initUserData.py',
      handler: 'lambda_handler',
      role: userDataLambdaRole,
        environment: {
          "USER_POOL_ID": userPool.userPoolId,
          "APP_CLIENT_ID": userPoolClient.userPoolClientId
        }
    });

    const userDataFetcherLambda = new PythonFunction(this, 'userDataFetcherLambda', {
      functionName: 'UserDataFetcher',
      entry: './app/userDataFetcher',
      runtime: lambda.Runtime.PYTHON_3_12,
      index: 'userDataFetcher.py',
      handler: 'lambda_handler',
      role: userDataLambdaRole,
        environment: {
          "USER_POOL_ID": userPool.userPoolId,
          "APP_CLIENT_ID": userPoolClient.userPoolClientId
        }
    });

    const userDataUpdaterLambda = new PythonFunction(this, 'userDataUpdaterLambda', {
      functionName: 'UserDataUpdater',
      entry: './app/userDataUpdater',
      runtime: lambda.Runtime.PYTHON_3_12,
      index: 'userDataUpdater.py',
      handler: 'lambda_handler',
      role: userDataLambdaRole,
        environment: {
          "USER_POOL_ID": userPool.userPoolId,
          "APP_CLIENT_ID": userPoolClient.userPoolClientId
        }
    });

    const accountBalanceTable = new dynamodb.Table(this, 'accountBalanceTable', {
      tableName: 'AccountsBalances',
      partitionKey: { name: 'User', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PeriodAccount', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    })

    const accountProvisionTable = new dynamodb.Table(this, 'accountProvisionTable', {
      tableName: 'AccountsProvisions',
      partitionKey: { name: 'User', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'PeriodAccount', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    })

    const accountAvailablePeriods = new dynamodb.Table(this, 'accountAvailablePeriods', {
      tableName: 'AccountsAvailablePeriods',
      partitionKey: { name: 'User', type: dynamodb.AttributeType.STRING },
      //sortKey: { name: 'Period', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    })

    const accountTransactionTable = new dynamodb.Table(this, 'accountTransactionTable', {
      tableName: 'AccountsTransactions',
      partitionKey: { name: 'User', type: dynamodb.AttributeType.STRING },
      //sortKey: { name: 'PeriodAccountTransactionId', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    })

    const accountTransactionCounterTable = new dynamodb.Table(this, 'accountTransactionCounterTable', {
      tableName: 'AccountsTransactionsCounter',
      partitionKey: { name: 'User', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'Counter', type: dynamodb.AttributeType.NUMBER },
      readCapacity: 1,
      writeCapacity: 1
    })

    const accountCurrencyTable = new dynamodb.Table(this, 'accountCurrencyTable', {
      tableName: 'AccountsCurrency',
      partitionKey: { name: 'User', type: dynamodb.AttributeType.STRING },
      //sortKey: { name: 'Currency', type: dynamodb.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    })

    // const initUserDataLambda = new lambda.Function(this, 'initUserDataLambda',
    //   {
    //     functionName: 'InitializeUserData',
    //     code: lambda.Code.fromAsset(path.join(__dirname, '../app/initUserData')),
    //     handler: "initUserData.lambda_handler",
    //     runtime: lambda.Runtime.PYTHON_3_12,
    //     role: authRole,
    //     environment: {
    //       "USER_POOL_ID": userPool.userPoolId,
    //       "APP_CLIENT_ID": userPoolClient.userPoolClientId
    //     }
    //   }
    // )

    // const signinLambda = new lambda.Function(this, 'signinLambda',
    //   {
    //     functionName: 'AuthenticateSigninV2',
    //     code: lambda.Code.fromAsset(path.join(__dirname, '../app/authenticateSignin')),
    //     handler: "authenticateSignin.lambda_handler",
    //     runtime: lambda.Runtime.PYTHON_3_12,
    //     role: authRole
    //   }
    // )
  }
}
