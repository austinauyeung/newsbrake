import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addCORSHeaders } from './lib/corsLib';

const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const origin = event.headers ? (event.headers.Origin || event.headers.origin) : undefined;
    const corsHeaders = addCORSHeaders(origin, 'GET');

    const userId = event.requestContext.authorizer?.claims?.sub;
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
            headers: {
                ...corsHeaders,
            },
        };
    } catch (error: any) {
        console.error(error)
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error
            }),
            headers: {
                ...corsHeaders,
            },
        };
    }
};