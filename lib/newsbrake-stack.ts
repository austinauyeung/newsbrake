import { Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as triggers from 'aws-cdk-lib/triggers';

export class NewsbrakeStack extends Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table storing user preferences and related Lambda functions
    const UserPreferences = new dynamodb.Table(this, 'UserPreferences', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    UserPreferences.addGlobalSecondaryIndex({
      indexName: 'GSI',
      partitionKey: {
        name: 'fetchTime',
        type: dynamodb.AttributeType.NUMBER,
      },
      sortKey: {
        name: 'deliveryEnabled',
        type: dynamodb.AttributeType.NUMBER,
      }
    });

    const UserPreferencesPost = new lambda.Function(this, 'UserPreferencesPost', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserPreferencesPost.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserPreferences.tableName,
      },
    });

    const UserPreferencesGet = new lambda.Function(this, 'UserPreferencesGet', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserPreferencesGet.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserPreferences.tableName,
      },
    });

    const UserPreferencesPut = new lambda.Function(this, 'UserPreferencesPut', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserPreferencesPut.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserPreferences.tableName,
      },
    });

    UserPreferences.grantWriteData(UserPreferencesPost);
    UserPreferences.grantReadData(UserPreferencesGet);
    UserPreferences.grantWriteData(UserPreferencesPut);

    // DynamoDB table storing user internal info
    const UserInternalInfo = new dynamodb.Table(this, 'UserInternalInfo', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const UserInternalInfoPost = new lambda.Function(this, 'UserInternalInfoPost', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserInternalInfoPost.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserInternalInfo.tableName,
      },
    });

    UserInternalInfo.grantWriteData(UserInternalInfoPost);

    // DynamoDB table storing feed metadata and related Lambda functions
    const FeedMetadata = new dynamodb.Table(this, 'FeedMetadata', {
      partitionKey: { name: 'feedName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const FeedMetadataGet = new triggers.TriggerFunction(this, 'FeedMetadataGet', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'FeedMetadataGet.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: FeedMetadata.tableName,
      },
    })

    const FeedMetadataPost = new triggers.TriggerFunction(this, 'FeedMetadataPost', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'FeedMetadataPost.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: FeedMetadata.tableName,
      },
    })

    FeedMetadata.grantReadWriteData(FeedMetadataPost);
    FeedMetadata.grantReadData(FeedMetadataGet)

    // Cognito User Pool and Client
    const CustomMessage = new lambda.Function(this, 'CustomMessage', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'CustomMessage.handler',
      code: lambda.Code.fromAsset('dist/src'),
    });

    const PostConfirmation = new lambda.Function(this, 'PostConfirmation', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'PostConfirmation.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        USERINTERNALINFO: UserInternalInfoPost.functionName,
        USERPREFERENCES: UserPreferencesPost.functionName
      }
    });

    UserInternalInfoPost.grantInvoke(PostConfirmation);
    UserPreferencesPost.grantInvoke(PostConfirmation);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      signInAliases: {
        email: true,
      },
      lambdaTriggers: {
        postConfirmation: PostConfirmation,
        customMessage: CustomMessage,
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
      actions: ['execute-api:Invoke'],
      effect: iam.Effect.ALLOW,
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
    const preferencesApi = api.root.addResource('preferences');
    const metadataApi = api.root.addResource('metadata');

    preferencesApi.addCorsPreflight({
      allowOrigins: apigw.Cors.ALL_ORIGINS,
      allowMethods: apigw.Cors.ALL_METHODS,
      allowCredentials: true,
    });
    preferencesApi.addMethod('GET', new apigw.LambdaIntegration(UserPreferencesGet), {
      authorizationType: apigw.AuthorizationType.IAM,
    });
    preferencesApi.addMethod('PUT', new apigw.LambdaIntegration(UserPreferencesPut), {
      authorizationType: apigw.AuthorizationType.IAM,
    });

    metadataApi.addCorsPreflight({
      allowOrigins: apigw.Cors.ALL_ORIGINS,
      allowMethods: apigw.Cors.ALL_METHODS,
      allowCredentials: true,
    });
    metadataApi.addMethod('GET', new apigw.LambdaIntegration(FeedMetadataGet), {
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
