import re
import random
import string
from bs4 import BeautifulSoup, Tag, NavigableString
import mechanize
import HTMLParser

from data import User

link_regex = re.compile(r"""(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,13}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?]))""")


class MLStripper(HTMLParser.HTMLParser):
    '''Class for stripping HTML, used in scrape_html'''
    def __init__(self):
        self.reset()
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)

    def get_data(self):
        return " ".join(self.fed).replace('  ', ' ')

    @staticmethod
    def strip_html(text):
        s = MLStripper()
        s.feed(text)
        return s.get_data()


def clean_html(html):
    html = re.sub(r'</?html>', '', html)
    html = re.sub(r'</?body>', '', html)
    html = re.sub(r'&(amp;)?lt;', '&lt;', html)
    html = re.sub(r'&(amp;)?gt;', '&gt;', html)
    return html


def get_opengraph(url, params=['title', 'image', 'description', 'site_name', 'url']):
    try:
        br = mechanize.Browser()
        br.open(url.encode('utf8'), timeout=5)
        html = br.response().read()
    except Exception, e:
        d = {p: None for p in params}
        d['url'] = url
        return d

    soup = BeautifulSoup(html)
    if soup.title:
        soup_title = soup.title.text.strip()
    else:
        soup_title = None

    d = {}
    for param in params:
        og_search = soup.find(property='og:' + param)
        if og_search and og_search.has_attr('content'):
            d[param] = og_search[u'content']
        else:
            d[param] = None

    if not d.get('title'):
        d['title'] = soup_title or url

    if not d.get('site_name'):
        domain = re.search(r"(?:https?:\/\/)?(?:www\.)?([^\/]+)", url)
        if domain:
            d['site_name'] = domain.group(1)
        else:
            try:
                d['site_name'] = url.split('//')[-1].split('/')[0]
            except:
                d['site_name'] = url

    if not d.get('url'):
        d['url'] = url

    return d


def get_embed_link(video_url):
    if 'youtube.com' in video_url:
        try:
            videoid = re.search(r'watch\?v=([^#\&\?]+)', video_url).group(1)
            return "https://www.youtube.com/embed/%s" % videoid
        except:
            return None
    elif 'youtu.be' in video_url:
        try:
            videoid = re.search(r'youtu.be/([^#\&\?]+)', video_url).group(1)
            return "https://www.youtube.com/embed/%s" % videoid
        except:
            return None
    elif 'vimeo.com' in video_url:
        try:
            videoid = re.search(r'vimeo.com/(?:.+?/)*(\d+)', video_url).group(1)
            return "https://player.vimeo.com/video/%s" % videoid
        except:
            return None
    else:
        return None


def test_embed():
    urls = [
        "https://vimeo.com/113423438",
        "https://vimeo.com/channels/staffpicks/126210095",
        "https://www.youtube.com/watch?v=Av8sn7BXLxE",
        "https://www.youtube.com/watch?v=8r-e2NDSTuE",
        "https://www.youtube.com/watch?v=NbuUW9i-mHs",
        "https://www.youtube.com/watch?v=AqjxjMcLK9U",
        "https://www.youtube.com/watch?v=zY_g-oz11AI",
        "https://youtu.be/AqjxjMcLK9U",
        "https://youtu.be/bigsk2g7xO8",
    ]
    for url in urls:
        print url, get_embed_link(url)


