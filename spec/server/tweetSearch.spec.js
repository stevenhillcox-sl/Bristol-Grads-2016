var tweetSearch = require("../../server/tweetSearch.js");

var testPort = 1234;
var baseURL = "http://localhost:" + testPort;

var tweetSearcher;
var client;
var getTweets;
var fs;

var speakers = ["alice", "bob", "charlie"];
var hashtags = ["#bobtech", "#bobtech2016"];
var mentions = ["@bob"];
var officialUsers = ["bob"];

var eventConfig = {
    hashtags: hashtags,
    mentions: mentions,
    officialUsers: officialUsers,
    speakers: speakers
};

var testTimeline = [{
    id: 1,
    id_str: "1",
    text: "Test tweet 1",
    user: {
        screen_name: officialUsers[0],
    },
    entities: {
        hashtags: [],
        user_mentions: [],
    },
}, {
    id: 2,
    id_str: "2",
    text: "Test tweet 2",
    user: {
        screen_name: officialUsers[0],
    },
    entities: {
        hashtags: [],
        user_mentions: [],
    },
}];

var testTimeline2 = [{
    id: 4,
    id_str: "4",
    text: "Test tweet 3",
    user: {
        screen_name: officialUsers[0],
    },
    entities: {
        hashtags: [],
        user_mentions: [],
    },
}, {
    id: 7,
    id_str: "7",
    text: "Test tweet 4",
    user: {
        screen_name: officialUsers[0],
    },
    entities: {
        hashtags: [],
        user_mentions: [],
    },
}];

var testTweets = {
    statuses: [{
        id: 1,
        id_str: "1",
        text: "Test tweet 1 " + hashtags[0],
        user: {
            screen_name: "randomjoe",
        },
        entities: {
            hashtags: [{
                text: hashtags[0].slice(1),
            }],
            user_mentions: [],
        },
    }, {
        id: 2,
        id_str: "2",
        text: "Test tweet 2 " + hashtags[0],
        user: {
            screen_name: "randomjoe",
        },
        entities: {
            hashtags: [{
                text: hashtags[0].slice(1),
            }],
            user_mentions: [],
        },
    }, {
        id: 5,
        id_str: "5",
        text: "Test tweet 3 " + mentions[0],
        user: {
            screen_name: "randomjoe",
        },
        entities: {
            hashtags: [],
            user_mentions: [{
                screen_name: mentions[0].slice(1),
            }],
        },
    }],
};

var testTweetsMixed = {
    statuses: testTweets.statuses.concat({
        id: 10,
        id_str: "10",
        text: "Test official tweet " + hashtags[0],
        user: {
            screen_name: officialUsers[0],
        },
        entities: {
            hashtags: [{
                text: hashtags[0].slice(1),
            }],
            user_mentions: [],
        },
    }),
};

var testResponseOk = {
    headers: {
        "x-rate-limit-remaining": 180,
        "x-rate-limit-reset": 0,
    }
};

var testResponseDepleted = {
    headers: {
        "x-rate-limit-remaining": 0,
        "x-rate-limit-reset": 0,
    }
};

var testInitialResourceProfiles = {
    resources: {
        "search": {
            "/search/tweets": {
                remaining: 180,
                reset: 0,
            },
        },
        "statuses": {
            "/statuses/user_timeline": {
                remaining: 180,
                reset: 0,
            },
        },
    },
};

var testUser = {
    screen_name: "name",
    name: "Billy Name"
};

