import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;
    try {
        const data = await (new DynamoDB).getItem({
            TableName: tableName,
            Key: {
                'userId': {
                    S: userId
                }
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                data: data,
                event: event
            }),
        };
    } catch (error: any) {
        console.error(error)
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error
            }),
        };
    }
};