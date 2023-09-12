import { Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway'

export class NewsbrakeStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table storing feed configurations
    const table = new dynamodb.Table(this, 'FeedPreferences', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'GSI',
      partitionKey: {
        name: 'fetchTime',
        type: dynamodb.AttributeType.NUMBER,
      }
    });

    // Lambda functions and integrations
    const ddbCreate = new lambda.Function(this, 'ddbCreate', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'ddbCreate.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const ddbGet = new lambda.Function(this, 'ddbGet', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'ddbGet.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const ddbPut = new lambda.Function(this, 'ddbPut', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'ddbPut.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(ddbCreate);
    table.grantReadData(ddbGet);
    table.grantWriteData(ddbPut);
    const integrationGet = new apigw.LambdaIntegration(ddbGet);
    const integrationUpdate = new apigw.LambdaIntegration(ddbPut);

    const signupConfirm = new lambda.Function(this, 'signupConfirm', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'signupConfirm.handler',
      code: lambda.Code.fromAsset('dist/src'),
    });

    // Cognito User Pool and Client
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        email: true,
      },
      lambdaTriggers: {
        postConfirmation: ddbCreate,
        customMessage: signupConfirm,
      },
      email: cognito.UserPoolEmail.withSES({
        fromEmail: 'confirm@newsbrake.app',
        fromName: 'newsbrake',
        sesRegion: 'us-east-1'
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const userPoolClient = userPool.addClient('UserPoolClient');

    // Cognito Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
        clientId: userPoolClient.userPoolClientId,
        providerName: userPool.userPoolProviderName,
      }],
    })

    // IAM Role for Authenticated Users
    const authRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": identityPool.ref
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }, "sts:AssumeRoleWithWebIdentity"),
    });

    authRole.addToPolicy(new iam.PolicyStatement({
      // actions: ['execute-api:Invoke'],
      actions: ["*"],
      effect: iam.Effect.DENY,
      resources: ["*"],
    }));

    new cognito.CfnIdentityPoolRoleAttachment(this, "IdentityPoolRoleAttachment", {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: authRole.roleArn
      }
    })

    // API Gateway, REST API
    const api = new apigw.RestApi(this, "RestApi", {
      restApiName: 'RestApi'
    });
    const dbResource = api.root.addResource('db');
    // dbResource.addCorsPreflight({
    //   allowOrigins: apigw.Cors.ALL_ORIGINS,
    //   allowMethods: apigw.Cors.ALL_METHODS,
    //   allowCredentials: true,
    // });
    dbResource.addMethod('GET', integrationGet, {
      authorizationType: apigw.AuthorizationType.IAM,
    });
    dbResource.addMethod('PUT', integrationUpdate, {
      authorizationType: apigw.AuthorizationType.IAM,
    });

    // Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url ?? ""
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId ?? ""
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId ?? ""
    });
    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.ref ?? ""
    });
  }
}