def format_links(html):
    '''
    This monster of a function takes in the html from a post and returns a dict
        containing html, text, summary.
    Uses opengraph to try to get titles for all untitled links, and tries to hyperlink everything.
    '''
    edit_html = html
    html = html.replace('&#34;', '"')
    soup = BeautifulSoup(re.sub(r'&(?!amp;)', r'&amp;', html))

    reformat_str = ''.join(random.sample(string.ascii_uppercase, 10)) + '__'
    reformat_dict = {}
    videos = []
    image = None

    # Set aside all <img> tags, because we need to treat them special and will add them in later.
    for tag_index, img_tag in enumerate(soup.find_all('img')):
        key = reformat_str + 'img' + str(tag_index)
        img_tag.replace_with(key)

        # handle the shitty case where a user inputs a non-http link
        if img_tag.has_attr('src') and not img_tag['src'].startswith('http'):
            new_src = 'http://' + img_tag['src']
            img_tag['src'] = new_src
        if not image:
            image = img_tag['src']

        reformat_dict[key] = img_tag

    # Set aside all <a> tags, because we need to treat them special and will add them in later.
    for tag_index, a_tag in enumerate(soup.find_all('a')):
        key = reformat_str + 'a' + str(tag_index)
        a_tag.replace_with(key)

        # handle the shitty case where a user inputs a non-http link
        if a_tag.has_attr('href'):
            new_href = a_tag['href'].strip()
            if not new_href.startswith('http'):
                new_href = 'http://' + a_tag['href']
            a_tag['href'] = new_href
            embed_link = get_embed_link(new_href)
            if embed_link:
                videos.append(embed_link)

        a_tag['target'] = '_blank'

        try:
            if a_tag.string and a_tag['href'] and a_tag.string in a_tag['href']:
                og_title = get_opengraph(a_tag['href'], params=['title']).get('title')
                a_tag.string = og_title.strip()
        except:
            pass

        reformat_dict[key] = a_tag

    mentions = []
    # Find all mentions and format them
    mention_regex = re.compile(r'(@\S+(?:\s\S+)?)')
    for mention_index, mention_str in enumerate(soup(text=mention_regex)):
        key = reformat_str + 'm' + str(mention_index)
        mention_split_list = mention_regex.split(mention_str)
        parent_tag = Tag(name='span')

        for piece in mention_split_list:
            if type(piece) in [unicode, str]:
                s = mention_regex.search(piece)
                if s:
                    first_letter = re.search(r"@\S+", piece).group()[1]
                    names = [u.name for u in User.objects(name__istartswith=first_letter)]
                    for i in range(len(piece) - 1):
                        query_name = re.compile(piece[1:len(piece) - i], flags=re.IGNORECASE)
                        matches = len([name for name in names if query_name.match(name)])
                        if matches == 1:
                            a_tag = Tag(name='a')
                            target_user = User.objects(name=query_name).get()
                            a_tag['href'] = '/profile/%s' % str(target_user.id)
                            a_tag['target'] = '_blank'
                            a_tag['mention'] = 'Yes'
                            a_tag.string = '@' + query_name.pattern
                            parent_tag.append(a_tag)
                            parent_tag.append(NavigableString(piece[len(piece) - i:]))
                            mentions.append(str(target_user.id))
                            break
                    else:
                        # for/else structure
                        # catch an @ that didn't match any users
                        parent_tag.append(NavigableString(piece))
                else:
                    parent_tag.append(NavigableString(piece))

        reformat_dict[key] = parent_tag
        mention_str.replace_with(key)

    opengraph_index = 0
    opengraph_objects = []

    # Find all plaintext links and format them.
    for p in soup.find_all('p'):
        p_text = unicode(p.text)
        if link_regex.search(p_text):
            new_p = Tag(name='p')
            opengraph_only = False
            p_opengraph_objects = []

            link_split_list = link_regex.split(p_text)
            for piece in link_split_list:
                if type(piece) in [unicode, str]:
                    s = link_regex.search(piece)
                    if s:
                        link_text = s.group().strip()
                        if not link_text.startswith('http'):
                            link_text = 'http://' + link_text
                        opengraph = get_opengraph(link_text)
                        a_tag = Tag(name='a')
                        a_tag.string = opengraph.get('title', link_text) or link_text
                        a_tag['href'] = link_text
                        a_tag['target'] = '_blank'

                        if not image and opengraph['image']:
                            image = opengraph['image']

                        embed_link = get_embed_link(link_text)
                        if embed_link:
                            videos.append(embed_link)
                        else:
                            num_items = 0
                            for item in link_split_list:
                                if item and not re.match(r'^<.+>$', item):
                                    num_items += 1
                            if num_items == 1:
                                opengraph_objects.append(opengraph)
                                p_opengraph_objects.append(opengraph)
                                opengraph_only = True

                        new_p.append(a_tag)
                    else:
                        new_p.append(NavigableString(piece))

            if opengraph_only:
                new_p = Tag(name='p')

            for obj in p_opengraph_objects:
                div = Tag(name='div db-opengraph')
                div['site'] = 'comment.opengraph[%d]' % opengraph_index
                opengraph_index += 1
                new_p.append(div)

            p.replace_with(new_p)

    # Bring back all set-aside <a> and <img> tags
    for key in reformat_dict:
        soup(text=key)[0].replace_with(reformat_dict[key])

    # Extract html from soup
    html = unicode(soup)
    html = clean_html(html)

    # Anonymized html
    for mention in soup.find_all('a', attrs={'mention': 'Yes'}):
        mention.replace_with(NavigableString('@User'))
    anonymized_html = unicode(soup)
    anonymized_html = clean_html(anonymized_html)

    # Generate text
    text = MLStripper.strip_html(html)
    anonymized_text = MLStripper.strip_html(anonymized_html)

    # Generate summary
    first_paragraph = re.compile('<p>.+?(<br/>|</p>)').search(html)
    if first_paragraph:
        summary = MLStripper.strip_html(first_paragraph.group())
    if not summary and opengraph_objects:
        summary = opengraph_objects[0]['title']
    if not summary and text:
        summary = text
    if not summary:
        summary = ""

    # Generate anonymized summary
    first_paragraph = re.compile('<p>.+?(<br/>|</p>)').search(anonymized_html)
    if first_paragraph:
        anonymized_summary = MLStripper.strip_html(first_paragraph.group())
    if not anonymized_summary and opengraph_objects:
        anonymized_summary = opengraph_objects[0]['title']
    if not anonymized_summary and text:
        anonymized_summary = text
    if not anonymized_summary:
        anonymized_summary = ""

    # In summary, we should all the pesky double-spaces and truncate if necessary
    summary = summary.replace('  ', ' ')
    if len(summary) > 100:
        summary = summary[:97] + '...'
    anonymized_summary = anonymized_summary.replace('  ', ' ')
    if len(anonymized_summary) > 100:
        anonymized_summary = anonymized_summary[:97] + '...'

    return {'html': html, 'edit_html': edit_html, 'summary': summary, 'text': text,
            'anonymized_html': anonymized_html, 'anonymized_summary': anonymized_summary,
            'mentions': mentions, 'videos': videos, 'opengraph': opengraph_objects, 'image': image}


def main():
    links = [
        'priceonomics.com/the-independent-discovery-of-tcpip-by-ants/?utm_source=digg&utm_medium=email',
        'luckypeach.com/food-consequences-food-for-monsters/',
        'youtube.com/watch?v=8CrOL-ydFMI',
        'google.com/s?ssl=25&stfu=1#2',
        'http://nces.ed.gov/programs/coe/indicator_caa.asp',
    ]

    htmls = []
    for link in links:
        htmls.append('<p>%s</p><p>Great article that I found</p>' % link)

    for html in htmls:
        print '===' * 20
        print repr(html)
        d = format_links(html)
        print repr(d['html'])
        print repr(d['summary'])


if __name__ == '__main__':
    main()