describe("tweetSearch", function() {
    var startTime;

    function getQueries(resource) {
        var searchArgs = client.get.calls.allArgs().filter(function(args) {
            return args[0] === resource;
        });
        return searchArgs.map(function(args) {
            return args[1];
        });
    }

    function getLatestCallback(resource) {
        var searchArgs = client.get.calls.allArgs().filter(function(args) {
            return args[0] === resource;
        });
        expect(searchArgs.length).toBeGreaterThan(0);
        return searchArgs[searchArgs.length - 1][2];
    }

    beforeEach(function() {
        client = {
            get: jasmine.createSpy("get"),
        };

        fs = jasmine.createSpyObj("fs", [
            "readFile",
            "writeFile",
        ]);

        fs.readFile.and.callFake(function(file, encoding, callback) {
            callback(undefined, JSON.stringify(eventConfig));
        });

        fs.writeFile.and.callFake(function(file, data, callback) {
            callback(undefined);
        });

        jasmine.clock().install();
        startTime = new Date().getTime();
        jasmine.clock().mockDate(startTime);
        tweetSearcher = tweetSearch(client, fs, "file");
        getLatestCallback("application/rate_limit_status")(null, testInitialResourceProfiles, testResponseOk);
    });

    afterEach(function() {
        jasmine.clock().uninstall();
    });

    function resourceQueryTests(resource, defaultData, defaultOutput) {
        it("performs an additional query after a 5 second delay", function() {
            jasmine.clock().tick(4999);
            expect(getQueries(resource).length).toEqual(1);
            jasmine.clock().tick(1);
            expect(getQueries(resource).length).toEqual(2);
        });

        it("uses the id of the most recently acquired tweet as the since_id for subsequent queries", function() {
            getLatestCallback(resource)(null, defaultData, testResponseOk);
            jasmine.clock().tick(5000);
            expect(getQueries(resource)[1].since_id).toEqual(defaultOutput[defaultOutput.length - 1].id_str);
        });

        it("serves acquired tweets through the getTweets function", function() {
            getLatestCallback(resource)(null, defaultData, testResponseOk);
            var tweetData = tweetSearcher.getTweetData();
            expect(tweetData.tweets).toEqual(defaultOutput);
        });

        it("prints an error and adds no tweets if the twitter client returns an error", function() {
            spyOn(console, "log");
            getLatestCallback(resource)("Failed", null, testResponseOk);
            expect(console.log).toHaveBeenCalledWith("Failed");
            var tweetData = tweetSearcher.getTweetData();
            expect(tweetData.tweets.length).toEqual(0);
        });

        it("does not attempt to query the twitter api until the reset time if the rate limit has been reached",
            function() {
                var resetTime = (Math.floor(startTime / 1000) + 6) * 1000;
                var depletedResponse = testResponseDepleted;
                depletedResponse.headers["x-rate-limit-reset"] = (resetTime / 1000).toString();
                // Send response with headers indicating the app has depleted its query rate limit
                getLatestCallback(resource)(null, defaultData, depletedResponse);
                expect(getQueries(resource).length).toEqual(1);
                // Tick clock forward to the time when the tweet searcher would normally query again
                jasmine.clock().tick(5000);
                expect(getQueries(resource).length).toEqual(1);
                // Tick clock forward to the time when the tweet searcher should attempt to query again
                jasmine.clock().tick(resetTime + 1000 - (startTime + 5000));
                expect(getQueries(resource).length).toEqual(2);
            }
        );
    }

    describe("getTweetsWithHashtag", function() {
        it("searches only for tweets with any of the specified hashtags on the first query", function() {
            var queries = getQueries("search/tweets");
            expect(queries.length).toEqual(1);
            expect(queries[0]).toEqual({
                q: hashtags.concat(mentions).join(" OR ")
            });
        });

        resourceQueryTests("search/tweets", testTweets, testTweets.statuses);

        it("does not save tweets that belong to a higher-priority tweet category", function() {
            getLatestCallback("search/tweets")(null, testTweetsMixed, testResponseOk);
            var tweetData = tweetSearcher.getTweetData();
            expect(tweetData.tweets).toEqual(testTweets.statuses);
        });
    });

    describe("getTweetsFrom", function() {
        it("searches only for tweets from the user with the specified screen name", function() {
            var queries = getQueries("statuses/user_timeline");
            expect(queries.length).toEqual(1);
            expect(queries[0]).toEqual({
                screen_name: officialUsers[0]
            });
        });

        resourceQueryTests("statuses/user_timeline", testTimeline, testTimeline);
    });

    describe("getTweetData", function() {
        var testTweetData;
        var secondUpdateTime;

        beforeEach(function() {
            testTweetData = {
                tweets: testTimeline.concat(testTimeline2),
                updates: speakers.map(function(speaker) {
                    return {
                        type: "speaker_update",
                        since: new Date(),
                        screen_name: speaker,
                        operation: "add"
                    };
                }),
            };
            tweetSearcher.loadTweets(testTimeline, "test");
            testTweetData.updates.push({
                type: "new_tweets",
                since: new Date(),
                tag: "test",
                startIdx: 0,
            });
            jasmine.clock().tick(5000);
            tweetSearcher.loadTweets(testTimeline2, "test");
            secondUpdateTime = new Date();
            testTweetData.updates.push({
                type: "new_tweets",
                since: secondUpdateTime,
                tag: "test",
                startIdx: 2,
            });
        });

        it("returns all undeleted tweets in the timeline when given no since argument", function() {
            expect(tweetSearcher.getTweetData()).toEqual(testTweetData);
        });

        it("returns only updates that occurred after the time given by the `since` argument", function() {
            var beforeSecondUpdate = tweetSearcher.getTweetData(new Date(secondUpdateTime.getTime() - 1));
            expect(beforeSecondUpdate.tweets).toEqual(testTimeline2);
            expect(beforeSecondUpdate.updates).toEqual([testTweetData.updates[testTweetData.updates.length - 1]]);
            var atSecondUpdate = tweetSearcher.getTweetData(secondUpdateTime);
            expect(atSecondUpdate.tweets).toEqual([]);
            expect(atSecondUpdate.updates).toEqual([]);
        });

        describe("with deleted tweets", function() {
            var deletedTweetData;

            beforeEach(function() {
                deletedTweetData = {
                    tweets: testTweetData.tweets.slice(),
                    updates: testTweetData.updates.slice(),
                };
                jasmine.clock().tick(500);
                tweetSearcher.setDeletedStatus("2", true);
                var deleteDateTime = new Date();
                deletedTweetData.updates.push({
                    type: "tweet_status",
                    since: deleteDateTime,
                    id: "2",
                    status: {
                        deleted: true,
                    },
                });
            });

            it("adds an update noting the deleted tweet to its output when a tweet is deleted", function() {
                expect(tweetSearcher.getTweetData().updates).toEqual(deletedTweetData.updates);
            });

            it("still returns the full list of tweets", function() {
                expect(tweetSearcher.getTweetData().tweets).toEqual(testTweetData.tweets);
            });

            it("adds an update noting the undeletion of a tweet to its output when a tweet is undeleted", function() {
                var undeletedTweetData = {
                    tweets: deletedTweetData.tweets.slice(),
                    updates: deletedTweetData.updates.slice(),
                };
                jasmine.clock().tick(500);
                tweetSearcher.setDeletedStatus("2", false);
                var undeleteDateTime = new Date();
                undeletedTweetData.updates.push({
                    type: "tweet_status",
                    since: undeleteDateTime,
                    id: "2",
                    status: {
                        deleted: false,
                    },
                });
                expect(tweetSearcher.getTweetData().updates).toEqual(undeletedTweetData.updates);
            });
        });

        describe("with pinned tweets", function() {
            var pinnedTweetData;

            beforeEach(function() {
                pinnedTweetData = {
                    tweets: testTweetData.tweets.slice(),
                    updates: testTweetData.updates.slice(),
                };
                tweetSearcher.setPinnedStatus("4", true);
                var pinnedTime = new Date();
                pinnedTweetData.updates.push({
                    type: "tweet_status",
                    since: pinnedTime,
                    id: "4",
                    status: {
                        pinned: true
                    }
                });
            });
            it("adds an update noting a given tweet has been pinned", function() {
                expect(tweetSearcher.getTweetData().updates).toEqual(pinnedTweetData.updates);
            });

            it("still returns the full list of tweets", function() {
                expect(tweetSearcher.getTweetData().tweets).toEqual(pinnedTweetData.tweets);
            });

            it("adds an update noting the unpinning of a tweet to its output when a tweet is unpinned", function() {
                var unpinnedTweetData = {
                    tweets: pinnedTweetData.tweets.slice(),
                    updates: pinnedTweetData.updates.slice(),
                };
                tweetSearcher.setPinnedStatus("4", false);
                var unpinnedTime = new Date();
                unpinnedTweetData.updates.push({
                    type: "tweet_status",
                    since: unpinnedTime,
                    id: "4",
                    status: {
                        pinned: false
                    }
                });
                expect(tweetSearcher.getTweetData().updates).toEqual(unpinnedTweetData.updates);
            });
        });

        describe("with display blocked tweets", function() {
            var displayBlockedTweetData;

            beforeEach(function() {
                displayBlockedTweetData = {
                    tweets: testTweetData.tweets.slice(),
                    updates: testTweetData.updates.slice(),
                };
                tweetSearcher.displayBlockedTweet("4");
                var displayBlockedTime = new Date();
                displayBlockedTweetData.updates.push({
                    type: "tweet_status",
                    since: displayBlockedTime,
                    id: "4",
                    status: {
                        display: true
                    }
                });
            });
            it("adds an update noting a given blocked tweet has been set to be displayed", function() {
                expect(tweetSearcher.getTweetData().updates).toEqual(displayBlockedTweetData.updates);
            });

            it("still returns the full list of tweets", function() {
                expect(tweetSearcher.getTweetData().tweets).toEqual(displayBlockedTweetData.tweets);
            });

        });
    });

    describe("speakers ", function() {
        it("getSpeakers returns speakers read in from file", function() {
            expect(tweetSearcher.getSpeakers()).toEqual(speakers);
        });

        it("addSpeakers calls the write to file function", function() {
            tweetSearcher.addSpeaker("dan");
            speakers.push("dan");
            var objToWrite = {
                "hashtags": hashtags,
                "mentions": mentions,
                "officialUsers": officialUsers,
                "speakers": speakers
            };
            expect(fs.writeFile).toHaveBeenCalledWith("file", JSON.stringify(objToWrite), jasmine.any(Function));
        });

        it("removeSpeakers calls the write to file function when the speaker to remove is in the array", function() {
            spyOn(console, "log");
            tweetSearcher.removeSpeaker("dan");
            speakers.splice(speakers.indexOf("dan"), 1);
            expect(fs.writeFile).toHaveBeenCalledWith("file", JSON.stringify({
                "hashtags": hashtags,
                "mentions": mentions,
                "officialUsers": officialUsers,
                "speakers": speakers
            }), jasmine.any(Function));
        });

        it("removeSpeakers returns error when the speaker to remove is not in the array", function() {
            spyOn(console, "log");
            tweetSearcher.removeSpeaker("dan");
            expect(console.log).toHaveBeenCalledWith("ERROR : Speaker not found in the speakers list");
        });

        it("addSpeakers adds a speaker_add update", function() {
            var name = "bob";
            var updates = tweetSearcher.getTweetData().updates;
            tweetSearcher.addSpeaker(name);
            updates.push({
                type: "speaker_update",
                since: new Date(),
                screen_name: name,
                operation: "add"
            });
            expect(tweetSearcher.getTweetData().updates).toEqual(updates);
        });

        it("removeSpeakers adds a speaker_remove update", function() {
            var name = "bob";
            var updates = tweetSearcher.getTweetData().updates;
            tweetSearcher.removeSpeaker(name);
            updates.push({
                type: "speaker_update",
                since: new Date(),
                screen_name: name,
                operation: "remove"
            });
            expect(tweetSearcher.getTweetData().updates).toEqual(updates);
        });

    });

    describe("blocked users", function() {
        beforeEach(function() {
            tweetSearcher.loadTweets(testTimeline, "test");
        });

        it("returns the correct list of blocked users", function() {
            expect(tweetSearcher.getBlockedUsers()).toEqual([]);
        });

        it("adds a user to the list of blocked users when addBlockedUser is called", function() {
            tweetSearcher.addBlockedUser(testUser);
            expect(tweetSearcher.getBlockedUsers()).toEqual([testUser]);
        });

        it("does not add a user to the list of blocked users if already on it", function() {
            tweetSearcher.addBlockedUser(testUser);
            expect(tweetSearcher.getBlockedUsers()).toEqual([testUser]);
            spyOn(console, "log");
            tweetSearcher.addBlockedUser(testUser);
            expect(console.log).toHaveBeenCalledWith("User " + testUser.screen_name + " already blocked");
            expect(tweetSearcher.getBlockedUsers()).toEqual([testUser]);
        });

        it("adds an update notifying about the newly blocked user", function() {
            var blockedUpdate = {
                type: "user_block",
                since: new Date(),
                screen_name: testUser.screen_name,
                blocked: true,
            };
            expect(tweetSearcher.getTweetData().updates).not.toContain(blockedUpdate);
            tweetSearcher.addBlockedUser(testUser);
            expect(tweetSearcher.getTweetData().updates).toContain(blockedUpdate);
        });

        it("removes an user to the list of blocked users when removeBlockedUser is called", function() {
            tweetSearcher.addBlockedUser(testUser);
            expect(tweetSearcher.getBlockedUsers()).toEqual([testUser]);
            tweetSearcher.removeBlockedUser(testUser);
            expect(tweetSearcher.getBlockedUsers()).toEqual([]);
        });

        it("adds an update notifying about the newly unblocked user", function() {
            var unblockedUpdate = {
                type: "user_block",
                since: new Date(),
                screen_name: testUser.screen_name,
                blocked: false,
            };
            tweetSearcher.addBlockedUser(testUser);
            expect(tweetSearcher.getTweetData().updates).not.toContain(unblockedUpdate);
            tweetSearcher.removeBlockedUser(testUser);
            expect(tweetSearcher.getTweetData().updates).toContain(unblockedUpdate);
        });

    });
});
