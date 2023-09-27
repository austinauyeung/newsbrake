import * as cdk from 'aws-cdk-lib/core';
import { DatabaseStack } from '../database-stack';
import { AuthStack } from '../auth-stack';
import { ApigwStack } from '../apigw-stack';
import { EpubStack } from '../epub-stack';

export class DevStage extends cdk.Stage {
    constructor(scope: cdk.App, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        const database = new DatabaseStack(this, 'DatabaseStack', {})
        const auth = new AuthStack(this, 'AuthStack', {
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
        new EpubStack(this, 'EpubStack', {
            UserPreferences: database.UserPreferences,
            UserInternalInfo: database.UserInternalInfo,
            FeedMetadata: database.FeedMetadata
        })
    }
}