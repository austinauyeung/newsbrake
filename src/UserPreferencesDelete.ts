import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addCORSHeaders } from './lib/corsLib';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const origin = event.headers ? (event.headers.Origin || event.headers.origin) : undefined;
    const corsHeaders = addCORSHeaders(origin, 'DELETE');

    const userId = event.requestContext.authorizer?.claims?.sub;
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
            headers: {
                ...corsHeaders,
            },
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 500,
            body: JSON.stringify(error),
            headers: {
                ...corsHeaders,
            },
        }
    }
};