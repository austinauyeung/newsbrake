import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableNameMetadata = process.env.TABLENAME_METADATA || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const params = {
        TableName: tableNameMetadata,
    };

    try {
        const data = await dynamo.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                data: data,
                event: event
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,GET",
                "Access-Control-Allow-Credentials": "true",
            },
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,GET",
                "Access-Control-Allow-Credentials": "true",
            },
        };
    }
};