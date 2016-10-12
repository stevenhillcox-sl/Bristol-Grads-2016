module.exports = function(client, fs, eventConfigFile, mkdirp) {

    var tweetStore = [];
    var tweetUpdates = [];
    var hashtags = [];
    var mentions = [];
    var blockedUsers = [];
    var speakers = [];
    var officialUsers = [];

    var rateLimitDir = "./server/temp/";
    var rateLimitFile = rateLimitDir + "rateLimitRemaining.json";

    function tweetType(tweet) {
        if (officialUsers.indexOf(tweet.user.screen_name) !== -1) {
            return "official";
        }
        var foundHashtag = hashtags.reduce(function(found, hashtag) {
            return found || tweet.entities.hashtags.reduce(function(match, tweetHashtag) {
                return match || hashtag.slice(1).toUpperCase() === tweetHashtag.text.toUpperCase();
            }, false);
        }, false);
        if (foundHashtag) {
            return "tagged";
        }
        var foundMention = mentions.reduce(function(found, mention) {
            return found || tweet.entities.user_mentions.reduce(function(match, userMention) {
                return match || mention.slice(1).toUpperCase() === userMention.screen_name.toUpperCase();
            }, false);
        }, false);
        if (foundMention) {
            return "tagged";
        }
        return "";
    }

    function addTweetItem(tweets, tag) {
        if (tweets.length === 0) {
            return;
        }
        tweetUpdates.push({
            type: "new_tweets",
            since: new Date(),
            tag: tag,
            startIdx: tweetStore.length,
        });
        tweetStore = tweetStore.concat(tweets);
    }

    function updateInteractions(visibleTweets, callback) {
        var interactionUpdates = {
            favourites: [],
            retweets: []
        };
        var tweets = JSON.parse(visibleTweets);
        var ids = tweets.map(function(tweet) {
            return tweet.id_str;
        });
        var params = {
            id: ids.join(),
            trim_user: true

        };
        if (apiResources["statuses/lookup"].requestsRemaining > 0) {
            client.get("statuses/lookup", params, function(error, data, response) {
                if (!error) {
                    data.forEach(function(tweet) {
                        var previous = tweets.find(function(inTweet) {
                            return tweet.id_str === inTweet.id_str;
                        });
                        if (previous.favorite_count !== tweet.favorite_count) {
                            interactionUpdates.favourites.push({
                                id: tweet.id_str,
                                value: tweet.favorite_count
                            });
                        }
                        if (previous.retweet_count !== tweet.retweet_count) {
                            interactionUpdates.retweets.push({
                                id: tweet.id_str,
                                value: tweet.retweet_count
                            });
                        }
                    });
                    apiResources["statuses/lookup"].requestsRemaining = response.headers["x-rate-limit-remaining"];
                    apiResources["statuses/lookup"].resetTime = (Number(response.headers["x-rate-limit-reset"]) + 1) * 1000;
                    callback(null, interactionUpdates);
                } else {
                    console.log(error);
                    callback(error);
                }
            });
        } else {
            var lookupTimer = setTimeout(function() {
                apiResources["statuses/lookup"].requestsRemaining = 1;
            }, apiResources["statuses/lookup"].resetTime - new Date().getTime());
            callback("too many API requests right now");
        }
    }

    function findLast(arr, predicate, thisArg) {
        for (var idx = arr.length - 1; idx >= 0; idx--) {
            if (predicate.call(thisArg, arr[idx], idx, arr)) {
                return arr[idx];
            }
        }
    }

    function setTweetStatus(tweetId, status) {
        var modifiedTweet = findLast(tweetStore, function(tweet) {
            return tweet.id_str === tweetId;
        });
        if (!modifiedTweet) {
            throw new Error("Cannot modify tweet that the server does not have.");
        }
        // Ignore the update if everything in `status` is already set for the tweet
        tweetUpdates.push({
            type: "tweet_status",
            since: new Date(),
            id: tweetId,
            status: status,
        });
    }

    function setDeletedStatus(tweetId, deleted) {
        setTweetStatus(tweetId, {
            deleted: deleted
        });
    }

    function setPinnedStatus(tweetId, pinned) {
        setTweetStatus(tweetId, {
            pinned: pinned
        });
    }

    // Compares two strings that represent numbers of greater size than can be handled as `number` types without loss
    // of precision, and returns true if the first is numerically greater than the second
    function idStrComp(a, b) {
        if (Number(a) === Number(b)) {
            return a > b;
        }
        return Number(a) > Number(b);
    }

    var apiResources = {
        "search/tweets": {
            since_id: "0",
            basePath: "search",
            requestsRemaining: 0,
            resetTime: 0,
            addData: function(tweets) {
                this.since_id = tweets.statuses.reduce(function(since, currTweet) {
                    return idStrComp(since, currTweet.id_str) ? since : currTweet.id_str;
                }, this.since_id);
                var taggedTweets = tweets.statuses.filter(function(tweet) {
                    return tweetType(tweet) === "tagged";
                });
                addTweetItem(taggedTweets, "tagged");
            }
        },
        "statuses/user_timeline": {
            since_id: "0",
            basePath: "statuses",
            requestsRemaining: 0,
            resetTime: 0,
            addData: function(tweets) {
                this.since_id = tweets.reduce(function(since, currTweet) {
                    return idStrComp(since, currTweet.id_str) ? since : currTweet.id_str;
                }, this.since_id);
                var officialTweets = tweets.filter(function(tweet) {
                    return tweetType(tweet) === "official";
                });
                addTweetItem(officialTweets, "official");
            }
        },
        "statuses/lookup": {
            basePath: "statuses",
            requestsRemaining: 0,
            resetTime: 0
        },
    };

    var searchUpdater;
    var userUpdater;

    loadEventConfig(eventConfigFile, function() {
        var hashtagUpdateFn = tweetResourceGetter("search/tweets", {
            q: hashtags.concat(mentions).join(" OR "),
            tweet_mode: "extended"
        });
        var timelineUpdateFn = tweetResourceGetter("statuses/user_timeline", {
            screen_name: officialUsers[0],
            tweet_mode: "extended"
        });
        // Begins the chain of callbacks defined below
        rateCheckLoop();
        // Callback that loops every 5 seconds until the server has confirmed the ability to safely access the rate
        // limits API; calls `rateSaveLoop` on success
        function rateCheckLoop() {
            checkRateLimitSafety(function(success) {
                if (success) {
                    getApplicationRateLimits(rateSaveLoop);
                } else {
                    var loopDelay = 5000;
                    console.log("Could not verify rate limit safety, retrying after " + loopDelay + "ms...");
                    setTimeout(rateCheckLoop, loopDelay);
                }
            });
        }

        // Callback that receives the rate limit data from `getApplicationRateLimits` and loops every 5 seconds until
        // the server has saved the rate limit data successfully; calls `beginResourceUpdates` on success
        function rateSaveLoop(rateLimitData) {
            mkdirp(rateLimitDir, function(err) {
                // Count a return value of `EEXIST` as successful, as it means the directory already exists
                if (!err || err.code === "EEXIST") {
                    fs.writeFile(rateLimitFile, JSON.stringify(rateLimitData), function(err) {
                        if (!err) {
                            beginResourceUpdates();
                        } else {
                            repeatLoop();
                        }
                    });
                } else {
                    repeatLoop();
                }
            });

            function repeatLoop() {
                var loopDelay = 5000;
                console.log("Could not save rate limit data, retrying after " + loopDelay + "ms...");
                setTimeout(rateSaveLoop.bind(undefined, rateLimitData), loopDelay);
            }
        }

        // Begins the loop of collecting tweets from the Twitter API
        function beginResourceUpdates() {
            resourceUpdate("search/tweets", hashtagUpdateFn, searchUpdater);
            resourceUpdate("statuses/user_timeline", timelineUpdateFn, userUpdater);
        }
    });

    return {
        getTweetData: getTweetData,
        setDeletedStatus: setDeletedStatus,
        setPinnedStatus: setPinnedStatus,
        loadTweets: loadTweets,
        getBlockedUsers: getBlockedUsers,
        addBlockedUser: addBlockedUser,
        removeBlockedUser: removeBlockedUser,
        getSpeakers: getSpeakers,
        addSpeaker: addSpeaker,
        removeSpeaker: removeSpeaker,
        displayBlockedTweet: displayBlockedTweet,
        setRetweetDisplayStatus: setRetweetDisplayStatus,
        updateInteractions: updateInteractions
    };

    function checkRateLimitSafety(callback) {
        fs.readFile(rateLimitFile, "utf8", function(err, data) {
            var success = false;
            if (err) {
                if (err.code === "ENOENT") {
                    success = true;
                } else {
                    console.log("Error reading rate limit safety file: " + err);
                }
            } else {
                try {
                    var rateLimitInfo = JSON.parse(data);
                    success = (rateLimitInfo.remaining > 1 || new Date() > new Date(rateLimitInfo.resetTime));
                } catch (err) {
                    console.log("Error parsing rate limit safety file: " + err);
                }
            }
            callback(success);
        });
    }

    function getBlockedUsers() {
        return blockedUsers;
    }

    function addBlockedUser(user) {
        if (!blockedUsers.find(function(blockedUser) {
                return blockedUser.screen_name === user.screen_name;
            })) {
            tweetUpdates.push({
                type: "user_block",
                since: new Date(),
                screen_name: user.screen_name,
                blocked: true,
            });
            blockedUsers.push(user);
        } else {
            console.log("User " + user.screen_name + " already blocked");
        }
    }

    function removeBlockedUser(user) {
        if (!blockedUsers.find(function(blockedUser) {
                return blockedUser.screen_name === user.screen_name;
            })) {
            return;
        }
        tweetUpdates.push({
            type: "user_block",
            since: new Date(),
            screen_name: user.screen_name,
            blocked: false,
        });
        blockedUsers = blockedUsers.filter(function(usr) {
            return usr.screen_name !== user.screen_name;
        });
    }

    function displayBlockedTweet(tweetId) {
        setTweetStatus(tweetId, {
            display: true
        });
    }

    function setRetweetDisplayStatus(status) {
        tweetUpdates.push({
            type: "retweet_display",
            since: new Date(),
            status: status
        });
    }

    function resourceUpdate(apiResource, updateFn, timer) {
        if (apiResources[apiResource].requestsRemaining > 0) {
            updateFn();
            timer = setTimeout(function() {
                resourceUpdate(apiResource, updateFn, timer);
            }, 5000);
        } else {
            timer = setTimeout(function() {
                apiResources[apiResource].requestsRemaining = 1;
                resourceUpdate(apiResource, updateFn, timer);
            }, apiResources[apiResource].resetTime - new Date().getTime());
        }
    }

    function loadTweets(tweets, type) {
        addTweetItem(tweets, type);
    }

    function getTweetStore() {
        return tweetStore;
    }

    function getTweetData(since, maxTweets) {
        since = since || new Date(0);
        var updateIdx = tweetUpdates.findIndex(function(update) {
            return update.since > since;
        });
        if (updateIdx === -1) {
            return {
                tweets: [],
                updates: [],
            };
        }
        var updates = tweetUpdates.slice(updateIdx);
        var newTweetUpdates = updates.filter(function(update) {
            return update.type === "new_tweets";
        });
        var tweets = [];
        if (newTweetUpdates.length > 0) {
            var minStartIdx = tweetStore.length - maxTweets > 0 ? tweetStore.length - maxTweets : 0;
            var startIdx = newTweetUpdates[0].startIdx < minStartIdx ?
                minStartIdx :
                newTweetUpdates[0].startIdx;
            tweets = tweetStore.slice(startIdx);
        }
        return {
            tweets: tweets,
            updates: updates,
        };
    }

    function tweetResourceGetter(resource, query) {
        return getTweetResource.bind(undefined, resource, query);
    }

    function getTweetResource(resource, query) {
        var last_id = apiResources[resource].since_id;
        if (last_id !== "0") {
            query.since_id = last_id;
        }
        client.get(resource, query, function(error, data, response) {
            if (!error) {
                apiResources[resource].requestsRemaining = response.headers["x-rate-limit-remaining"];
                apiResources[resource].resetTime = (Number(response.headers["x-rate-limit-reset"]) + 1) * 1000;
                if (data) {
                    apiResources[resource].addData(data);
                }
            } else {
                if (response && response.headers && response.headers["x-rate-limit-remaining"]) {
                    apiResources[resource].requestsRemaining = response.headers["x-rate-limit-remaining"];
                    apiResources[resource].resetTime = (Number(response.headers["x-rate-limit-reset"]) + 1) * 1000;
                } else {
                    apiResources[resource].requestsRemaining -= 1;
                }
                console.log(error);
            }
        });
    }

    function getApplicationRateLimits(callback) {
        var resourceNames = Object.keys(apiResources);
        var resourcePaths = [];
        resourceNames.forEach(function(resourceName) {
            if (resourcePaths.indexOf(apiResources[resourceName].basePath) === -1) {
                resourcePaths.push(apiResources[resourceName].basePath);
            }
        });
        var query = {
            resources: resourcePaths.join(","),
        };
        client.get("application/rate_limit_status", query, function(error, data, response) {
            var rateLimitData = {
                remaining: response.headers["x-rate-limit-remaining"],
                resetTime: (Number(response.headers["x-rate-limit-reset"]) + 1) * 1000,
            };
            if (data) {
                resourceNames.forEach(function(name) {
                    var resourceProfile = data.resources[apiResources[name].basePath]["/" + name];
                    apiResources[name].requestsRemaining = resourceProfile.remaining;
                    apiResources[name].resetTime = (resourceProfile.reset + 1) * 1000;
                });
            } else {
                throw new Error("Failed to get safe twitter rate limits.");
            }
            callback(rateLimitData);
        });
    }

    function loadEventConfig(location, callback) {
        fs.readFile(location, "utf8", function(err, data) {
            if (err) {
                console.log("Error reading event config file" + err);
            } else {
                try {
                    var loadedSpeakers = JSON.parse(data).speakers;
                    var loadTime = new Date();
                    loadedSpeakers.forEach(function(loadedSpeaker) {
                        tweetUpdates.push({
                            type: "speaker_update",
                            since: loadTime,
                            screen_name: loadedSpeaker,
                            operation: "add"
                        });
                        speakers.push(loadedSpeaker);
                    });
                    hashtags = JSON.parse(data).hashtags;
                    mentions = JSON.parse(data).mentions;
                    officialUsers = JSON.parse(data).officialUsers;
                } catch (err) {
                    console.log("Error parsing event config file" + err);
                }
            }
            callback();
        });
    }

    function addSpeaker(name) {
        tweetUpdates.push({
            type: "speaker_update",
            since: new Date(),
            screen_name: name,
            operation: "add"
        });
        speakers.push(name);
        writeToFile();
    }

    function removeSpeaker(name) {
        if (speakers.indexOf(name) > -1) {
            tweetUpdates.push({
                type: "speaker_update",
                since: new Date(),
                screen_name: name,
                operation: "remove"
            });
            speakers.splice(speakers.indexOf(name), 1);
            writeToFile();
        } else {
            console.log("ERROR : Speaker not found in the speakers list");
        }
    }

    function writeToFile() {
        fs.writeFile(eventConfigFile, JSON.stringify({
            "hashtags": hashtags,
            "mentions": mentions,
            "officialUsers": officialUsers,
            "speakers": speakers
        }), function(err) {
            if (err) {
                console.log("Error writing to event config file" + err);
            }
        });
    }

    function getSpeakers() {
        return speakers;
    }

};
