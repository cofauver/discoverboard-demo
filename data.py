import os
import re
import sys
import random
import inspect
import datetime

import mongoengine
Q = mongoengine.Q
from flask.json import jsonify

# Setup the correct database connection

mongo_url = os.environ.get("MONGOLAB_URI")

if mongo_url:
    dividers = re.compile(r"[/:@]")
    split_url = dividers.split(mongo_url)
    username = split_url[3]
    password = split_url[4]
    host = split_url[5]
    port = int(split_url[6])

    print "Database connection with", username

    mongoengine.connect(
        username,
        username=username,
        password=password,
        host=host,
        port=port
    )
else:
    print "Database connection with default"
    mongoengine.connect("default")


def jsonify_data(data):
    '''Takes in one or more database objects and converts them to json for the frontend'''
    if data:
        if type(data) in [list, mongoengine.queryset.queryset.QuerySet]:
            data = list(data)
            if data:
                data_class = type(data[0])
                data_name = data_class._class_name.lower() + 's'
                return jsonify(**{data_name: [d.to_json() for d in data]})

        else:
            data_class = type(data)
            data_name = data_class._class_name.lower()
            return jsonify(**{data_name: data.to_json()})
    else:
        # No data to jsonify
        data_types = {}

        for name, obj in inspect.getmembers(sys.modules[__name__]):
            if inspect.isclass(obj):
                data_types[name.lower()] = None
                data_types[name.lower() + 's'] = []
        return jsonify(**data_types)


class User(mongoengine.Document):
    meta = {
        "indexes": ['name']
    }

    email = mongoengine.StringField()
    name = mongoengine.StringField()
    password_hash = mongoengine.StringField()
    invites = mongoengine.IntField(default=5)
    monthly_subscription = mongoengine.IntField()
    next_billing = mongoengine.StringField()
    billing_alert_state = mongoengine.StringField()
    card_ending = mongoengine.StringField()
    canceled_subscription = mongoengine.BooleanField()
    expired = mongoengine.BooleanField(default=False)
    inviteid = mongoengine.StringField(default='')
    verification_code = mongoengine.StringField()

    bio = mongoengine.StringField()
    picture = mongoengine.StringField()
    thumbnail = mongoengine.StringField()
    location = mongoengine.StringField()
    checklist = mongoengine.ListField(default=[])
    friends = mongoengine.ListField(default=[])
    following = mongoengine.ListField(default=[])

    contact = mongoengine.StringField()
    activity_email_frequency = mongoengine.IntField(default=1)
    next_activity_email = mongoengine.StringField(default='2015-1-1')
    top_posts_email_frequency = mongoengine.IntField(default=7)
    next_top_posts_email = mongoengine.StringField(default='2015-1-1')
    octopus_days = mongoengine.IntField(default=0)
    next_invite_topup = mongoengine.StringField()
    next_first_invite_reminder = mongoengine.StringField()
    next_second_invite_reminder = mongoengine.StringField()

    def to_json(self):
        d = {
            'id': str(self.id),
            'email': self.email,
            'name': self.name,
            'bio': self.bio,
            'location': self.location,
            'picture': self.picture,
            'invites': self.invites,
            'inviteId': self.inviteid,
            'cardEnding': self.card_ending,
            'nextBilling': self.next_billing,
            'monthlySubscription': self.monthly_subscription,
            'canceledSubscription': 1 if self.canceled_subscription else 0,
            'expired': 1 if self.expired else 0,
            'checklist': self.checklist,
            'activityEmailFrequency': self.activity_email_frequency,
            'topPostsEmailFrequency': self.top_posts_email_frequency,
            'octopusDays': self.octopus_days,
            'verificationCode': 1 if self.verification_code else 0,
        }
        return d


