import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableNamePreferences = process.env.TABLENAME_PREFERENCES || '';

exports.handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    "cognito-idp.us-east-1.amazonaws.com/us-east-1_IEhjr6nKL,cognito-idp.us-east-1.amazonaws.com/us-east-1_IEhjr6nKL:CognitoSignIn:52609b7d-ea76-4154-a0f1-5be7c10d8a01"
    const params = {
        TableName: tableNamePreferences,
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