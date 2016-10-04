(function() {
    angular.module("TwitterWallApp").controller("MainController", MainController);

    MainController.$inject = [
        "$scope",
        "twitterWallDataService",
        "$sce",
        "tweetTextManipulationService",
        "$interval",
    ];

    function MainController($scope, twitterWallDataService, $sce, tweetTextManipulationService, $interval) {
        var vm = this;

        $scope.tweets = [];
        $scope.visitorsTweets = [];
        $scope.speakersTweets = [];
        $scope.pinnedTweets = [];
        $scope.extraPinnedTweets = [];
        $scope.extraSpeakersTweets = [];
        $scope.speakers = [];

        activate();

        function activate() {
            pageUpdate();
            $interval(pageUpdate, 500);
        }

        function pageUpdate() {
            updateTweets();
            twitterWallDataService.getSpeakers().then(function(speakers) {
                $scope.speakers = speakers;
            }).catch(function(err) {
                console.log("Could not get list of speakers:" + err);
            });
        }

        function updateTweets() {
            twitterWallDataService.getTweets(vm.latestUpdateTime).then(function(results) {
                if (results.updates.length > 0) {
                    if (results.tweets.length > 0) {
                        results.tweets.forEach(function(tweet) {
                            $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
                            if ($scope.speakers.indexOf(tweet.user.screen_name) !== -1) {
                                tweet.wallPriority = true;
                            }
                        });
                    }
                    $scope.tweets = $scope.tweets.concat(results.tweets);
                    vm.latestUpdateTime = results.updates[results.updates.length - 1].since;
                    $scope.tweets = $scope.setFlagsForTweets($scope.tweets, results.updates);
                }
            });
        }

        function find(arr, callback, thisArg) {
            for (var idx = 0; idx < arr.length; idx++) {
                if (callback.call(thisArg, arr[idx], idx, arr)) {
                    return arr[idx];
                }
            }
        }

        function splitTweetsIntoCategories(tweets) {
            var pinnedCount = 0;
            var visitorsCount = 0;
            var speakersCount = 0;
            var tweetCount;
            var i;
            for (i = 0; i < tweets.length; i++) {
                tweetCount = tweets[i].entities.media !== undefined ? 2 : 1;
                if (!(tweets[i].deleted || tweets[i].blocked) || tweets[i].display) {
                    if (tweets[i].pinned) {
                        if (pinnedCount + tweetCount < 5) {
                            $scope.pinnedTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            pinnedCount += tweetCount;
                            i--;
                        }
                    } else if (tweets[i].wallPriority) {
                        if (speakersCount + tweetCount < 6) {
                            $scope.speakersTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            speakersCount += tweetCount;
                            i--;
                        }
                    } else {
                        if (visitorsCount + tweetCount < 6) {
                            $scope.visitorsTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            visitorsCount += tweetCount;
                            i--;
                        }
                    }
                }
            }
            if (speakersCount < 6) {
                for (i = 0; i < 6 - speakersCount; i++) {
                    tweetCount = tweets[i].entities.media !== undefined ? 2 : 1;
                    if (!(tweets[i].deleted || tweets[i].blocked) || tweets[i].display || tweets[i].pinned) {
                        if (speakersCount + tweetCount < 6) {
                            $scope.extraSpeakersTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            speakersCount += tweetCount;
                            i--;
                        }
                    }
                }
            }
            if (pinnedCount < 5) {
                for (i = 0; i < 5 - pinnedCount; i++) {
                    tweetCount = tweets[i].entities.media !== undefined ? 2 : 1;
                    if (!(tweets[i].deleted || tweets[i].blocked) || tweets[i].display || tweets[i].wallPriority) {
                        if (pinnedCount + tweetCount < 5) {
                            $scope.extraPinnedTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            pinnedCount += tweetCount;
                            i--;
                        }
                    }
                }
            }
        }

        function compare(a, b) {
            if (new Date(a.created_at) > new Date(b.created_at)) {
                return -1;
            }
            if (new Date(a.created_at) < new Date(b.created_at)) {
                return 1;
            }
            return 0;
        }

        $scope.setFlagsForTweets = function(tweets, updates) {
            updates.forEach(function(update) {
                if (update.type === "tweet_status") {
                    var updatedTweet = find(tweets, function(tweet) {
                        return tweet.id_str === update.id;
                    });
                    if (updatedTweet) {
                        for (var prop in update.status) {
                            updatedTweet[prop] = update.status[prop];
                        }
                    }
                } else if (update.type === "user_block") {
                    tweets.forEach(function(tweet) {
                        if (tweet.user.screen_name === update.screen_name) {
                            tweet.blocked = update.blocked;
                        }
                    });
                } else if (update.type === "speaker_update") {
                    var wallPriority;
                    if (update.operation === "add") {
                        wallPriority = true;
                    } else if (update.operation === "remove") {
                        wallPriority = false;
                    }
                    tweets.forEach(function(tweet) {
                        if (tweet.user.screen_name === update.screen_name) {
                            tweet.wallPriority = wallPriority;
                        }
                        return tweet;
                    });
                }
            });
            tweets = tweets.sort(compare);
            splitTweetsIntoCategories(tweets);
            return tweets;
        };
    }
})();