class Post(mongoengine.Document):
    posterid = mongoengine.StringField()
    html = mongoengine.StringField()
    edit_html = mongoengine.StringField()
    anonymized_html = mongoengine.StringField()
    text = mongoengine.StringField()
    summary = mongoengine.StringField()
    anonymized_summary = mongoengine.StringField()
    time = mongoengine.FloatField()
    parents = mongoengine.ListField()
    top_parentid = mongoengine.StringField()
    inappropriate = mongoengine.BooleanField(default=False)
    featured = mongoengine.BooleanField(default=False)
    deleted = mongoengine.BooleanField(default=False)
    anonymous = mongoengine.BooleanField(default=False)
    pseudonym = mongoengine.StringField()
    videos = mongoengine.ListField()
    opengraph = mongoengine.ListField()
    image = mongoengine.StringField()

    num_children = mongoengine.IntField(default=0)
    xkcd_score = mongoengine.FloatField(default=0.0)
    hn_score = mongoengine.FloatField(default=0.0)
    replies_needed = mongoengine.IntField()

    def to_json(self):
        epoch_date = datetime.datetime.utcfromtimestamp(0)
        two_weeks_ago = datetime.datetime.utcnow() - datetime.timedelta(days=14)
        two_weeks_ago_ms = (two_weeks_ago - epoch_date).total_seconds() * 1000
        two_weeks_old = self.time < two_weeks_ago_ms
        if self.anonymous or two_weeks_old:
            poster_name = self.pseudonym
            posterid = None
        else:
            posterid = self.posterid
            try:
                poster_name = User.objects(id=self.posterid).get().name
            except:
                poster_name = ""

        return {
            'id': str(self.id),
            'posterId': posterid,
            'posterName': poster_name,
            'time': self.time,
            'html': self.html,
            'editHtml': self.edit_html,
            'text': self.text,
            'summary': self.summary,
            'numChildren': self.num_children,
            'parents': self.parents,
            'topParentId': self.top_parentid,
            'inappropriate': 1 if self.inappropriate else 0,
            'deleted': 1 if self.deleted else 0,
            'anonymous': 1 if (self.anonymous and not two_weeks_old) else 0,
            'videos': self.videos,
            'opengraph': self.opengraph,
            'image': self.image if self.image else '',
        }


class Draft(mongoengine.Document):
    time = mongoengine.FloatField()
    html = mongoengine.StringField()
    summary = mongoengine.StringField()
    posterid = mongoengine.StringField()
    parents = mongoengine.ListField()
    deleted = mongoengine.BooleanField(default=False)

    def to_json(self):
        return {
            'id': str(self.id),
            'time': self.time,
            'html': self.html,
            'summary': self.summary,
            'parents': self.parents,
            'posterId': str(self.posterid),
        }


class Tip(mongoengine.Document):
    userid = mongoengine.StringField()
    postid = mongoengine.StringField()
    time = mongoengine.FloatField()

    def to_json(self):
        return {
            'id': str(self.id),
            'userId': str(self.userid),
            'postId': str(self.postid),
        }


class Flag(mongoengine.Document):
    flaggerid = mongoengine.StringField()
    postid = mongoengine.StringField()
    reason = mongoengine.StringField()
    time = mongoengine.FloatField()
    confirmations = mongoengine.ListField()
    rejections = mongoengine.ListField()

    def to_json(self):
        return {
            'id': str(self.id),
            'flaggerId': str(self.flaggerid),
            'postId': str(self.postid),
            'reason': self.reason,
            'time': self.time,
            'confirmations': self.confirmations,
            'rejections': self.rejections,
        }


class Invite(mongoengine.Document):
    inviterid = mongoengine.StringField()
    invitee_email = mongoengine.StringField()
    code = mongoengine.StringField()
    send_time = mongoengine.FloatField()
    accepted = mongoengine.BooleanField()
    accept_time = mongoengine.FloatField()
    inviteeid = mongoengine.StringField()
    next_followup = mongoengine.StringField()
    followup_state = mongoengine.StringField(default='')

    def to_json(self):
        return {
            'id': str(self.id),
            'inviterId': str(self.inviterid),
            'inviteeEmail': str(self.invitee_email),
            'sendTime': self.send_time,
            'accepted': 1 if self.accepted else 0,
            'acceptTime': self.accept_time,
            'inviteeId': self.inviteeid,
        }


class Authentication(mongoengine.Document):
    userid = mongoengine.StringField()
    sessionKey = mongoengine.StringField()
    expired = mongoengine.BooleanField(default=False)

    def to_json(self):
        try:
            name = User.objects(id=self.userid).get().name
        except:
            name = ''
        return {
            'name': name,
            'userId': self.userid,
            'sessionKey': self.sessionKey,
        }


class Notification(mongoengine.Document):
    userid = mongoengine.StringField()
    thumbnail = mongoengine.StringField()
    active = mongoengine.BooleanField()
    emailed = mongoengine.BooleanField(default=False)
    time = mongoengine.FloatField()
    objectid = mongoengine.StringField()
    object_type = mongoengine.StringField()
    summary = mongoengine.StringField()
    text = mongoengine.StringField()
    triggers_digest = mongoengine.BooleanField(default=False)

    def to_json(self):
        return {
            'id': str(self.id),
            'userId': str(self.userid),
            'active': self.active,
            'time': self.time,
            'objectId': self.objectid,
            'objectType': self.object_type,
            'summary': self.summary,
            'text': self.text,
        }


