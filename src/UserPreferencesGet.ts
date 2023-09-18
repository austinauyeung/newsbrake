import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addCORSHeaders } from './lib/corsLib'

const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const authProvider = event.requestContext.identity.cognitoAuthenticationProvider;
    const parts = authProvider?.split(':') || [];
    const userPoolUserId = parts[parts.length - 1];

    const origin = event.headers ? (event.headers.Origin || event.headers.origin) : undefined;
    const corsHeaders = addCORSHeaders(origin, 'GET')

    try {
        const data = await (new DynamoDB).getItem({
            TableName: tableName,
            Key: {
                'userId': {
                    S: userPoolUserId
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