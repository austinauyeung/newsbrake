import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { fetchTime, feedEnabled, kindleEmail, feeds } = JSON.parse(event.body || '{}');
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    const params: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: tableName,
        Key: {
            'userId': userId
        },
        UpdateExpression: 'set fetchTime = :ft, feedEnabled = :fe, kindleEmail = :ke, feeds = :f',
        ExpressionAttributeValues: {
            ':ft': fetchTime,
            ':fe': feedEnabled,
            ':ke': kindleEmail,
            ':f': feeds
        },
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        const result = await dynamo.update(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(result),
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        }
    }
};