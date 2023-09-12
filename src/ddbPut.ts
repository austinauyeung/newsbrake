import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const data = JSON.parse(event.body || '{}');
    let responseMessage: string;

    const params: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: tableName,
        Key: {
            'id': 'user1'
        },
        UpdateExpression: 'set val1 = :x',
        ExpressionAttributeValues: {
            ':x': data.newAttributeValue
        }
    };

    try {
        await dynamo.update(params).promise();
        responseMessage = `Successfully updated item with ID: user1`;
    } catch (err) {
        responseMessage = `Unable to update item. Error: ${err}`;
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify({ event: responseMessage }),
    };

    return response;
};