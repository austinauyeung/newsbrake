import { DynamoDB } from 'aws-sdk';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (event: PostConfirmationTriggerEvent) => {
    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        const userId = event.request.userAttributes.sub;
        const item = {
            userId: userId,
            fetchTime: 6,
            feedEnabled: 0,
            kindleEmail: "",
            feeds: {},
            lastFetched: "2023-09-04T00:00:00.000Z",
        };

        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: tableName,
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