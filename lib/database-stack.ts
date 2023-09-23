import * as cdk from 'aws-cdk-lib/core';
import { Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as triggers from 'aws-cdk-lib/triggers';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class DatabaseStack extends Stack {
    public readonly UserInternalInfoPost: lambda.Function;
    public readonly UserPreferencesPost: lambda.Function;
    public readonly UserPreferencesGet: lambda.Function;
    public readonly UserPreferencesPut: lambda.Function;
    public readonly UserPreferencesDelete: lambda.Function;
    public readonly FeedMetadataGet: lambda.Function;

    constructor(scope: cdk.Stage, id: string, props?: cdk.StackProps) {
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

        this.UserPreferencesPost = new lambda.Function(this, 'UserPreferencesPost', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesPost.handler',
            code: lambda.Code.fromAsset('dist/src'),
            environment: {
                TABLENAME: UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferencesGet = new lambda.Function(this, 'UserPreferencesGet', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesGet.handler',
            code: lambda.Code.fromAsset('dist/src'),
            environment: {
                TABLENAME: UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferencesPut = new lambda.Function(this, 'UserPreferencesPut', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesPut.handler',
            code: lambda.Code.fromAsset('dist/src'),
            environment: {
                TABLENAME: UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        this.UserPreferencesDelete = new lambda.Function(this, 'UserPreferencesDelete', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserPreferencesDelete.handler',
            code: lambda.Code.fromAsset('dist/src'),
            environment: {
                TABLENAME: UserPreferences.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        UserPreferences.grantWriteData(this.UserPreferencesPost);
        UserPreferences.grantReadData(this.UserPreferencesGet);
        UserPreferences.grantWriteData(this.UserPreferencesPut);
        UserPreferences.grantWriteData(this.UserPreferencesDelete);

        // DynamoDB table storing user internal info
        const UserInternalInfo = new dynamodb.Table(this, 'UserInternalInfo', {
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.UserInternalInfoPost = new lambda.Function(this, 'UserInternalInfoPost', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'UserInternalInfoPost.handler',
            code: lambda.Code.fromAsset('dist/src'),
            environment: {
                TABLENAME: UserInternalInfo.tableName,
            },
            timeout: cdk.Duration.seconds(10),
        });

        UserInternalInfo.grantWriteData(this.UserInternalInfoPost);

        // DynamoDB table storing feed metadata and related Lambda functions
        const FeedMetadata = new dynamodb.Table(this, 'FeedMetadata', {
            partitionKey: { name: 'feedName', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        this.FeedMetadataGet = new lambda.Function(this, 'FeedMetadataGet', {
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
        FeedMetadata.grantReadData(this.FeedMetadataGet)
    }
}