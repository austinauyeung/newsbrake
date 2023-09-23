import { Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
// import * as iam from 'aws-cdk-lib/aws-iam';
// import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as triggers from 'aws-cdk-lib/triggers';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { aws_wafv2 as wafv2 } from 'aws-cdk-lib';

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
      timeout: cdk.Duration.seconds(10),
    });

    const UserPreferencesGet = new lambda.Function(this, 'UserPreferencesGet', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserPreferencesGet.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserPreferences.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const UserPreferencesPut = new lambda.Function(this, 'UserPreferencesPut', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserPreferencesPut.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserPreferences.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const UserPreferencesDelete = new lambda.Function(this, 'UserPreferencesDelete', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'UserPreferencesDelete.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: UserPreferences.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    UserPreferences.grantWriteData(UserPreferencesPost);
    UserPreferences.grantReadData(UserPreferencesGet);
    UserPreferences.grantWriteData(UserPreferencesPut);
    UserPreferences.grantWriteData(UserPreferencesDelete);

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
      timeout: cdk.Duration.seconds(10),
    });

    UserInternalInfo.grantWriteData(UserInternalInfoPost);

    // DynamoDB table storing feed metadata and related Lambda functions
    const FeedMetadata = new dynamodb.Table(this, 'FeedMetadata', {
      partitionKey: { name: 'feedName', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const FeedMetadataGet = new lambda.Function(this, 'FeedMetadataGet', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'FeedMetadataGet.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: FeedMetadata.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    })

    const FeedMetadataPost = new triggers.TriggerFunction(this, 'FeedMetadataPost', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'FeedMetadataPost.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        TABLENAME: FeedMetadata.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    })

    FeedMetadata.grantReadWriteData(FeedMetadataPost);
    FeedMetadata.grantReadData(FeedMetadataGet)

    // Cognito User Pool and Client
    const PostConfirmation = new lambda.Function(this, 'PostConfirmation', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'PostConfirmation.handler',
      code: lambda.Code.fromAsset('dist/src'),
      environment: {
        USERINTERNALINFO: UserInternalInfoPost.functionName,
        USERPREFERENCES: UserPreferencesPost.functionName
      },
      timeout: cdk.Duration.seconds(10),
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
      },
      email: cognito.UserPoolEmail.withSES({
        fromEmail: 'confirm@newsbrake.app',
        fromName: 'newsbrake',
        sesRegion: 'us-east-1'
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const userPoolClient = userPool.addClient('UserPoolClient');

    // API Gateway, REST API
    const api = new apigw.RestApi(this, "RestApi", {
      restApiName: 'RestApi',
      defaultCorsPreflightOptions: {
        allowOrigins: ['http://localhost:5173'],
        allowHeaders: apigw.Cors.DEFAULT_HEADERS,
        allowMethods: apigw.Cors.ALL_METHODS,
        maxAge: cdk.Duration.seconds(600)
      },
      defaultMethodOptions: {
        authorizer: new apigw.CognitoUserPoolsAuthorizer(this, 'UserPoolAuthorizer', { cognitoUserPools: [userPool] })
      }
    });
    const preferencesApi = api.root.addResource('preferences');
    const metadataApi = api.root.addResource('metadata');

    preferencesApi.addMethod('GET', new apigw.LambdaIntegration(UserPreferencesGet), {});
    preferencesApi.addMethod('PUT', new apigw.LambdaIntegration(UserPreferencesPut), {});
    preferencesApi.addMethod('DELETE', new apigw.LambdaIntegration(UserPreferencesDelete), {});
    metadataApi.addMethod('GET', new apigw.LambdaIntegration(FeedMetadataGet), {});

    // WAF
    new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: {
        block: {}
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: 'WebACLMetric'
      },
      rules: [
        {
          name: 'geoMatchRule',
          priority: 0,
          statement: {
            geoMatchStatement: {
              countryCodes: ["US", "CA"]
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: 'WebACLGeoMatch'
          },
          action: { allow: {} },
        },
        {
          name: 'rateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: 'IP',
              limit: 200,
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            sampledRequestsEnabled: true,
            metricName: 'WebACLRateLimit'
          },
          action: { block: {} }
        }
      ]
    })

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
  }
}
