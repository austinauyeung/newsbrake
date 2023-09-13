import { DynamoDB } from 'aws-sdk';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableNamePreferences = process.env.TABLENAME_PREFERENCES || '';

exports.handler = async (event: PostConfirmationTriggerEvent) => {
    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        const userId = event.request.userAttributes.sub;
        const item = {
            userId: userId,
            fetchTime: -1,
            feeds: {
                'Wikipedia': {
                    'Current Events': 0,
                },
                'The Conversation': {
                    'All Articles': 0,
                },
                'KFF Health News': {
                    'Original Content': 0,
                }
            }
        };

        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: tableNamePreferences,
            Item: item
        };

        try {
            await dynamo.put(params).promise();
            console.log("Successfully created DynamoDB item.");
        } catch (error: any) {
            console.error(error);
        }
    }

    return event;

};