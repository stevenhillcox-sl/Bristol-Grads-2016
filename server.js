var server = require("./server/server");
var oAuthGoogle = require("./server/oauth-google");
var Twitter = require("twitter");
var google = require("googleapis");
var verifier = require("google-id-token-verifier");
var fs = require("fs");
var mkdirp = require("mkdirp");

var port = process.env.PORT || 8080;
var oauthClientId = "627385202945-oqedl0onib41h39quc15pufqgqp8j8cu.apps.googleusercontent.com";
var oauthSecret = process.env.TWEET_WALL_OAUTH_SECRET;
var REDIRECT_URL = "http://127.0.0.1:8080/oauth";

var twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var tweetSearcher = require("./server/tweetSearch")(twitterClient, fs, "./server/config/eventConfig.json", mkdirp);

var oauth2Client = new google.auth.OAuth2(oauthClientId, oauthSecret, REDIRECT_URL);
var googleAuthoriser = oAuthGoogle(oauth2Client, verifier, fs, "./server/config/adminConfig.json");

server(port, tweetSearcher, googleAuthoriser);

console.log("Server running on port " + port);
