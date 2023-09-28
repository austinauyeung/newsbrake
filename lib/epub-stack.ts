import * as cdk from 'aws-cdk-lib/core';
import { Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

interface EpubStackProps extends cdk.StackProps {
    UserPreferences: dynamodb.Table;
    UserInternalInfo: dynamodb.Table;
    FeedMetadata: dynamodb.Table;
}

export class EpubStack extends Stack {
    constructor(scope: cdk.Stage, id: string, props: EpubStackProps) {
        super(scope, id, props);

        const sendEpub = new lambda.Function(this, 'SendEpub', {
            runtime: lambda.Runtime.PYTHON_3_8,
            handler: 'SendEpub.handler',
            code: lambda.Code.fromAsset('dist/src/py'),
            environment: {
                TABLE_USERPREFERENCES: props.UserPreferences.tableName,
                TABLE_USERINTERNALINFO: props.UserInternalInfo.tableName,
                TABLE_FEEDMETADATA: props.FeedMetadata.tableName,
            },
            timeout: cdk.Duration.seconds(600),
        });

        props.UserPreferences.grantReadData(sendEpub);
        props.UserInternalInfo.grantWriteData(sendEpub);
        props.FeedMetadata.grantReadData(sendEpub);

        sendEpub.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['ses:SendEmail', 'ses:SendRawEmail'],
                resources: ['*'],
            })
        )

        new events.Rule(this, 'SendEpubHourly', {
            // schedule: events.Schedule.rate(cdk.Duration.days(10)),
            schedule: events.Schedule.cron({
                minute: '0',
                hour: '0/1'
            }),
            targets: [new targets.LambdaFunction(sendEpub)]
        })
    }
}