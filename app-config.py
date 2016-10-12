#!/usr/bin/python

import json
from pprint import pprint

with open('/home/ec2-user/secret.json') as data_file:    
    data = json.load(data_file)

pprint(data)
 
fp=open("/home/ec2-user/TwitterWallApp/server.js","r")
buffer=fp.read()
fp.close()
 
strToSearch="process.env.TWEET_WALL_OAUTH_SECRET"
strToReplace=data['TWEET_WALL_OAUTH_SECRET']
buffer = buffer.replace(strToSearch,strToReplace)

strToSearch="process.env.TWITTER_CONSUMER_KEY"
strToReplace=data['TWITTER_CONSUMER_KEY']
buffer = buffer.replace(strToSearch,strToReplace)

strToSearch="process.env.TWITTER_CONSUMER_SECRET"
strToReplace=data['TWITTER_CONSUMER_SECRET']
buffer = buffer.replace(strToSearch,strToReplace)

strToSearch="process.env.TWITTER_ACCESS_TOKEN_KEY"
strToReplace=data['TWITTER_ACCESS_TOKEN_KEY']
buffer = buffer.replace(strToSearch,strToReplace)

strToSearch="process.env.TWITTER_ACCESS_TOKEN_SECRET"
strToReplace=data['TWITTER_ACCESS_TOKEN_SECRET']
buffer = buffer.replace(strToSearch,strToReplace)

strToSearch="127.0.0.1"
strToReplace='52.57.179.165'
buffer = buffer.replace(strToSearch,strToReplace)

fp=open("/home/ec2-user/TwitterWallApp/server.js","w")
fp.write(buffer)
fp.close()

