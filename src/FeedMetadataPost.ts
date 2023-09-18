import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const tableName = process.env.TABLENAME || '';

exports.handler = async () => {
    // current approach is to clear and rewrite table
    const scanResult = await dynamo.scan({
        TableName: tableName
    }).promise();
    const deletePromises = scanResult.Items ? scanResult.Items.map(item => {
        return dynamo.delete({
            TableName: tableName,
            Key: {
                feedName: item.feedName
            }
        }).promise();
    }) : [];
    await Promise.all(deletePromises)

    const items = [
        {
            feedName: 'Wikipedia',
            category: 'News',
            subfeeds: {
                'Current Events': 'https://en.wikipedia.org/wiki/Portal:Current_events'
            },
        },
        {
            feedName: 'The Conversation',
            category: 'News',
            subfeeds: {
                'All Articles - English': 'https://theconversation.com/articles.atom?language=en',
                'All Articles - Spanish': 'https://theconversation.com/articles.atom?language=es',
                'All Articles - French': 'https://theconversation.com/articles.atom?language=fr',
                'All Articles - Indonesian': 'https://theconversation.com/articles.atom?language=id',
                'All Articles - Portuguese': 'https://theconversation.com/articles.atom?language=pt'
            },
        },
        {
            feedName: 'KFF Health News',
            category: 'Health',
            subfeeds: {
                'Original Content': 'https://kffhealthnews.org/topics/syndicate/feed/aprss'
            },
        },
    ]

    const putPromises = items.map(item => {
        return dynamo.put({
            TableName: tableName,
            Item: item
        }).promise();
    })
    await Promise.all(putPromises);

    return {
        status: 'Success'
    };

}