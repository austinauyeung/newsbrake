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
            feedName: 'The Conversation',
            category: 'News',
            url: 'https://theconversation.com/',
            logo: 'https://cdn.theconversation.com/static/tc/@theconversation/ui/dist/esm/logos/logo-horizontal-en-df7faf4238d541b16db76bba081fdd73.png',
            subfeeds: {
                'All Articles - English': 'https://theconversation.com/articles.atom?language=en',
                'United States - English': 'https://theconversation.com/us/articles.atom',
            },
        },
        {
            feedName: 'KFF Health News',
            category: 'Health',
            url: 'https://kffhealthnews.org/',
            logo: 'https://kffhealthnews.org/wp-content/themes/kaiser-healthnews-2017/static/images/kffhealthnews-logo.svg',
            subfeeds: {
                'Original Content': 'https://kffhealthnews.org/topics/syndicate/feed/aprss'
            },
        },
        {
            feedName: 'ProPublica',
            category: 'Investigative',
            url: 'https://www.propublica.org/',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/ProPublica_text_logo.svg',
            subfeeds: {
                'Articles and Investigations': 'https://www.propublica.org/feeds/propublica/main'
            },
        },
        {
            feedName: "The Journalist's Resource",
            category: 'News',
            url: 'https://journalistsresource.org/',
            logo: 'https://journalistsresource.org/wp-content/uploads/2021/02/logo.svg',
            subfeeds: {
                "The Journalist's Resource": 'https://feeds.feedburner.com/journalistsresource'
            },
        },
        {
            feedName: 'Common Dreams',
            category: 'News',
            url: 'https://www.commondreams.org/',
            logo: 'https://assets.rbl.ms/32373543/origin.png',
            subfeeds: {
                'Common Dreams': 'https://www.commondreams.org/feeds/feed.rss'
            },
        },
        {
            feedName: 'Reveal',
            category: 'Investigative',
            url: 'https://revealnews.org/',
            logo: 'https://i0.wp.com/revealnews.org/wp-content/uploads/2019/04/reveal-logo-black-on-transparent.png?ssl=1',
            subfeeds: {
                'Reveal': 'https://revealnews.org/feed/'
            },
        },
        {
            feedName: 'Global Voices',
            category: 'News',
            url: 'https://globalvoices.org/',
            logo: 'https://globalvoices.org/wp-content/themes/gv-news-child-theme/gv-news-theme-logo-600.png',
            subfeeds: {
                'Global Voices': 'https://globalvoices.org/feed/?cat=-28'
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