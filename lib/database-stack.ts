import * as cdk from 'aws-cdk-lib/core';
import { Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as triggers from 'aws-cdk-lib/triggers';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class DatabaseStack extends Stack {
    public readonly UserPreferencesPost: lambda.Function;
    public readonly UserPreferencesGet: lambda.Function;
    public readonly UserPreferencesPut: lambda.Function;
    public readonly UserPreferencesDelete: lambda.Function;
    public readonly FeedMetadataGet: lambda.Function;
    public readonly UserPreferences: dynamodb.Table;
    public readonly FeedMetadata: dynamodb.Table;

    constructor(scope: cdk.Stage, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // DynamoDB table storing user preferences and related Lambda functions
        this.UserPreferences = new dynamodb.Table(this, 'UserPreferences', {
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.UserPreferences.addGlobalSecondaryIndex({
            indexName: 'GSI',
            partitionKey: {
                name: 'fetchTime',
                type: dynamodb.AttributeType.NUMBER,
            },
            sortKey: {
                name: 'feedEnabled',
                type: dynamodb.AttributeType.NUMBER,
            }
        });

        this.UserPreferencesPost = new lambda.Function(this, 'UserPreferencesPost', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesPost.handler',
            code: lambda.Code.fromAsset('dist/src/js'),
            environment: {
                TABLENAME: this.UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferencesGet = new lambda.Function(this, 'UserPreferencesGet', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesGet.handler',
            code: lambda.Code.fromAsset('dist/src/js'),
            environment: {
                TABLENAME: this.UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferencesPut = new lambda.Function(this, 'UserPreferencesPut', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesPut.handler',
            code: lambda.Code.fromAsset('dist/src/js'),
            environment: {
                TABLENAME: this.UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferencesDelete = new lambda.Function(this, 'UserPreferencesDelete', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesDelete.handler',
            code: lambda.Code.fromAsset('dist/src/js'),
            environment: {
                TABLENAME: this.UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferences.grantWriteData(this.UserPreferencesPost);
        this.UserPreferences.grantReadData(this.UserPreferencesGet);
        this.UserPreferences.grantWriteData(this.UserPreferencesPut);
        this.UserPreferences.grantWriteData(this.UserPreferencesDelete);

        // DynamoDB table storing feed metadata and related Lambda functions
        this.FeedMetadata = new dynamodb.Table(this, 'FeedMetadata', {
            partitionKey: { name: 'feedName', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.FeedMetadataGet = new lambda.Function(this, 'FeedMetadataGet', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'FeedMetadataGet.handler',
            code: lambda.Code.fromAsset('dist/src/js'),
            environment: {
                TABLENAME: this.FeedMetadata.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        })

        const FeedMetadataPost = new triggers.TriggerFunction(this, 'FeedMetadataPost', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'FeedMetadataPost.handler',
            code: lambda.Code.fromAsset('dist/src/js'),
            environment: {
                TABLENAME: this.FeedMetadata.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        })

        this.FeedMetadata.grantReadWriteData(FeedMetadataPost);
        this.FeedMetadata.grantReadData(this.FeedMetadataGet)
    }
}