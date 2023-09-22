import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async (_: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const params = {
        TableName: tableName,
    };

    try {
        const data = await dynamo.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({
                data: data,
            }),
        };
    } catch (error: any) {
        console.log(error)
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error
            }),
        };
    }
};