import * as cdk from 'aws-cdk-lib/core';
import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface AuthStackProps extends cdk.StackProps {
    UserInternalInfoPost: lambda.IFunction;
    UserPreferencesPost: lambda.IFunction;
}

export class AuthStack extends Stack {
    public readonly UserPool: cognito.UserPool;

    constructor(scope: cdk.Stage, id: string, props: AuthStackProps) {
        super(scope, id, props);

        const PostConfirmation = new lambda.Function(this, 'PostConfirmation', {
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'PostConfirmation.handler',
            code: lambda.Code.fromAsset('dist/src'),
            environment: {
                USERINTERNALINFO: props.UserInternalInfoPost.functionName,
                USERPREFERENCES: props.UserPreferencesPost.functionName
            },
            timeout: cdk.Duration.seconds(10),
        });

        props?.UserInternalInfoPost.grantInvoke(PostConfirmation);
        props?.UserPreferencesPost.grantInvoke(PostConfirmation);

        // Cognito User Pool and Client
        this.UserPool = new cognito.UserPool(this, 'UserPool', {
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
        const UserPoolClient = this.UserPool.addClient('UserPoolClient');

        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.UserPool.userPoolId ?? ""
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: UserPoolClient.userPoolClientId ?? ""
        });
    }
}