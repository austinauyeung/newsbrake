import * as cdk from 'aws-cdk-lib/core';
import { Stack } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface ApigwStackProps extends cdk.StackProps {
    UserPool: cognito.UserPool;
    UserPreferencesGet: lambda.Function;
    UserPreferencesPut: lambda.Function;
    UserPreferencesDelete: lambda.Function;
    FeedMetadataGet: lambda.Function;
    stageName: string;
}

export class ApigwStack extends Stack {
    public readonly stage: apigw.Stage;

    constructor(scope: cdk.Stage, id: string, props: ApigwStackProps) {
        super(scope, id, props);

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
                authorizer: new apigw.CognitoUserPoolsAuthorizer(this, 'UserPoolAuthorizer', { cognitoUserPools: [props.UserPool] })
            },
            deployOptions: {
                methodOptions: {
                    '*/*': {
                        throttlingBurstLimit: 1500,
                        throttlingRateLimit: 1000
                    }
                }
            }
        });

        const deployment = new apigw.Deployment(this, 'Deployment', {
            api: api,
        })

        this.stage = new apigw.Stage(this, 'Stage', {
            deployment: deployment,
            stageName: props.stageName
        })

        const preferencesApi = api.root.addResource('preferences');
        const metadataApi = api.root.addResource('metadata');

        preferencesApi.addMethod('GET', new apigw.LambdaIntegration(props.UserPreferencesGet), {});
        preferencesApi.addMethod('PUT', new apigw.LambdaIntegration(props.UserPreferencesPut), {});
        preferencesApi.addMethod('DELETE', new apigw.LambdaIntegration(props.UserPreferencesDelete), {});
        metadataApi.addMethod('GET', new apigw.LambdaIntegration(props.FeedMetadataGet), {});

        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url ?? ""
        });
    }
}