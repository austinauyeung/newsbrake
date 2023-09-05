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
    const table = new dynamodb.Table(this, 'FeedConfiguration', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda functions and integrations
    const lambdaGet = new lambda.Function(this, 'ddbGet', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'get.handler',
      code: lambda.Code.fromAsset('lambda/ddb'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const lambdaUpdate = new lambda.Function(this, 'ddbPut', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'put.handler',
      code: lambda.Code.fromAsset('lambda/ddb'),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadData(lambdaGet)
    table.grantReadWriteData(lambdaUpdate);
    const integrationGet = new apigw.LambdaIntegration(lambdaGet)
    const integrationUpdate = new apigw.LambdaIntegration(lambdaUpdate);

    // Cognito User Pool and Client
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        email: true,
      },
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
