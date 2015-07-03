import os
import re
import PIL
import sys
import math
import json
import time
import string
import base64
import random
import datetime
import cStringIO
from dateutil.relativedelta import relativedelta

from data import Q
from data import jsonify_data
from data import User
from data import Post
from data import Tip
from data import Flag
from data import Draft
from data import Email
from data import Invite
from data import Interaction
from data import Mention
from data import Notification
from data import Authentication
from data import PasswordResetToken
from data import AnonymousPost
from data import Pseudonyms
from data import Suggestion

import scrape_handler

from passlib.hash import sha256_crypt

from flask import Flask
from flask import request
from flask import redirect
from flask import make_response
from flask import send_from_directory
from flask.json import jsonify

from functools import wraps

app = Flask(__name__)
if os.environ.get('DEBUG'):
    app.debug = True
print 'top debug:', app.debug


def add_request_data(data, request):
    try:
        data['ip'] = ip
        data['browser'] = request.user_agent.browser
        data['platform'] = request.user_agent.platform
        ip_list = request.headers.getlist('X-forwarded-for')
        if ip_list:
            ip = ip_list[0]
        else:
            ip = request.remote_addr
    except:
        pass

    return data


def generate_code(length):
    return ''.join(random.SystemRandom().choice(string.ascii_lowercase) for _ in range(length))


def add_request_data(data, request):
    try:
        data['browser'] = request.user_agent.browser
        data['platform'] = request.user_agent.platform
        ip_list = request.headers.getlist('X-forwarded-for')
        if ip_list:
            ip = ip_list[0]
        else:
            ip = request.remote_addr
        data['ip'] = ip
    except Exception, e:
        print 'Error adding request data:', e

    return data


@app.route('/images/<image>')
@app.route('/robots.txt')
def static_from_root(image=None):
    return send_from_directory(app.static_folder, request.path[1:])


@app.before_request
def facebook_redirect():
    if 'images' in request.url:
        return

    user_agent = request.headers.get('User-Agent')
    if 'facebook' in user_agent or "Facebot" in user_agent:
        title = "Demo site"
        description = "An online community"

        if '/posts/' in request.url:
            postid = request.url.split('/')[-1]
            try:
                post = Post.objects(id=postid).first()
                if post:
                    title = post.anonymized_summary.encode('ascii', 'ignore')
                    description = "This is a demo site"
                    if post.image:
                        image = post.image

            except:
                pass

        return " ".join([
            "<html><head>",
            "<meta property=\"og:locale\" content=\"en_US\"/>",
            "<meta property=\"og:type\" content=\"article\"/>",
            u"<meta property=\"og:title\" content=\"%s\"/>" % title,
            u"<meta property=\"og:description\" content=\"%s\"/>" % description,
            u"<meta property=\"og:image\" content=\"%s\"/>" % image,
            u"<meta property=\"og:url\" content=\"%s\"/>" % request.url.encode('utf8', 'ignore'),
            "<meta property=\"og:site_name\" content=\"Demo Site\"/>",
            "</head><body></body></html>"
        ])


@app.before_request
def force_https():
    if os.environ.get('DEPLOY'):
        if 'DBoT' not in request.headers.get('User-Agent'):
            if request.headers.get('X-forwarded-proto') != 'https':
                return redirect(request.url.lower().replace('http', 'https'))


