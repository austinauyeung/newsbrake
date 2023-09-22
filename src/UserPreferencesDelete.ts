import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    const params: DynamoDB.DocumentClient.DeleteItemInput = {
        TableName: tableName,
        Key: {
            'userId': userId
        }
    };

    try {
        const result = await dynamo.delete(params).promise();
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