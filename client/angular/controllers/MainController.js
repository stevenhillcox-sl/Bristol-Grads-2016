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
                    splitTweetsIntoCategories($scope.tweets);
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
            tweets = tweets.sort(compare);
            for (var i = 0; i < tweets.length; i++) {
                if (!(tweets[i].deleted || tweets[i].blocked) || tweets[i].display) {
                    if (tweets[i].pinned) {
                        if ($scope.pinnedTweets.length < 4) {
                            $scope.pinnedTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            i--;
                        }
                    } else if (tweets[i].wallPriority) {
                        if ($scope.speakersTweets.length < 5) {
                            $scope.speakersTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            i--;
                        }
                    } else {
                        if ($scope.visitorsTweets.length < 5) {
                            $scope.visitorsTweets.push(tweets[i]);
                            tweets.splice(i, 1);
                            i--;
                        }
                    }
                }
            }
            if ($scope.speakersTweets.length < 5) {
                $scope.extraSpeakersTweets = tweets.slice(0, 5 - $scope.speakersTweets.length);
            }
            if ($scope.pinnedTweets.length < 4) {
                $scope.extraPinnedTweets = tweets.slice(0, 4 - $scope.pinnedTweets.length);
            }
        }

        function compare(a, b) {
            if (Date(a.created_at) < Date(b.created_at)) {
                return -1;
            }
            if (Date(a.created_at) > Date(b.created_at)) {
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
            return tweets;
        };
    }
})();
