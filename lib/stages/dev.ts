import * as cdk from 'aws-cdk-lib/core';
import { DatabaseStack } from '../database-stack';
import { AuthStack } from '../auth-stack';
import { ApigwStack } from '../apigw-stack';

export class DevStage extends cdk.Stage {
    constructor(scope: cdk.App, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        const database = new DatabaseStack(this, 'DatabaseStack-dev', {})
        const auth = new AuthStack(this, 'AuthStack-dev', {
            UserInternalInfoPost: database.UserInternalInfoPost,
            UserPreferencesPost: database.UserPreferencesPost
        })
        new ApigwStack(this, 'ApigwStack', {
            UserPool: auth.UserPool,
            UserPreferencesGet: database.UserPreferencesGet,
            UserPreferencesPut: database.UserPreferencesPut,
            UserPreferencesDelete: database.UserPreferencesDelete,
            FeedMetadataGet: database.FeedMetadataGet,
            stageName: "dev"
        })
    }
}