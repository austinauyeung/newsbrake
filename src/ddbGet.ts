// import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent } from 'aws-lambda';

// const dynamo = new DynamoDB.DocumentClient();
// const tableName = process.env.TABLE_NAME || '';

exports.handler = async (event: APIGatewayProxyEvent) => {
    const data = JSON.parse(event.body || '{}');
    console.log(data)
    // const params = {
    //     TableName: tableName,
    // };

    try {
        // const data = await dynamo.scan(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(event),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,GET",
                "Access-Control-Allow-Credentials": "true",
            },
            body: JSON.stringify({ error: event }),
        };
    }
};