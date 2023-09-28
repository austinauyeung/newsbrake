import os
import boto3
import pytz
from datetime import datetime, timedelta
import feedparser
from ebooklib import epub
from bs4 import BeautifulSoup
import re
from collections import defaultdict
from urllib.parse import urlparse
import requests
from decimal import Decimal
from emailer import Emailer

# building packages using https://hub.docker.com/r/lambci/lambda/

os.chdir('/tmp')
dynamodb = boto3.resource('dynamodb')
TABLE_USERPREFERENCES = os.environ['TABLE_USERPREFERENCES']
TABLE_USERINTERNALINFO = os.environ['TABLE_USERINTERNALINFO']
TABLE_FEEDMETADATA = os.environ['TABLE_FEEDMETADATA']
current_time = datetime.now(pytz.timezone('US/Eastern'))
current_hour = current_time.hour

headers = {'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'}

def get_current_users():
    userPreferences = dynamodb.Table(TABLE_USERPREFERENCES)
    userPreferencesResponse = userPreferences.query(
        IndexName='GSI',
        KeyConditionExpression='fetchTime = :partitionValue AND feedEnabled = :sortValue',
        ExpressionAttributeValues={
            ':partitionValue': current_hour,
            ':sortValue': 1
        }
    )
    return userPreferencesResponse

def get_metadata():
    feedMetadata = dynamodb.Table(TABLE_FEEDMETADATA)
    feedMetadataResponse = feedMetadata.scan()

    unflatten = {}
    for feed in feedMetadataResponse['Items']:
        feedName = feed.pop('feedName')
        unflatten[feedName] = feed
    return unflatten

def get_feed_urls(unflattened, userPref):
    urls = []
    try:
        for feed in unflattened:
            for subfeed in unflattened[feed]['subfeeds']:
                if int(userPref['feeds'][feed][subfeed]):
                    urls.append(unflattened[feed]['subfeeds'][subfeed])
    except:
        print('Feed error.')
        print(urls)
    return urls

def process_entry_content(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    for figure in soup.find_all('figure'):
        figure.decompose()
    for img in soup.find_all('img'):
        img.decompose()
    for div in soup.find_all('div', {"class": "sharing"}):
        div.decompose()
    for p in soup.find_all('p', {"class": "byline"}):
        p.decompose()
    for p in soup.find_all('p', {"class": "wp-caption-text"}):
        p.decompose()
    for big in soup.find_all('big'):
        h1 = soup.new_tag('h1')
        h1.string = big.string
        big.replace_with(h1)
    for element in soup.find_all(True, {"class": True}):
        del element['class']
    return str(soup)

def get_feed_content(unflattened):
    content = {}
    for feed in unflattened:
        for subfeed in unflattened[feed]['subfeeds']:
            url = unflattened[feed]['subfeeds'][subfeed]
            content[url] = feedparser.parse(requests.get(url, headers=headers).content)
    return content

def generate_toc_html(chapters):
    toc_content = '<h1>Table of Contents</h1>'
    for chapter in chapters:
        toc_content += '<p><a href="{}">{}</a></p>'.format(chapter.file_name, chapter.title)
    return toc_content

def create_epub(feeds, id):
    book = epub.EpubBook()
    book.set_identifier('sample_id')
    book.set_title(datetime.today().strftime('%B %d, %Y'))
    book.set_language('en')
    book.add_author('newsbrake')

    spine = ['nav']
    toc = defaultdict(list)

    current_time_utc = datetime.utcnow()

    for feed in feeds:
        chapter_title = feed.feed.title

        # replace non-alphanumeric with single hyphen
        filename = re.sub(r'[^a-zA-Z0-9]', '-', chapter_title)
        filename = re.sub(r'-+', '-', filename)
        filename = filename.strip('-') + '.xhtml'

        # add feed to main TOC
        chapter = epub.EpubHtml(title=chapter_title, file_name=filename, lang='en')
        chapter.content = f'<h1>{chapter_title}</h1>'
        book.add_item(chapter)
        spine.append(chapter)

        for entry in feed.entries:
            published_dt = datetime(*entry.published_parsed[:6])
            if published_dt < current_time_utc - timedelta(hours=24):
                continue

            subchapter_title = entry.title
            processed_content = ''
            contents = entry.get('content') or entry.get('summary_detail')
            contents = [contents] if not isinstance(contents, list) else contents

            for content in contents:
                if content.type == 'text/html':
                    processed_content = process_entry_content(content.value)
            filename_entry = f"{urlparse(entry.link).path.lstrip('/').rstrip('/')}.xhtml"
            subchapter = epub.EpubHtml(title=subchapter_title, file_name=filename_entry, lang='en')

            authors = ''
            for author in entry.authors:
                if 'name' in author:
                    name = [item.strip() for item in author.name.split(',', 1)]
                    authors += f'<p><strong>{name[0]}</strong>, {name[1]}</p>' if len(name) > 1 else f'<p><strong>{name[0]}</strong></p>'

            subchapter.content = f'<h1>{subchapter_title}</h1>{authors}<div>{processed_content}</div>'
            book.add_item(subchapter)
            spine.append(subchapter)
            toc[chapter].append(subchapter)

            # add subfeed to sub TOC
            chapter.content += '<p><a href="{}">{}</a></p>'.format(filename_entry, subchapter_title) 

    cover = epub.EpubHtml(title='End', file_name='end.xhtml', lang='en')
    cover.content = '<h3>(end of file)</h3>'
    book.add_item(cover)
    spine.append(cover)

    # book.toc = tuple((chapter, tuple(toc[chapter])) for chapter in toc)
    book.toc = tuple(chapter for chapter in toc)

    book.spine = spine
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())


    if not os.path.exists(os.path.join(os.getcwd(), id)):
        os.makedirs(os.path.join(os.getcwd(), id), exist_ok=True)
    epub.write_epub(f"/tmp/{id}/newsbrake.epub", book)

def send_epub(feeds, id, email, fail=False):
    create_epub(feeds, id)

    emailer = Emailer()
    emailer.send(
        to=email,
        subject="Your daily newsbrake",
        fromx='delivery@newsbrake.app',
        body='',
        attachments=[f'/tmp/{id}/newsbrake.epub']
    )

def handler(event, context):

    users = get_current_users()['Items']
    unflattened = get_metadata()

    content = get_feed_content(unflattened)
    try:
        for userPref in users:
            userId = userPref['userId']
            userEmail = userPref['kindleEmail']
            urls = get_feed_urls(unflattened, userPref)
            if len(urls):
                userFeeds = [content[url] for url in urls]
                send_epub(userFeeds, userId, userEmail)
    except Exception as e:
        print(e)