class Interaction(mongoengine.Document):
    '''
    An interaction holds the aggregate information-so-far about
    all happenings between a particular user and a particular post.
    '''

    meta = {
        "indexes": ['userid', 'postid', 'time']
    }
    userid = mongoengine.StringField()
    postid = mongoengine.StringField()
    referrer = mongoengine.StringField()
    ip = mongoengine.StringField()
    browser = mongoengine.StringField()
    platform = mongoengine.StringField()
    time = mongoengine.FloatField()
    reply = mongoengine.IntField(default=0)
    tip = mongoengine.IntField(default=0)
    view = mongoengine.IntField(default=0)
    exit = mongoengine.IntField(default=0)
    scrolledIn = mongoengine.IntField(default=0)
    scrolledOut = mongoengine.IntField(default=0)
    flag = mongoengine.IntField(default=0)
    facebook = mongoengine.IntField(default=0)
    twitter = mongoengine.IntField(default=0)
    suggest = mongoengine.IntField(default=0)
    signupData = mongoengine.DictField()

    def to_json(self):
        d = {
            'id': str(self.id),
            'userId': str(self.userid),
            'postId': str(self.postid),
        }
        fields = ['time', 'reply', 'tip', 'view', 'exit', 'flag',
                  'facebook', 'twitter', 'ip', 'browser', 'platform',
                  'suggest', 'scrolledIn', 'scrolledOut']
        for f in fields:
            d[f] = getattr(self, f)
        return d


class PasswordResetToken(mongoengine.Document):
    userid = mongoengine.StringField()
    code = mongoengine.StringField()
    expiration_time = mongoengine.FloatField()
    card_ending_confirmed = mongoengine.BooleanField()
    tries = mongoengine.IntField(default=0)


class Mention(mongoengine.Document):
    posterid = mongoengine.StringField()
    targetid = mongoengine.StringField()
    postid = mongoengine.StringField()
    time = mongoengine.FloatField()


class AnonymousPost(mongoengine.Document):
    posterid = mongoengine.StringField()
    postid = mongoengine.StringField()
    name = mongoengine.StringField()


class Pseudonyms(mongoengine.Document):
    all_pseudonyms = mongoengine.ListField()
    conversation_dict = mongoengine.DictField()

    @staticmethod
    def new(userid, top_parentid):
        userid = str(userid)
        top_parentid = str(top_parentid)
        if not Pseudonyms.objects.first():
            Pseudonyms(all_pseudonyms=[
                'Zhang', 'Liu', 'Aarav', 'Saanvi', 'Sophia', 'Noah', 'Sarah', 'Rio',
                'Maxim', 'Dariya', 'Ren', 'Yua', 'Santiago', 'Camila', 'Sean', 'Mia'
                'Miguel', 'Julia', 'Noor', 'Ali', 'Emmanuel', 'Rose', 'Sumon', 'Kanta',
                'Hoang', 'Linh', 'Solomon', 'Beza', 'Ahmed', 'Rana', 'Leon', 'Samantha',
            ]).save()
        p = Pseudonyms.objects.first()

        conversation = p.conversation_dict.get(top_parentid, {})
        pseudonym = conversation.get(userid)
        if pseudonym:
            return pseudonym

        used = set(conversation.get('all', []))
        available = set(p.all_pseudonyms) - used
        if not available:
            available = used
        pseudonym = random.choice(list(available))
        used.add(pseudonym)

        if not conversation:
            p.conversation_dict[top_parentid] = {}
            p.save()
        p.conversation_dict[top_parentid]['all'] = used
        p.save()
        p.conversation_dict[top_parentid][userid] = pseudonym
        p.save()
        return pseudonym


class Suggestion(mongoengine.Document):
    userid = mongoengine.StringField()
    postid = mongoengine.StringField()
    targetid = mongoengine.StringField()
    target_email = mongoengine.StringField()
    time = mongoengine.FloatField()

    def to_json(self):
        d = {
            'id': str(self.id),
            'userId': str(self.userid),
            'postId': str(self.postid),
            'targetId': str(self.targetid),
            'targetEmail': str(self.target_email),
            'time': self.time,
        }
        return d


class Email(mongoengine.Document):
    userid = mongoengine.StringField()
    to = mongoengine.StringField()
    postids = mongoengine.ListField()
    sender = mongoengine.StringField()
    subject = mongoengine.StringField()
    body = mongoengine.StringField()
    time = mongoengine.FloatField()


def main():
    if len(sys.argv) > 1 and sys.argv[1] == 'reset':
        if not os.environ.get("MONGOLAB_URI") and User.objects.count() == 0:
            User.objects.delete()
            Post.objects.delete()
            Tip.objects.delete()
            Invite.objects.delete()
            Interaction.objects.delete()
            Notification.objects.delete()


if __name__ == '__main__':
    main()
