var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

module.exports = function(port, client, googleAuthoriser) {
    var app = express();
    var tweetSearcher = require("./tweetSearch")(client);

    var adminSessions = {};

    app.use(express.static("client"));
    app.use(cookieParser());
    app.use(bodyParser.json());

    app.get("/oauth", function(req, res) {
        googleAuthoriser.authorise(req, function(err, token) {
            if (!err) {
                adminSessions[token] = true;
                res.cookie("sessionToken", token);
                res.header("Location", "/#/dash");
                res.sendStatus(302);
            }
            else {
                if (err.message === "Unauthorised user") {
                    res.header("Location", "/#/dash/unauthorised");
                    res.sendStatus(302);
                } else {
                    console.log(err);
                    res.sendStatus(400);
                }
            }
        });
    });

    app.get("/api/oauth/uri", function(req, res) {
        res.json({
            uri: googleAuthoriser.oAuthUri
        });
    });

    app.use("/admin", function(req, res, next) {
        if (req.cookies.sessionToken) {
            if (adminSessions[req.cookies.sessionToken]) {
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.get("/admin", function(req, res) {
        res.sendStatus(200);
    });

    var motd = "hello from the admin";
    app.get("/api/motd", function(req, res) {
        res.json(motd);
    });

    app.post("/admin/motd", function(req, res) {
        if (req.body.motd) {
            motd = req.body.motd;
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    });

    app.post("/admin/tweets/delete", function(req, res) {
        tweetSearcher.deleteTweet(req.body.id);
        res.sendStatus(200);
    });

    app.get("/api/tweets", function(req, res) {
        res.json(getTweets());
    });

    function getTweets() {
        return tweetSearcher.getTweetStore();
    }

    return app.listen(port);
};
