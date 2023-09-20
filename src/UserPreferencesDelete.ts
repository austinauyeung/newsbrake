import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addCORSHeaders } from './lib/corsLib'

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const origin = event.headers ? (event.headers.Origin || event.headers.origin) : undefined;
    const corsHeaders = addCORSHeaders(origin, 'DELETE')

    const authProvider = event.requestContext.identity.cognitoAuthenticationProvider;
    const parts = authProvider?.split(':') || [];
    const userPoolUserId = parts[parts.length - 1];

    const params: DynamoDB.DocumentClient.DeleteItemInput = {
        TableName: tableName,
        Key: {
            'userId': userPoolUserId
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
        console.error(event.body);
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
            headers: {
                ...corsHeaders,
            },
        }
    }
};