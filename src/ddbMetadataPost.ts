import { DynamoDB } from 'aws-sdk';

const dynamo = new DynamoDB.DocumentClient();
const tableNameMetadata = process.env.TABLENAME_METADATA || '';

exports.handler = async () => {
    // current approach is to clear and rewrite table
    const scanResult = await dynamo.scan({
        TableName: tableNameMetadata
    }).promise();
    const deletePromises = scanResult.Items ? scanResult.Items.map(item => {
        return dynamo.delete({
            TableName: tableNameMetadata,
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
                'All Articles': 'https://theconversation.com/articles.atom?language=en'
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
            TableName: tableNameMetadata,
            Item: item
        }).promise();
    })
    await Promise.all(putPromises);

    return {
        status: 'Success'
    };

}