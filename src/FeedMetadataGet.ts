import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { addCORSHeaders } from './lib/corsLib';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const params = {
        TableName: tableName,
    };

    const origin = event.headers ? (event.headers.Origin || event.headers.origin) : undefined;
    const corsHeaders = addCORSHeaders(origin, 'GET')

    try {
        const data = await dynamo.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                data: data,
            }),
            headers: {
                ...corsHeaders,
            },
        };
    } catch (error: any) {
        console.log(error)
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