@app.route('/api/users', methods=['POST'])
def users():
    '''
    POST
        Purpose: Create a new user, return it
        Parameters: None
        Data: email, name, password, inviteCode
            email: string, contact info, required
            name: string, non-unique human-identifier for user, required
            password: string, required
            inviteCode: string code for invite bonus, optional*
        Returns: {user: {id: %s, name: %s, email: %s}}
        Errors: 400, 403, 409
            400: Unable to decode json
            400: Did not provide required data: email, name, password
            403: Card error: <error>.
            403: Invalid invite code: "<error>".
            409: Data conflict! There is already a user with email: "<email>"
        Examples:
            POST /users, data={'name': 'Example User', 'email': 'z@c2.com', 'password': 'pass1234', }
                Purpose: Create a new user with name Example User, email z@c2.com
                Returns: {'user': {'id': '541e81e3691fa40002c9e9ef', 'name': 'Example User', 'email': 'z@c2.com'}}
        Flows:
            User joins
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except ValueError:
        return 'Unable to decode json', 400

    for field in ['name', 'email', 'password']:
        if field not in data:
            return 'Did not provide required data: name, email, password', 400

    email_error = False
    if User.objects(email__iexact=data['email']).first():
        email_error = True

    invite_code = data.get('inviteCode')
    if invite_code:
        invite = Invite.objects(code__iexact=invite_code.lower(), accepted__ne=True).first()

    today = datetime.datetime.utcnow().date()

    user = User(
        email=data['email'].lower(),
        name=data['name'],
        password_hash=sha256_crypt.encrypt(data['password']),
        monthly_subscription=100,
        checklist=['reply', 'post', 'invite', 'community', 'completed', 'profile'],
        verification_code='',
    ).save()

    if not email_error and invite_code and invite:
        invite.update(set__inviteeid=str(user.id))
        invite.update(set__accepted=True)
        invite.update(set__accept_time=time.time() * 1000)
        user.update(set__inviteid=str(invite.id))
        try:
            inviter = User.objects(id=invite.inviterid).get()
            Notification(
                userid=str(inviter.id),
                objectid=str(invite.id),
                object_type='invite',
                time=time.time() * 1000,
                active=True,
                summary="%s accepted your invite!" % user.name,
                text="%s (%s) accepted your invite! You get a free month!" % (user.name, user.email),
                thumbnail=user.thumbnail,
                triggers_digest=True,
            ).save()

        except Exception, e:
            print 'Error giving free month', e

    user.update(set__next_billing=str(datetime.datetime.utcnow().date() + relativedelta(months=1)))
    user = user.reload()

    return jsonify_data(user)


@app.route('/api/users/<userid>', methods=['GET', 'POST'])
def user(userid):
    '''
    GET
        Purpose: Returns json for the user specified by userId
        Parameters: None
        Data: None
        Returns: {user: {id: %s, name: %s, email: %s}}
        Errors: 404
            404: User with specified userId not found
        Examples:
            GET /users/541e81e3691fa40002c9e9ef
                Purpose: Get the json for the specified user
                Returns: {'user': {'id': '541e81e3691fa40002c9e9ef', 'name': 'Example User',
                            'email': 'z@c2.com'}}
        Flows: None
    POST
        Purpose: Updates the user specified by userId
        Parameters: None
        Data: name, email, canceledSubscription, bio, location, inviteCode
            name: string, non-unique human-identifier for user, optional
            email: string, contact info, optional. Requires password authentication!
            canceledSubscription: 1 or 0, whether to cancel subscription, optional
            bio: string, user bio, optional
            location: string, user location, optional
            picture: string, user picture, optional
            inviteCode: string code for invite bonus, optional
            newPassword: string new password, optional. Requires password authentication!
            password: string pasword, required for authenticating sensitive changes
            topPostsEmailFrequency: integer days between top posts emails, optional
            activityEmailFrequency: integer days between activity emails, optional
            verificationCode: string account verification code, optional
        Returns: {user: {id: %s, displayname: %s, name: %s, email: %s, phone: %s}}
        Errors: 400, 403, 404
            400: Unable to decode json
            403: Card error: <error>
            404: User with specified userId not found
        Flows:
            User joins
    '''
    try:
        user = User.objects(id=userid).get()
    except:
        return 'User with the specified userId not found', 404

    if request.method == 'GET':
        # Recalculate whether this user's account has expired
        if user.next_billing:
            if datetime.datetime.utcnow().date() > datetime.date(*[int(x) for x in user.next_billing.split('-')]):
                if user.canceled_subscription:
                    user.update(set__expired=True)
                    user.reload()

        return jsonify_data(user)
    elif request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except ValueError:
            return 'Unable to decode json', 400


        if data.get('canceledSubscription'):
            user.update(set__canceled_subscription=True)

        elif 'canceledSubscription' in data:
            user.update(set__canceled_subscription=False)

        email = data.get('email')
        if email:
            user.update(set__email=email.lower())

        checklist = data.get('checklist')
        if checklist:
            if checklist in user.checklist:
                user.checklist.remove(checklist)
                user.save()

        follow = data.get('follow')
        if follow:
            if follow not in user.following:
                user.following.append(follow)
                user.save()

        unfollow = data.get('unfollow')
        if unfollow:
            if unfollow in user.following:
                user.following.remove(unfollow)
                user.save()

        new_password = data.get('newPassword')
        if new_password:
            user.update(set__password_hash=sha256_crypt.encrypt(new_password))

        name = data.get('name')
        if name:
            user.update(set__name=name)

        bio = data.get('bio')
        if bio:
            user.update(set__bio=bio)

        location = data.get('location')
        if location:
            user.update(set__location=location)

        picture = data.get('picture')
        if picture:
            user.update(set__picture=picture)
            _, header, picture_bytes = re.split('(^.+?base64,)', picture)
            instream = cStringIO.StringIO(base64.decodestring(picture_bytes))

            image = PIL.Image.open(instream)
            image.thumbnail((64, 64), PIL.Image.ANTIALIAS)

            outstream = cStringIO.StringIO()
            image.save(outstream, "JPEG")
            outstr = header + base64.b64encode(outstream.getvalue())
            user.update(set__thumbnail=outstr)

        if bio or location or picture:
            if user.bio and user.location and user.picture:
                if 'profile' in user.checklist:
                    user.checklist.remove('profile')
                    user.save()

        activity_email_frequency = data.get('activityEmailFrequency')
        if activity_email_frequency:
            user.update(set__activity_email_frequency=activity_email_frequency)
            next_email = datetime.date.today() + datetime.timedelta(days=activity_email_frequency)
            user.update(set__next_activity_email=str(next_email))

        top_posts_email_frequency = data.get('topPostsEmailFrequency')
        if top_posts_email_frequency:
            user.update(set__top_posts_email_frequency=top_posts_email_frequency)
            next_email = datetime.date.today() + datetime.timedelta(days=top_posts_email_frequency)
            user.update(set__next_top_posts_email=str(next_email))

        invite_code = data.get('inviteCode')
        if invite_code and not user.inviteid:
            invite = Invite.objects(code__iexact=invite_code, accepted__ne=True).first()
            if invite:
                invite.update(set__inviteeid=str(user.id))
                invite.update(set__accepted=True)
                invite.update(set__accept_time=time.time() * 1000)
                user.update(set__inviteid=str(invite.id))

        return jsonify_data(user.reload())


@app.route('/api/posts', methods=['GET', 'POST'])
def all_posts():
    '''
    GET
        Purpose: Returns posts, filtered by parameters.
        Parameters: posterId, posterName
            posterId: userId of user that created the post, optional
            posterName: name of user that created the post, optional
        Data: None
        Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: None
        Examples:
            GET /posts
                Purpose: Return all posts
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
            GET /posts?posterId=541e81e3691fa40002c9e9ef
                Purpose: Return all posts created by the specified user
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
    POST
        Purpose: Create a new post with the specified data.
        Parameters: None
        Data: posterId, html, topParentId, parents
            posterId: userId of user creating this post, required
            html: html body of this post, required
            topParentId: postId of the top level post which this post is under, optional; default = this post's id
            parents: list of postIds of parents of this post, optional; default = []
            nnonymous: 1 if post should be anonymized, else 0
        Returns: {'post': {'id': %s, 'posterId': %s, 'topParentId': '%s', 'date': %f,
                            'text': %s, 'html': %s, 'summary': %s,
                            'inappropriate': %d, parents = [%s, ...]}}
        Errors: 400, 403, 404
            400: Unable to decode json
            400: Did not provide required data: posterId, html
            404: Unable to find poster with the specified userId
        Examples:
            POST /posts, {'posterId': '541e81e3691fa40002c9e9ef', 'html': '<p>A very short post.</p>', 'parents': []}
                Purpose: Create a post by the specified poster with very minimal content.
                Returns: {'post': {'id': '1234567890abcedef123456', 'inappropriate': 0, 'deleted': 0, 'posterName': 'Example User',
                            'topParentId': '1234567890abcedef123456', 'posterId': '541e81e3691fa40002c9e9ef',
                            'html': '<p>A very short post.</p>', 'summary': 'A very short post.',
                            'text': 'A very short post.', 'parents': [], 'time': 1492}
            POST /posts, {'posterId': '541e81e3691fa40002c9e9ef', 'topParentId': '1234567890abcedef123456',
                            'text': '<p>A very short response.</p>', 'parents': ['1234567890abcedef123456']}
                Purpose: Create a post by the specified poster with very minimal text, in response to an earlier post.
                Returns: {'post': {'id': 'abcdef1234567890abcedef', 'posterId': '541e81e3691fa40002c9e9ef',
                            'inappropriate': 0, 'topParentId': '1234567890abcedef123456', 'deleted': 0, 'posterName': 'Example User',
                            'html': '<p>A very short response.</p>', 'summary': 'A very short response.',
                            'text': 'A very short response.', 'parents': ['1234567890abcedef123456'], 'time': 1492}
        Flows:
            User replies
            User posts
    '''
    if request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400

        if not ('posterId' in data and 'html' in data):
            return 'Did not provide required data: posterId, html', 400

        html = data['html']
        posterid = data['posterId']

        try:
            poster = User.objects(id=posterid).get()
        except:
            return 'Unable to find poster with the specified userId', 404

        try:
            anonymous = bool(data.get('anonymous', False))

            format_dict = scrape_handler.format_links(html)
            html = format_dict['html']
            edit_html = format_dict['edit_html']
            anonymized_html = format_dict['anonymized_html']
            text = format_dict['text']
            summary = format_dict['summary']
            anonymized_summary = format_dict['anonymized_summary']
            videos = format_dict['videos']
            opengraph = format_dict['opengraph']
            image = format_dict['image']

            post = Post(
                time=time.time() * 1000,
                posterid=posterid,
                html=html,
                edit_html=edit_html,
                anonymized_html=anonymized_html,
                text=text,
                summary=summary,
                anonymized_summary=anonymized_summary,
                anonymous=anonymous,
                videos=videos,
                opengraph=opengraph,
                parents=data.get('parents', []),
                image=image,
            ).save()
            post.update(set__top_parentid=data.get('topParentId', str(post.id)))
            post.reload()
            post.update(set__pseudonym='Anonymous ' + Pseudonyms.new(posterid, post.top_parentid))
            post.reload()

            if post.image and post.top_parentid and post.top_parentid != str(post.id):
                tlp = Post.objects(id=post.top_parentid).get()
                if not tlp.image:
                    tlp.update(set__image=post.image)

            for targetid in format_dict['mentions']:
                Mention(
                    posterid=posterid,
                    targetid=targetid,
                    time=time.time() * 1000,
                    postid=str(post.id)
                ).save()
                Notification(
                    userid=targetid,
                    objectid=str(post.id),
                    object_type='post',
                    time=time.time() * 1000,
                    active=True,
                    picture=poster.thumbnail,
                    summary="%s mentioned you in a post." % poster.name,
                    text="%s mentioned you in the post, \"%s\"" % (poster.name, post.summary),
                    thumbnail=poster.thumbnail,
                    triggers_digest=True,
                ).save()

            if 'post' in poster.checklist and Post.objects(posterid=posterid, parents=[]).count() == 1:
                poster.checklist.remove('post')
                poster.save()
            elif 'reply' in poster.checklist and Post.objects(posterid=posterid, parents__ne=[]).count() == 1:
                poster.checklist.remove('reply')
                poster.save()

            # Send notifications
            notification_recipients = {}
            for p in Post.objects(top_parentid=post.top_parentid, deleted__ne=True).order_by('time'):
                if p.posterid not in notification_recipients and p.posterid != post.posterid:
                    notification_recipients[p.posterid] = p

            if post.parents and post.parents[0]:
                direct_parentid = Post.objects(id=post.parents[0]).get().posterid
            else:
                direct_parentid = None

            for posterid in notification_recipients.keys():
                p = notification_recipients[posterid]
                if p.parents:
                    post_type = 'comment'
                else:
                    post_type = 'post'

                if posterid == direct_parentid:
                    summary = '%s replied to your %s.' % (poster.name, post_type)
                    text = '%s replied to your %s, \"%s\".' % (poster.name, post_type, p.summary)
                else:
                    summary = '%s responded to you.' % poster.name
                    text = "%s contributed to the conversation beneath your post, \"%s\"." % (poster.name, p.summary)

                Notification(
                    userid=posterid,
                    objectid=str(post.id),
                    object_type='post',
                    time=time.time() * 1000,
                    active=True,
                    thumbnail=poster.thumbnail,
                    summary=summary,
                    text=text,
                    triggers_digest=True,
                ).save()

            for follower in User.objects(following__contains=str(poster.id)):
                summary = "%s posted." % poster.name
                tlp = Post.objects(id=post.top_parentid).get()
                text = "%s, who you're following, posted in the conversation \"%s\"." % (poster.name, tlp.summary)
                Notification(
                    userid=str(follower.id),
                    objectid=str(post.id),
                    object_type='post',
                    time=time.time() * 1000,
                    active=True,
                    thumbnail=poster.thumbnail,
                    summary=summary,
                    text=text,
                    triggers_digest=True,
                ).save()

            return jsonify_data(post)
        except Exception, e:
            return "Error while posting", 500

    elif request.method == 'GET':
        if 'searchQuery' in request.args:
            query = request.args.get('searchQuery')
            quoted_strings = re.findall(r"[\'\"].+?[\'\"]", query)
            query = re.sub(r"[\'\"].+?[\'\"]", "", query)
            words = query.split()
            text_query = Q(deleted__ne=True)
            name_query = Q()
            for word in words:
                text_query = text_query & Q(text__icontains=word)
                name_query = name_query | Q(name__icontains=word)
            for quoted_string in quoted_strings:
                text_query = text_query & Q(text__icontains=quoted_string[1:-1])
                name_query = name_query | Q(name__icontains=quoted_string[1:-1])
            posts = list(Post.objects(text_query))
            users = User.objects(name_query)
            for user in users:
                posts += list(Post.objects(deleted__ne=True, posterid=str(user.id)))
            posts = sorted(posts, key=lambda x: x.time, reverse=True)
            return jsonify_data(posts[:50])
        elif 'posterId' in request.args:
            return jsonify_data(Post.objects(posterid=request.args.get('posterId'), deleted__ne=True))
        elif 'posterName' in request.args:
            poster = User.objects(name=request.args.get('posterName')).get()
            return jsonify_data(Post.objects(posterid=str(poster.id), deleted__ne=True))
        return jsonify_data(Post.objects(deleted__ne=True))


@app.route('/api/posts/<postid>', methods=['GET', 'POST'])
def individual_post(postid):
    '''
    GET
        Purpose: Returns a post specified by id
        Parameters: None
        Data: None
        Returns: {'post': {'id': %s, 'posterId': %s, 'time': %f, 'html': %s, 'text': %s, 'posterName': %s, 'numChildren': %d,
                           'topParentId': %s, 'parents': [%s, ...], 'summary': %s, 'inappropriate': %d, 'deleted': %d}}
        Errors: 404
            404: The post with the specified id could not be found.
        Examples:
            GET /posts/1234567890abcedef1234567
                Purpose: Return the specified post
                Returns: {'post': {'id': '1234567890abcedef1234567', 'posterId': '541e81e3691fa40002c9e9ef',
                           'topParentId': '1234567890abcedef1234567', 'time': 1492, 'numChildren': 0,
                           'html': '<p>A very short post</p>', 'text': 'A very short post', 'posterName': 'Example User',
                           'summary': 'A very short post', 'deleted': 0, 'inappropriate': 0}}
        Flows:
            User follows link
    POST
        Purpose: Update the specified post.
        Parameters: None
        Data: posterId, html, deleted
            posterId: string id of poster, required
            html: html body of this post, optional
            deleted: 1 if deleted else 0, optional
        Returns: {'post': {'id': %s, 'posterId': %s, 'time': %f, 'html': %s, 'text': %s, 'posterName': %s, 'numChildren': %d,
                           'topParentId': %s, 'parents': [%s, ...], 'summary': %s, 'inappropriate': %d, 'deleted': %d}}
        Errors: 400, 403, 404
            400: Unable to decode json
            400: Did not include required data key, posterId
            403: Cannot edit/delete a post that has replies
            404: The post with the specified id could not be found.
        Examples:
            POST /posts/1234567890abcedef1234567, {'html': '<p>A slightly longer post</p>'}
                Purpose: Update the specified post
                Returns: {'post': {'id': '1234567890abcedef1234567', 'posterId': '541e81e3691fa40002c9e9ef',
                           'topParentId': '1234567890abcedef1234567', 'time': 1492, 'numChildren': 0,
                           'html': '<p>A slightly longer post</p>', 'text': 'A slightly longer post',
                           'summary': 'A slightly longer post', 'deleted': 0, 'inappropriate': 0, 'posterName': 'Example User'}}
        Flows:
            User edits
    '''

    try:
        post = Post.objects(id=postid, deleted__ne=True).get()
    except:
        return 'The post with the specified id could not be found.', 404
    if request.method == 'GET':
        return jsonify_data(post)
    elif request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400

        if not data.pop('posterId'):
            return 'Did not include required data key, posterId', 400

        if Post.objects(parents=postid).count():
            return 'Cannot edit/delete a post that has replies', 403

        if 'deleted' in data:
            post.update(set__deleted=True)

        if 'html' in data:
            format_dict = scrape_handler.format_links(data['html'])
            html = format_dict['html']
            text = format_dict['text']
            summary = format_dict['summary']
            videos = format_dict['videos']
            opengraph = format_dict['opengraph']
            image = format_dict['image']

            post.html = html
            post.text = text
            post.summary = summary
            post.videos = videos
            post.opengraph = opengraph
            post.image = image
            post.save()

            if post.image and post.top_parentid != str(post.id):
                tlp = Post.objects(id=post.top_parentid).get()
                if not tlp.image:
                    tlp.update(set__image=post.image)

        return jsonify_data(post)


@app.route('/api/users/<userid>/posts', methods=['GET'])
def posts_by_user(userid):
    '''
    GET
        Purpose: Returns all posts created by a particular user
        Parameters: None
        Data: None
        Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET users/541e81e3691fa40002c9e9ef/posts
                Purpose: Return all posts created by the specified user
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Flows: None
    '''
    try:
        user = User.objects(id=userid).get()
    except:
        return 'The user with the specified id could not be found.', 404

    posts = Post.objects(posterid=userid, deleted__ne=True).order_by('-time')
    json_list = []
    for post in posts:
        obj = post.to_json()
        obj['posterName'] = user.name
        obj['posterId'] = userid
        json_list.append(obj)
    return jsonify(posts=json_list)


@app.route('/api/users/<userid>/featured', methods=['GET'])
def featured_posts(userid):
    '''
    GET
        Purpose: Returns posts featured for a given user.
        Parameters: None
        Data: None
        Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET users/541e81e3691fa40002c9e9ef/featured
                Purpose: Returns posts featured for a given user.
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
    '''
    if Post.objects(featured=True).count() == 0 and Post.objects.count():
        Post.objects.first().update(set__featured=True)
    return jsonify_data(Post.objects(featured=True, deleted__ne=True).order_by('-xkcd_score'))


@app.route('/api/samplePosts', methods=['GET'])
def sample_posts():
    '''
    GET
        Purpose: Returns sample posts for a visitor.
        Parameters: None
        Data: None
        Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: None
        Examples:
            GET /samplePosts
                Purpose: Returns sample posts.
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
    '''
    if Post.objects(featured=True).count() == 0 and Post.objects.count():
        Post.objects.first().update(set__featured=True)
    data = []
    for post in Post.objects(featured=True, deleted__ne=True).order_by('-xkcd_score'):
        data.append({
            'id': str(post.id),
            'topParentId': post.top_parentid,
            'html': post.anonymized_html,
            'edit_html': post.edit_html,
            'summary': post.anonymized_summary,
            'numChildren': post.num_children,
            'time': post.time,
            'parents': post.parents,
            'image': post.image,
        })
    return jsonify(posts=data)


@app.route('/api/users/<userid>/latest', methods=['GET'])
def latest_posts(userid):
    '''
    GET
        Purpose: Returns latest posts targeted for a given user.
        Parameters: start, end
            start: index of the first post to return in this list, optional (default = 0)
            end: index of the first post to return in this list, optional (default = 50)
        Data: None
        Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET users/541e81e3691fa40002c9e9ef/latest
                Purpose: Returns latest posts for a given user.
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
    '''
    start = int(request.args.get('start', 0))
    end = int(request.args.get('end', 50))
    return jsonify_data(Post.objects(parents=[], deleted__ne=True).order_by('-time').skip(start).limit(end - start))


@app.route('/api/tips', methods=['POST'])
def tips():
    '''
    POST
        Purpose: Create a new tip with the specified data.
        Parameters: None
        Data: userId, postId
            userId: userId of user tipping, required
            postId: postId of post being tipped, required
        Returns: {'tip': {'id': %s, 'userId': %s, 'postId': %s}}
        Errors: 400, 403, 404, 409
            400: Unable to decode json
            400: Did not provide required data: userId, postId
            404: Unable to find user with the specified userId
            404: Unable to find post with the specified postId
            409: That user has already tipped that post
            409: Users cannot tip their own posts
        Examples:
            POST /tips, {'userId': '541e81e3691fa40002c9e9ef', 'postId': '1234567890abcedef123456'}
                Purpose: The specified user tips the specified post.
                Returns: {'tip': {'id': '1234567890abcedef123456', 'userId': '541e81e3691fa40002c9e9ef',
                                   'postId': '1234567890abcedef123456'}
        Flows:
            User tips
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400

    if not ('userId' in data and 'postId' in data):
        return 'Did not provide required data: userId, postId', 400

    userid = data['userId']
    postid = data['postId']

    try:
        tipper = User.objects(id=userid).get()
    except:
        return 'Unable to find user with the specified userId', 404

    try:
        post = Post.objects(id=postid, deleted__ne=True).get()
    except:
        return 'Unable to find post with the specified postId', 404

    if Tip.objects(userid=userid, postid=postid).first():
        return 'That user has already tipped that post', 409

    if str(userid) == str(post.posterid):
        return 'Users cannot tip their own posts', 409

    tip = Tip(
        time=time.time() * 1000,
        userid=userid,
        postid=postid,
    ).save()

    Notification(
        userid=post.posterid,
        objectid=str(tip.id),
        object_type='tip',
        time=time.time() * 1000,
        active=True,
        thumbnail=tipper.thumbnail,
        summary='%s hearted your post.' % tipper.name,
        text='%s hearted your post, \"%s\".' % (tipper.name, post.summary),
        triggers_digest=True,
    ).save()

    return jsonify_data(tip)


@app.route('/api/interactions', methods=['POST'])
def interactions():
    '''
    POST
        Purpose: Create a new interaction, return it
        Parameters: None
        Data: userId, postId, reply, tip, view, flag, facebook, twitter
            userId: string, id of user, optional; default = None
            postId: string, id of post, optional; default =  None
            reply: 1 if user replied, optional; default = 0
            tip: 1 if user tipped, optional; default = 0
            view: 1 if user viewed, optional; default = 0
            exit: 1 if user exited, optional; default = 0
            scrolledIn: 1 if this post was scrolled into view, optional; default = 0
            scrolledOut: 1 if this post was scrolled out of view, optional; default = 0
            flag: 1 if user flagged, optional; default = 0
            facebook: 1 if user shared on facebook, optional; default = 0
            twitter: 1 if user shared on twitter, optional; default = 0
        Returns: {interaction: {id: %s, userId: %s, postId: %s, datakey1: %f, datakey2: %s, ...}}
        Errors: 400
            400: Unable to decode json
            400: Didn't understand data key: "<key>"
        Examples:
            POST /interactions, data={'userId': '541e81e3691fa40002c9e9ef', 'postId': 'a40002c9e9efa40002c9e9ef',
                                      'reply': '1', 'readingTime': '2474'}
                Purpose: Create a new interaction between the specified user and post
                Returns: {'interaction': {'id': '541e81e3691f541e81e3691f', 'userId': '541e81e3691fa40002c9e9ef',
                          'postId': 'a40002c9e9efa40002c9e9ef', 'reply': '1', 'readingTime': '2474'}}
        Flows:
            User returns
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except ValueError:
        return 'Unable to decode json', 400

    userid = data.pop('userId', None)
    postid = data.pop('postId', None)
    for key in data:
        if key not in [
                'reply', 'tip', 'view', 'exit', 'scrolledIn', 'scrolledOut',
                'flag', 'facebook', 'twitter', 'referrer', 'suggest'
                ]:
            return 'Didn\'t understand data key: "%s"' % key, 400
    add_request_data(data, request)

    interaction = Interaction(userid=userid, postid=postid, time=time.time() * 1000).save()

    for key in data:
        if hasattr(interaction, key):
            setattr(interaction, key, data[key])
            interaction.save()

    return jsonify_data(interaction)


@app.route('/api/visitorInteractions', methods=['POST'])
def visitor_interactions():
    '''
    post
        purpose: create a new interaction for a visitor, return it
        parameters: none
        data: reply, tip, view, exit, scrolledin, scrolledout, flag, facebook, twitter, signupdata
            reply: 1 if user replied, optional; default = 0
            tip: 1 if user tipped, optional; default = 0
            view: 1 if user viewed, optional; default = 0
            exit: 1 if user exited, optional; default = 0
            scrolledin: 1 if this post was scrolled into view, optional; default = 0
            scrolledout: 1 if this post was scrolled out of view, optional; default = 0
            flag: 1 if user flagged, optional; default = 0
            facebook: 1 if user shared on facebook, optional; default = 0
            twitter: 1 if user shared on twitter, optional; default = 0
            referrer: string referrer website, optional; default = none
            signupdata: dict containing information based on signup, optional; default = {}
        returns: {interaction: {id: %s, userid: %s, postid: %s, datakey1: %f, datakey2: %s, ...}}
        errors: 400
            400: unable to decode json
            400: didn't understand data key: "<key>"
        examples:
            post /interactions, data={'signupdata': {'email': 'jon@con.bon', 'name': 'conbon'}}
                purpose: create a new interaction between the specified user and post
                returns: {'interaction': {'id': '541e81e3691f541e81e3691f',
                              'signupdata': {'email': 'jon@con.bon', 'name': 'conbon'}}
        flows:
            user returns
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except valueerror:
        return 'unable to decode json', 400

    postid = data.pop('postid')

    for key in data:
        if key not in ['reply', 'tip', 'view', 'exit', 'scrolledin', 'signupdata',
                       'scrolledout', 'flag', 'facebook', 'twitter', 'referrer']:
            return 'didn\'t understand data key: "%s"' % key, 400
    add_request_data(data, request)

    interaction = interaction(postid=postid, time=time.time() * 1000).save()

    for key in data:
        if hasattr(interaction, key):
            setattr(interaction, key, data[key])
            interaction.save()

    return jsonify_data(interaction)


@app.route('/api/interactions/<interactionid>', methods=['get', 'post'])
def specific_interaction(interactionid):
    '''
    GET
        Purpose: Return a specific interaction
        Parameters: None
        Data: None
        Returns: {interaction: {id: %s, postId: %s, postId: %s, datakey1: %f, datakey2: %s, ...}}
        Errors: 404
            404: Specified interaction not found
        Examples:
            GET /interactions/541e81e3691f541e81e3691f
                Purpose: Get the specified interaction
                Returns: {'interaction': {'id': '541e81e3691f541e81e3691f', 'userId': '541e81e3691fa40002c9e9ef',
                          'postId': 'a40002c9e9efa40002c9e9ef', 'reply': '1', 'readingTime': '2474'}}
        Flows: None
    POST
        Purpose: Update a specific interaction and return it
        Parameters: None
        Data: userId, reply, tip, view, flag, facebook, twitter
            userId, string userid, required
            reply: 1 if user replied, optional; default = 0
            tip: 1 if user tipped, optional; default = 0
            view: 1 if user viewed, optional; default = 0
            exit: 1 if user exited, optional; default = 0
            scrolledIn: 1 if this post was scrolled into view, optional; default = 0
            scrolledOut: 1 if this post was scrolled out of view, optional; default = 0
            flag: 1 if user flagged, optional; default = 0
            facebook: 1 if user shared on facebook, optional; default = 0
            twitter: 1 if user shared on twitter, optional; default = 0
        Returns: {interaction: {id: %s, userId: %s, postId: %s, datakey1: %f, datakey2: %s, ...}}
        Errors: 400, 404
            400: Unable to decode json
            400: Did not include required data key, userId
            400: Didn't understand data key: "<key>"
            404: Specified interaction not found
        Examples:
            POST /interactions/541e81e3691f541e81e3691f, data={'tip': '1'}
                Purpose: Update the specified interaction (which already has a reply and readingTime)
                Returns: {'interaction': {'id': '541e81e3691f541e81e3691f', 'userId': '541e81e3691fa40002c9e9ef',
                          'postId': 'a40002c9e9efa40002c9e9ef', 'reply': '1', 'readingTime': '2474', 'tip', '1'}}
        Flows:
            User replies
            User tips

    '''
    try:
        interaction = Interaction.objects(id=interactionid).get()
    except:
        return 'Interaction with the specified id not found', 404
    # If we are getting interactions
    if request.method == 'GET':
        return jsonify_data(interaction)

    elif request.method in ['POST']:
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400

        if not data.pop('userId'):
            return 'Did not include required data parameter, userId', 400

        add_request_data(data, request)

        for key in data:
            try:
                data[key] = float(data[key])
            except:
                pass
            if hasattr(interaction, key):
                if type(getattr(interaction, key)) in [int, float] and type(data[key]) in [int, float]:
                    setattr(interaction, key, getattr(interaction, key) + data[key])
                else:
                    setattr(interaction, key, data[key])
            else:
                return 'Didn\'t understand data key: "%s"' % key, 400
            interaction.save()

        return jsonify_data(interaction)


@app.route('/api/users/<userid>/interactions', methods=['GET'])
def user_interactions(userid):
    '''
    GET
        Purpose: Return the interactions for this user, optionally filtered by parameters
        Parameters: postId
            postId: postId that the user has interacted with, optional
        Data: None
        Returns: {interactions: [{id: %s, ...}, {id: %s, ...}, ...]}
                 {interaction: {id: %s, ...}}
        Errors: 404
            404: Specified user not found
            404: Specified post not found
        Examples:
            GET users/541e81e3691fa40002c9e9ef/interactions
                Purpose: Get the interactions of the specified user
                Returns: {'interactions': [{'id': ...}, {'id': ...}, ...]}
            GET users/541e81e3691fa40002c9e9ef/interactions?postId=a40002c9e9efa40002c9e9ef
                Purpose: Get the interaction between the specified user and the specified post
                Returns: {'interaction': {'id': '541e81e3691f541e81e3691f', 'userId': '541e81e3691fa40002c9e9ef',
                          'postId': 'a40002c9e9efa40002c9e9ef', 'reply': '1', 'readingTime': '2474'}
        Flows: None
    '''
    if not User.objects(id=userid).count():
        return 'Specified user not found', 404
    postid = request.args.get('postId')
    if postid:
        if not Post.objects(id=postid, deleted__ne=True).count():
            return 'Specified post not found', 404
        interactions = Interaction.objects(userid=userid, postid=postid)
        return jsonify_data(interactions)
    else:
        interactions = Interaction.objects(userid=userid)
        return jsonify_data(interactions)


@app.route('/api/posts/<postid>/interactions', methods=['GET'])
def post_interactions(postid):
    '''
    GET
        Purpose: Return the interactions for this post, filtered by parameters
        Parameters: userId
            userId: userId of a user that has interacted with the post
        Data: None
        Returns: {interactions: [{id: %s, ...}, {id: %s, ...}, ...]}
        Errors: 404
            404: Specified user not found
            404: Specified post not found
        Examples:
            GET posts/a40002c9e9efa40002c9e9ef/interactions
                Purpose: Get the interactions of the specified post
                Returns: {'interactions': [{'id': ...}, {'id': ...}, ...]}
            GET posts/a40002c9e9efa40002c9e9ef/interactions?userId=541e81e3691fa40002c9e9ef
                Purpose: Get the interaction between the specified user and the specified post
                Returns: {'interactions: [{'id': '541e81e3691f541e81e3691f', 'userId': '541e81e3691fa40002c9e9ef',
                          'postId': 'a40002c9e9efa40002c9e9ef', 'reply': '1', 'readingTime': '2474'}]}
        Flows: None
    '''
    if not Post.objects(id=postid, deleted__ne=True).count():
        return 'Specified post not found', 404
    userid = request.args.get('userId')
    if userid:
        if not User.objects(id=userid).count():
            return 'Specified user not found', 404
        interactions = Interaction.objects(userid=userid, postid=postid)
        return jsonify_data(interactions)
    else:
        interactions = Interaction.objects(postid=postid)
        return jsonify_data(interactions)


def recursive_get_children(post, max_depth, cur_depth=0, for_user=None):
    '''
    Helper method for /posts/PID/children and /posts/PID/preview
    Depth-first-search with depth limit. Returns jsonifiable dictionary of conversation.
    '''
    children = []
    if cur_depth < max_depth:
        # We would like to sort these children in xkcd order
        # But we currently don't have the requisite data.
        for p in Post.objects(parents=str(post.id), deleted__ne=True).order_by('-hn_score'):
            children.append(recursive_get_children(p, max_depth, cur_depth + 1, for_user))

    if for_user and Tip.objects(userid=for_user, postid=str(post.id)).first():
        tip = 1
    else:
        tip = 0

    epoch_date = datetime.datetime.utcfromtimestamp(0)
    two_weeks_ago = datetime.datetime.utcnow() - datetime.timedelta(days=14)
    two_weeks_ago_ms = (two_weeks_ago - epoch_date).total_seconds() * 1000
    two_weeks_old = post.time < two_weeks_ago_ms

    if post.anonymous or two_weeks_old:
        poster_name = post.pseudonym
        poster_picture = None
        posterid = None
    else:
        try:
            poster = User.objects(id=post.posterid).get()
            posterid = post.posterid
            poster_name = poster.name
            poster_picture = poster.thumbnail
        except:
            poster_name = ""
            posterid = post.posterid
            poster_picture = None

    draft = Draft.objects(parents__contains=str(post.id), posterid=for_user).order_by('-time').first()
    reply_draft = None
    if draft:
        reply_draft = draft.html

    data = {
        'id': str(post.id),
        'posterName': poster_name,
        'topParentId': post.top_parentid,
        'time': post.time,
        'parents': post.parents,
        'children': children,
        'replyDraft': reply_draft,
        'tip': tip,
        'anonymous': 1 if (post.anonymous and not two_weeks_old) else 0,
        'deleted': 1 if post.deleted else 0,
        'inappropriate': 1 if post.inappropriate else 0,
        'videos': post.videos,
        'opengraph': post.opengraph,
        'image': post.image,
    }

    if for_user and not post.anonymous and not two_weeks_old:
        data['posterId'] = posterid
        data['posterPicture'] = poster_picture
        data['html'] = post.html
        data['edit_html'] = post.edit_html
        data['summary'] = post.summary
    else:
        data['html'] = post.anonymized_html
        data['summary'] = post.anonymized_summary

    return data


@app.route('/api/posts/<postid>/preview', methods=['GET'])
def preview_post(postid):
    '''
    GET
        Purpose: Returns anonymized post specified by id
        Parameters: depth, forUser
            depth: integer level of nesting of posts; optional, default = 2
            forUser: user for which these posts are to be displayed; optional, default = None
        Data: None
        Returns: {'post': {'id': %s, 'time': %f, 'html': %s, 'text': %s, 'numChildren': %d,
                           'topParentId': %s, 'parents': [%s, ...], 'summary': %s, 'inappropriate': %d, 'deleted': %d}}
        Errors: 404
            404: The post with the specified id could not be found.
        Examples:
            GET /posts/1234567890abcedef1234567/preview
                Purpose: Return the specified post
                Returns: {'post': {'id': '1234567890abcedef1234567',
                           'topParentId': '1234567890abcedef1234567', 'time': 1492, 'numChildren': 0,
                           'html': '<p>A very short post</p>', 'text': 'A very short post',
                           'summary': 'A very short post', 'deleted': 0, 'inappropriate': 0}}
    '''
    try:
        post = Post.objects(id=postid, deleted__ne=True).get()
    except:
        return "The post with the specified id could not be found.", 404

    max_depth = int(request.args.get('depth', 4))
    for_user = request.args.get('forUser', None)
    if not for_user or not User.objects(id=for_user).first():
        for_user = None
    children = recursive_get_children(post, max_depth, for_user=for_user)

    return jsonify(posts=children)


@app.route('/api/posts/<postid>/children', methods=['GET'])
def children(postid):
    '''
    GET
        Purpose: Returns the conversation beginning with this post.
                Each child post also contains a list of children; that list is empty if the child post is at the maximum depth.
        Parameters: depth, forUser
            depth: integer level of nesting of posts; optional, default = 2
            forUser: user for which these posts are to be displayed; optional, default = None
        Data: None
        Returns: {'posts': [{'id': %s, 'children': [...], ...}, {'id': %s, 'children': [...], ...}]}
        Errors: 404
            404: The post with the specified id could not be found.
        Examples:
            GET posts/541e81e3691fa40002c9e9ef/children
                Purpose: Return all children of the specified post
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
            GET posts/541e81e3691fa40002c9e9ef/children?depth=1
                Purpose: Return all children of the specified post, with only one level of nesting
                Returns: {'posts': [{'id': %s, ...}, {'id': %s, ...}]}
        Flows:
            User returns
            User tips
            User replies
    '''

    try:
        post = Post.objects(id=postid, deleted__ne=True).get()
    except:
        return "The post with the specified id could not be found.", 404

    max_depth = int(request.args.get('depth', 2))
    for_user = request.args.get('forUser', None)
    if not User.objects(id=for_user).first():
        for_user = None
    children = recursive_get_children(post, max_depth, for_user=for_user)

    return jsonify(posts=children)


@app.route('/api/flags', methods=['GET', 'POST'])
def all_flags():
    '''
    GET
        Purpose: Returns flags, optionally filtered by parameters.
        Parameters: flaggerId
            flaggerId: userId of user that created the flag, optional
            postId: postId of the flagged post
        Data: None
        Returns: {'flags': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: None
        Examples:
            GET /flags
                Purpose: Return all flags
                Returns: {'flags': [{'id': %s, ...}, {'id': %s, ...}]}
            GET /flags?flaggerId=541e81e3691fa40002c9e9ef
                Purpose: Return all flags created by the specified user
                Returns: {'flags': [{'id': %s, ...}, {'id': %s, ...}]}
            GET /flags?postId=541e81e3691fa40002c9e9ef
                Purpose: Return list of flags on the post
                Returns: {'flags': [{'id': %s, ...}, {'id': %s, ...}]}
    POST
        Purpose: Create a new flag with the specified data.
        Parameters: None
        Data: flaggerId, postId, reason
            flaggerId: userId of user creating this flag, required
            postId: postId of the flagged post, required
            reason: string reason for the flag, required
        Returns: {'flag': {'id': %s, 'flaggerId': %s, 'postId': %s, 'reason': %s,
                           'confirmations': [%s, ...], 'rejections': [%s, ...]}}
        Errors: 400, 403, 404
            400: Unable to decode json
            400: Did not provide required data: flaggerId, postId, reason
            404: Unable to find flagger with the specified userId
            409: Data conflict! That user has already flagged that post.
        Examples:
            POST /flags, {'flaggerId': '541e81e3691fa40002c9e9ef', 'postId': '1234567890abcedef123456'}
                Purpose: Create a flag with specified flagger and post.
                Returns: {'flag': {'id': '1234567890abcedef123456', 'flaggerId': '541e81e3691fa40002c9e9ef',
                    'reason': 'Nopropro!', 'postId': '1234567890abcedef123456', 'confirmations': [], 'rejections': []}
        Flows:
            User flags
    '''
    if request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400

        if not ('flaggerId' in data and 'postId' in data and 'reason' in data):
            return 'Did not provide required data: flaggerId, postId, reason', 400

        flaggerid = data.get('flaggerId')
        postid = data.get('postId')
        reason = data.get('reason')

        if Flag.objects(flaggerid=flaggerid, postid=postid).first():
            return 'Data conflict! That user has already flagged that post.', 409

        try:
            flagger = User.objects(id=flaggerid).get()
        except:
            return 'Unable to find flagger with the specified userId', 404

        try:
            post = Post.objects(id=postid, deleted__ne=True).get()
        except:
            return 'Unable to find post with the specified postId', 404

        flag = Flag(
            time=time.time() * 1000,
            flaggerid=flaggerid,
            postid=postid,
            reason=reason,
            confirmations=[],
            rejections=[],
        ).save()

        Notification(
            userid=str(post.posterid),
            objectid=str(post.id),
            object_type='post',
            time=time.time() * 1000,
            active=True,
            summary='Your post has been flagged.',
            text='Your post, \"%s\", has been flagged with reason: \"%s\".' % (post.summary, flag.reason),
            triggers_digest=False,
        ).save()

        return jsonify_data(flag)

    elif request.method == 'GET':
        if 'flaggerId' in request.args:
            return jsonify_data(Flag.objects(flaggerid=request.args.get('flaggerId')))
        if 'postId' in request.args:
            return jsonify_data(Flag.objects(postid=request.args.get('postId')))
        return jsonify_data(Flag.objects)


@app.route('/api/flags/<flagid>', methods=['GET', 'POST'])
def individual_flag(flagid):
    '''
    GET
        Purpose: Returns a flag specified by id
        Parameters: None
        Data: None
        Returns: {'flag': {'id': %s, 'flaggerId': %s, 'postId': %s, 'confirmations': [%s, ...], 'rejections': [%s, ...]}}
        Errors: 404
            404: The flag with the specified id could not be found.
        Examples:
            GET /flags/1234567890abcedef1234567
                Purpose: Return the specified flag
                Returns: {'flag': {'id': '1234567890abcedef123456', 'flaggerId': '541e81e3691fa40002c9e9ef',
                    'postId': '1234567890abcedef123456', 'confirmations': [], 'rejections': []}
    POST
        Purpose: Update the specified flag.
        Parameters: None
        Data: flaggerId, postId, confirmations, rejections
            flaggerId: userId of user creating this flag, optional
            postId: postId of the flagged post, optional
            confirmations: integer number of confirmations to add to this flag, optional
            rejections: integer number of rejections to add to this flag, optional
        Returns: {'flag': {'id': %s, 'flaggerId': %s, 'postId': %s, 'confirmations': [%s, ...], 'rejections': [%s, ...]}}
        Errors: 400, 404
            400: Unable to decode json
            400: Cannot add confirmations and rejections simultaneously
            404: The flag with the specified id could not be found.
        Examples:
            POST /flags/1234567890abcedef1234567, {'confirmations': ['abcedef123456ffddeebb']}
                Purpose: Update the specified flag with a confirmation
                Returns: {'flag': {'id': '1234567890abcedef123456', 'flaggerId': '541e81e3691fa40002c9e9ef',
                    'postId': '1234567890abcedef123456', 'confirmations': ['abcedef123456ffddeebb'], 'rejections': []}
    '''
    try:
        flag = Flag.objects(id=flagid).get()
    except:
        return 'The flag with the specified id could not be found.', 404
    if request.method == 'GET':
        return jsonify_data(flag)
    elif request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400
        if data.get('confirmations') and data.get('rejections'):
            return 'Cannot add confirmations and rejections simultaneously', 400

        flag.time = time.time() * 1000
        confirmations = data.get('confirmations', [])
        if type(confirmations) == list:
            for moderatorid in confirmations:
                flag.confirmations.append(moderatorid)
        elif type(confirmations) == str:
            flag.confirmations.append(confirmations)
        rejections = data.get('rejections', [])

        if type(rejections) == list:
            for moderatorid in rejections:
                flag.rejections.append(moderatorid)
        elif type(rejections) == str:
            flag.rejections.append(rejections)
        flag.save()

        if len(flag.confirmations) > 1:
            try:
                post = Post.objects(id=flag.postid, deleted__ne=True).get()
                post.inappropriate = True
                post.save()
            except:
                print "Post not found!"

            Notification(
                userid=str(flag.flaggerid),
                objectid=str(flag.id),
                object_type='flag',
                time=time.time() * 1000,
                active=True,
                summary='Your flag was confirmed.',
                text='Your flag of post \"%s\" was confirmed.' % post.summary,
                triggers_digest=False,
            ).save()

        elif len(flag.rejections) > 1:
            Notification(
                userid=str(flag.flaggerid),
                objectid=str(flag.id),
                object_type='flag',
                time=time.time() * 1000,
                active=True,
                summary='Your flag was rejected.',
                text='Your flag of post \"%s\" was rejected.' % post.summary,
                triggers_digest=False,
            ).save()

        return jsonify_data(flag)


@app.route('/api/invites', methods=['POST'])
def invites():
    '''
    POST
        Purpose: Send a new invite
        Parameters: None
        Data: inviteeEmail, inviterId, text
            inviteeEmail: email to which the invite should be sent, required
            inviterId: userId for the user sending the invite, required
            text: text to lead off the invite message, required
        Returns: {'invite': {'id': %s, 'inviterId': %s, 'inviteeEmail': %s, 'sendTime': %f, 'accepted': %d, 'acceptTime': %f}}
        Errors: 400, 404
            400: Unable to decode json
            400: Did not provide required data: inviteeEmail, inviterId, text
            403: The inviter doesn't have any remaining invites to send.
            404: The user with the specified inviterId could not be found.
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400
    if 'inviteeEmail' not in data or 'inviterId' not in data or 'text' not in data:
        return 'Did not provide required data: inviteeEmail, inviterId, text', 400

    invitee_email = data['inviteeEmail']

    try:
        inviter = User.objects(id=data['inviterId']).get()
    except:
        return 'The user with the specified inviterId could not be found.', 404

    if not inviter.invites or inviter.invites < 1:
        return 'The inviter doesn\'t have any remaining invites to send.', 403

    code = generate_code(5)

    inviter.invites -= 1
    inviter.save()
    inviterid = str(inviter.id)

    invite = Invite(
        inviterid=inviterid,
        invitee_email=invitee_email,
        code=code,
        send_time=time.time() * 1000,
        accepted=False,
        followup_state='',
        next_followup=str(datetime.datetime.utcnow().date() + datetime.timedelta(days=3)),
    ).save()

    if 'invite' in inviter.checklist and Invite.objects(inviterid=inviterid).count() >= 1:
        inviter.checklist.remove('invite')
        inviter.save()

    return jsonify_data(invite)


@app.route('/api/invites/<inviteid>', methods=['GET'])
def individual_invite(inviteid):
    '''
    GET
        Purpose: Returns an invite specified by id.
        Parameters: None
        Data: None
        Returns: {'invite': {'id': %s, 'inviterId': %s, 'inviteeEmail': %s, 'sendTime': %f, 'accepted': %d, 'acceptTime': %f}}
        Errors: 404
            404: The invite with the specified id could not be found.
    '''
    try:
        invite = Invite.objects(id=inviteid).get()
    except:
        return 'The invite with the specified id could not be found.', 404
    return jsonify_data(invite)


@app.route('/api/suggestions', methods=['POST'])
def suggestions():
    '''
    POST
        Purpose: Send a new suggestion
        Parameters: None
        Data: userId, postId, targetEmail, targetName, text
            userId: user doing the suggesting, required
            postId: post to be suggested, required
            text: text to lead off the suggestion message, optional
            targetEmail: email of person to whom suggestion should be sent, optional*
            targetName: name of user to whom suggestion should be sent, optional*
            *NOTE: either targetName or targetEmail is required
        Returns: {'suggestion': {'id': %s, 'userId': %s, 'postId': %s, 'text': %s, 'targetEmail': %s, 'targetName': %s}}
        Errors: 400, 404, 409
            400: Unable to decode json
            400: Did not provide required data: userId, postId
            400: Did not provide either targetEmail OR targetName data keys
            404: The user with the specified userId could not be found.
            404: No user with the specified targetName could be found
            409: More than one user with the specified targetName could be found
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400
    if 'userId' not in data or 'postId' not in data:
        return 'Did not provide required data: userId, postId', 400
    if 'targetEmail' not in data and 'targetName' not in data:
        return 'Did not provide either targetEmail OR targetName data keys', 400

    try:
        suggester = User.objects(id=data['userId']).get()
    except:
        return 'The user with the specified userId could not be found.', 404
    try:
        post = Post.objects(id=data['postId']).get()
    except:
        return 'The post with the specified postId could not be found.', 404

    userid = data['userId']
    postid = data['postId']
    html = "<br/>".join([
        ' '.join([
            "<html><body>%s has suggested <a href='/posts/%s'" % (suggester.name, postid),
            "target = '_blank'>this conversation</a> for you!"
        ]),
        '',
        '</body></html>',

    ])

    if 'targetEmail' in data:
        target_email = data['targetEmail']
        suggestion = Suggestion(
            userid=userid,
            postid=postid,
            target_email=target_email,
            targetid=None,
            time=time.time() * 1000,
        ).save()

    else:
        target_name = data['targetName']
        targets = User.objects(name=target_name)
        if targets.count() < 1:
            return "No user with the specified targetName could be found", 404
        if targets.count() > 1:
            return "More than one user with the specified targetName could be found", 409
        target = targets.get()
        suggestion = Suggestion(
            userid=userid,
            postid=postid,
            target_email=None,
            targetid=str(target.id),
            time=time.time() * 1000,
        ).save()
        Notification(
            userid=str(target.id),
            objectid=postid,
            object_type='post',
            time=time.time() * 1000,
            active=True,
            thumbnail=suggester.thumbnail,
            summary='%s suggested a post for you.' % suggester.name,
            text='%s suggested you contribute to the post, "%s"' % (suggester.name, post.summary),
            triggers_digest=False,
        ).save()

    return jsonify_data(suggestion)


@app.route('/api/users/<userid>/invites', methods=['GET'])
def user_invites(userid):
    '''
    GET
        Purpose: Returns list of invites sent by this user
        Parameters: None
        Data: None
        Returns: {'invites': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET /users/1234567890abcedef1234567/invites
                Purpose: Return the invites sent by this user
                Returns: {'invites': [{'id': %s, ...}, {'id': %s, ...}]}
    '''
    try:
        inviter = User.objects(id=userid).get()
    except:
        return 'The user with the specified id could not be found.', 404
    return jsonify_data(Invite.objects(inviterid=userid))


@app.route('/api/users/<userid>/friends', methods=['GET'])
def user_friends(userid):
    '''
    GET
        Purpose: Returns list of names of friends of this user
        Parameters: None
        Data: None
        Returns: {'friends': [%s, %s, %s]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET /users/1234567890abcedef1234567/friends
                Purpose: Return the list of names of friends of this user
                Returns: {'friends': [%s, %s, %s]}
    '''
    try:
        user = User.objects(id=userid).get()
    except:
        return 'The user with the specified id could not be found.', 404

    if not user.friends:
        recommendations.find_friend_userids(user)
        user.reload()

    names = []
    for friendid in user.friends:
        if friendid:
            friend = User.objects(id=friendid).first()
            if friend:
                names.append(friend.name)
    if not names:
        names = ['Example User']

    return jsonify(friends=names)


@app.route('/api/users/<userid>/profile', methods=['GET'])
def user_profile(userid):
    '''
    GET
        Purpose: Returns profile page data for this user
        Parameters: for_user
            for_user: User viewing the profile
        Data: None
        Returns: {'profile': {'name': %s, 'bio': %s, 'location': %s, 'picture': %s}}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET /users/1234567890abcedef1234567/profile
                Purpose: Returns profile page data for this user
                Returns: {'profile': {'name': %s, 'bio': %s, 'location': %s, 'picture': %s}}
    '''
    try:
        user = User.objects(id=userid).get()
    except:
        return 'The user with the specified id could not be found.', 404

    for_userid = request.args.get('for_user')
    if for_userid:
        try:
            for_user = User.objects(id=for_userid).get()
        except:
            pass

    following = (for_user and userid in for_user.following)

    return jsonify(profile={
        'name': user.name,
        'bio': user.bio,
        'location': user.location,
        'picture': user.picture,
        'following': following,
    })


@app.route('/api/users/<userid>/activity', methods=['GET'])
def activity(userid):
    '''
    GET
        Purpose: Returns notifications and post history for a user.
        Parameters: start, end
            start: index of the first notification/post to return in this list, optional (default = 0)
            end: index of the first notification/post to return in this list, optional (default = 50)
        Data: None
        Returns: {'activity': [{'objectType': 'notification', ...}, {'objectId': %s, ...}]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET users/541e81e3691fa40002c9e9ef/activity
                Purpose: Returns notifications and post history for a user.
                Returns: {'activity': [{'objectType': 'notification', ...}, {'objectId': %s, ...}]}
    '''
    try:
        user = User.objects(id=userid).get()
    except:
        return 'The user with the specified id could not be found.', 404

    start = int(request.args.get('start', 0))
    end = int(request.args.get('end', 10))

    notifications = list(Notification.objects(userid=userid).order_by('-time'))
    notification_objects = generate_notification_objects(notifications)
    posts = list(Post.objects(posterid=userid, deleted__ne=True).order_by('-time'))
    post_objects = [post.to_json() for post in posts]
    activity_objects = []

    while len(activity_objects) < end and notification_objects and post_objects:
        if notification_objects[0]['time'] > post_objects[0]['time']:
            obj = notification_objects.pop(0)
            obj['activityType'] = 'notification'
        else:
            obj = post_objects.pop(0)
            obj['posterId'] = userid
            obj['posterName'] = user.name
            obj['activityType'] = 'post'
        activity_objects.append(obj)

    if len(activity_objects) < end:
        for obj in notification_objects:
            obj['activityType'] = 'notification'
            activity_objects.append(obj)
        for obj in post_objects:
            obj['activityType'] = 'post'
            obj['posterId'] = userid
            obj['posterName'] = user.name
            activity_objects.append(obj)

    return jsonify(activity=activity_objects[start:end])


@app.route('/api/users/<userid>/alerts', methods=['GET'])
def user_alerts(userid):
    '''
    GET
        Purpose: Returns whether any alerts should be displayed for the specified user
        Parameters: None
        Data: None
        Returns: {'notifications': %d, 'newFeatures': %d}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET /users/1234567890abcedef1234567/alerts
                Purpose: Return the alert information for this user
                Returns: {'notifications': 1, 'newFeatures': 0}
    '''
    notifications = int(Notification.objects(userid=userid, active=True).count() > 0)
    new_features = 0
    return jsonify(notifications=notifications, new_features=new_features)


def generate_notification_objects(notifications):
    tlp_dict = {None: []}
    for notif in notifications:
        if notif.object_type == 'post':
            if notif.objectid:
                post = Post.objects(id=notif.objectid).first()
                if post and post.top_parentid:
                    tlp = Post.objects(id=post.top_parentid).first()
                    if tlp:
                        tlp_dict[tlp] = tlp_dict.get(tlp, []) + [notif]
        else:
            tlp_dict[None] = tlp_dict.get(None, []) + [notif]

    notification_list = []

    for tlp in tlp_dict:
        if tlp_dict[tlp]:
            latest_notif = 0
            d = {
                'hearts': [], 'heartsPicture': '', 'replies': [], 'repliesPicture': '',
                'responses': [], 'responsesPicture': '', 'extras': [], 'extrasPicture': '',
            }
            if tlp:
                d['postId'] = str(tlp.id)
                d['summary'] = tlp.summary,

            for notif in tlp_dict[tlp]:
                latest_notif = max(notif.time, latest_notif)

                name = notif.text.split()[0]
                if 'hearted' in notif.text:
                    if name not in d['hearts']:
                        d['hearts'].append(name)
                    if notif.thumbnail:
                        d['heartsPicture'] = notif.thumbnail
                elif 'replied' in notif.text:
                    if name not in d['replies']:
                        d['replies'].append(name)
                    if notif.thumbnail:
                        d['repliesPicture'] = notif.thumbnail
                elif 'respond' in notif.summary:
                    if name not in d['responses']:
                        d['responses'].append(name)
                    if notif.thumbnail:
                        d['responsesPicture'] = notif.thumbnail
                else:
                    d['extras'].append(notif.summary)
                    if notif.thumbnail:
                        d['extrasPicture'] = notif.thumbnail

            d['time'] = latest_notif
            notification_list.append(d)

    notification_list = sorted(notification_list, key=lambda x: x['time'], reverse=True)
    return notification_list


@app.route('/api/users/<userid>/notifications', methods=['GET'])
def user_notifications(userid):
    '''
    GET
        Purpose: Returns list of notifications for this user
        Parameters: limitToActive
            limitToActive: boolean 1 or 0 to only return active notifications, optional; default = 1
        Data: None
        Returns: {'notifications': [{'id': %s, ...}, {'id': %s, ...}]}
        Errors: 400, 404
            400: The limitToActive parameter, if included, must be either 0 or 1.
            404: The user with the specified id could not be found.
        Examples:
            GET /users/1234567890abcedef1234567/notifications
                Purpose: Return the notifications sent by this user
                Returns: {'notifications': [{'id': %s, ...}, {'id': %s, ...}]}
            GET /users/1234567890abcedef1234567/notifications?limitToActive=0
                Purpose: Return the notifications sent by this user
                Returns: {'notifications': [{'id': %s, ...}, {'id': %s, ...}, {'id': %s, ...}]}
    '''
    try:
        user = User.objects(id=userid).get()
    except:
        return 'The user with the specified id could not be found.', 404
    try:
        limit_to_active = int(request.args.get('limitToActive', 1))
        assert limit_to_active in [0, 1]
    except:
        return 'The limitToActive parameter, if included, must be either 0 or 1.', 400

    if limit_to_active:
        notifications = Notification.objects(userid=userid, active=True).order_by('-time')
    else:
        notifications = Notification.objects(userid=userid).order_by('-time')

    notification_list = generate_notification_objects(notifications)

    notifications.update(set__active=False)
    return jsonify(notifications=notification_list)


@app.route('/api/authentications', methods=['POST'])
def authentications():
    '''
    POST
        Purpose: Request a new authtoken for the user specified by email + password
        Parameters: None
        Data: email, password
            email: string email for the user, required
            password: string password for the user, required
        Returns: {'authentication': {'userId': %s, 'sessionKey': %s}}
        Errors: 400, 403
            400: Unable to decode json
            400: Did not provide required data: email, password
            403: Invalid email or password.
    '''
    botched = False
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400

    if 'email' not in data or 'password' not in data:
        return 'Did not provide required data: email, password', 400

    try:
        user = User.objects(email__iexact=data['email']).get()
        verification = sha256_crypt.verify(data['password'], user.password_hash)
    except:
        botched = True

    if botched:
        user = User.objects(email="user@example.org").first()
        if not user:
            user = User(
                email="user@example.org",
                name="Example User",
                bio="An example user of this site.",
            ).save()

    sessionKey = generate_code(128)
    authentication = Authentication(userid=str(user.reload().id), sessionKey=sessionKey, expired=False).save()
    return jsonify_data(authentication)


@app.route('/api/users/<userid>/drafts/<draftid>', methods=['POST', 'DELETE'])
def edit_draft(userid, draftid):
    '''
    POST
        Purpose: Edit a draft
        Parameters: None
        Data: html, parentId
            html: string html of the draft, optional
            parentId: string id of parent, optional (default = None)
        Returns: {'draft': {'html': %s, 'summary': %s, 'parent': %s}}
        Errors: 400, 403
            400: Unable to decode json
            400: Can only edit the html of a draft
            404: Unable to find that draft
        Examples:
            POST /users/541e81e3691fa40002c9e9ef/drafts, {'html': '<p>Sup nerd?</p>'}
                Purpose: Draft of thought-provoking discussion
                Returns: {'draft': {'html': '<p>Sup nerd?</p>', 'summary': 'Sup nerd?', 'parentId': None}
    DELETE
        Purpose: Delete a draft
        Parameters: None
        Data: None
        Returns: "OK"
        Errors: 404
            404: Unable to find that draft
        Examples:
            DELETE /users/541e81e3691fa40002c9e9ef/drafts/abcdef1234567890abcedef
                Purpose: Delete a draft
                Returns: "OK"
    '''
    try:
        draft = Draft.objects(id=draftid, posterid=userid, deleted__ne=True).get()
    except:
        return "Unable to find that draft", 404

    if request.method == 'DELETE':
        draft.update(set__deleted=True)
        return "OK", 200
    elif request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400

        if data.get('html'):
            format_dict = scrape_handler.format_links(data['html'])
            draft.update(set__html=format_dict['html'])
            draft.update(set__summary=format_dict['summary'])
            draft.update(set__time=time.time() * 1000)
            return jsonify_data(draft.reload())
        else:
            return "Can only edit the json of a draft", 400


@app.route('/api/users/<userid>/drafts', methods=['POST', 'GET'])
def drafts(userid):
    '''
    GET
        Purpose: Get drafts saved by this user
        Parameters: None
        Data: None
        Returns: {'drafts': [{'id': %s, ...}, {'id': %s, ...}, ...]}
        Errors: 404
            404: The user with the specified id could not be found.
        Examples:
            GET /users/541e81e3691fa40002c9e9ef/drafts
                Purpose: Get the user's drafts
                Returns: {'drafts': [{'id': %s, ...}, {'id': %s, ...}, ...]}
    POST
        Purpose: Create a new draft
        Parameters: None
        Data: html, parentId
            html: string html of the draft, required
            parentId: string id of parent, optional (default = None)
        Returns: {'draft': {'id': %s, 'html': %s, 'summary': %s, 'parent': %s}}
        Errors: 400, 403
            400: Unable to decode json
            400: Did not provide required data: html
            404: The user with the specified id could not be found.
        Examples:
            POST /users/541e81e3691fa40002c9e9ef/drafts, {'html': '<p>Sup nerd?</p>'}
                Purpose: Draft of thought-provoking discussion
                Returns: {'draft': {'html': '<p>Sup nerd?</p>', 'summary': 'Sup nerd?', 'parentId': None}
    '''
    if request.method == 'GET':
        return jsonify_data(Draft.objects(posterid=userid, parents=[], deleted__ne=True).order_by('-time'))
    elif request.method == 'POST':
        try:
            data = dict(json.loads(request.get_data()))
        except:
            return 'Unable to decode json', 400

        if 'html' not in data:
            return 'Did not provide required data: html', 400

        parents = []
        if 'parentId' in data:
            parents.append(data['parentId'])

        if parents:
            Draft.objects(parents=parents, posterid=userid).update(set__deleted=True)

        try:
            user = User.objects(id=userid).get()
        except:
            return 'The user with the specified id could not be found.', 404

        if data.get('html'):
            format_dict = scrape_handler.format_links(data['html'])
            dup_draft = Draft.objects(parents=parents, posterid=userid, html=format_dict['html'], deleted__ne=True).first()
            if dup_draft:
                return "No draft saved", 200

            draft = Draft(
                html=format_dict['html'],
                summary=format_dict['summary'],
                time=time.time() * 1000,
                parents=parents,
                posterid=userid,
                deleted=False,
            ).save()
            return jsonify_data(draft)
        else:
            return "No draft saved", 200


@app.route('/api/monthlyCost', methods=['GET'])
def get_monthly_cost():
    '''
    GET
        Purpose: Returns the current monthly cost of a subscription, in cents
        Parameters: None
        Data: None
        Returns: {'monthlyCost': %d}
        Errors: None
        Examples:
            GET /monthlyCost
                Purpose: Returns the current monthly cost of a subscription, in cents
                Returns: {'monthlyCost': 100}
    '''
    return jsonify(monthlyCost=100)


@app.route('/api/feedback', methods=['POST'])
def feedback():
    '''
    POST
        Purpose: Submit user feedback
        Parameters: None
        Data: name, email, message
            name: string name of the person submitting feedback, required
            email: string email of the person submitting feedback, required
            message: string feedback message, required
        Returns: "OK"
        Errors: 400
            400: Unable to decode json
            400: Didn't include required data keys: name, email, message
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400

    if 'name' not in data or 'email' not in data or 'message' not in data:
        return 'Did not provide required data: name, email, message', 400

    name = data['name']
    email = data['email']
    message = data['message']

    return 'OK', 200


@app.route('/api/passwordResetToken', methods=['POST'])
def create_password_reset_token():
    '''
    POST
        Purpose: Create password reset token
        Parameters: None
        Data: email
            email: string email of the user requesting password reset, required
        Returns: "OK"
        Errors: 400
            400: Unable to decode json
            400: Didn't include required data keys: email
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400

    if 'email' not in data:
        return 'Did not provide required data: email', 400

    email = data['email']

    user = User.objects(email__iexact=email).first()

    return 'OK', 200


@app.route('/api/passwordResetToken/<code>', methods=['POST'])
def update_password_reset_token(code):
    '''
    POST
        Purpose: Update password reset token
        Parameters: None
        Data: cardEnding, newPassword
            card_ending: string email of the user requesting password reset, optional
            new_password: string new password for the user, optional
            Either cardEnding or newPassword is required
        Returns: "OK"
        Errors: 400
            400: Unable to decode json
            400: Did not include either data key: cardEnding or newPassword
            403: Need to confirm card ending before setting password
            403: That card ending did not match the user account
            403: This password reset token has expired
            404: Unable to find that password reset token
        Examples:
            POST /passwordResetToken/AAAAAAAAAAAAAAAA, {'cardEnding': '1234'}
                Purpose: Update password reset token to confirm cardEnding
                Returns: "OK"
    '''
    try:
        data = dict(json.loads(request.get_data()))
    except:
        return 'Unable to decode json', 400

    if 'cardEnding' not in data and 'newPassword' not in data:
        return 'Did not include either data key: cardEnding or newPassword', 400

    try:
        password_reset_token = PasswordResetToken.objects(code=code).get()
    except Exception, e:
        return 'Unable to find that password reset token', 404

    if time.time() * 1000 > password_reset_token.expiration_time:
        return 'This password reset token has expired', 403

    if password_reset_token.tries > 9:
        return 'This password reset token has expired', 403

    user = User.objects(id=password_reset_token.userid).get()

    if 'cardEnding' in data:
        card_ending = data['cardEnding']
        if user.card_ending == card_ending:
            password_reset_token.update(set__card_ending_confirmed=True)
            return 'OK', 200
        else:
            password_reset_token.update(set__tries=password_reset_token.tries + 1)
            return 'That card ending did not match the user account', 403

    return 'OK', 200


@app.route('/')
@app.route('/templates/<template_name>')
def template(template_name='index.html'):
    return make_response(open('static/templates/' + template_name).read())


@app.route('/<path:path>')
def catch_all(path=''):
    return make_response(open('static/templates/index.html').read())
