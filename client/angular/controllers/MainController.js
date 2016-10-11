(function() {
    angular.module("TwitterWallApp").controller("MainController", MainController);

    MainController.$inject = [
        "$scope",
        "twitterWallDataService",
        "$sce",
        "tweetTextManipulationService",
        "columnAssignmentService",
        "$interval",
    ];

    function MainController($scope, twitterWallDataService, $sce, tweetTextManipulationService, columnAssignmentService, $interval) {
        var vm = this;

        $scope.displayColumns = [
            [],
            [],
            []
        ];
        $scope.tweets = [];
        vm.updates = [];

        // Ordering function such that newer tweets precede older tweets
        var chronologicalOrdering = function(tweetA, tweetB) {
            return new Date(tweetB.created_at).getTime() - new Date(tweetA.created_at).getTime();
        };
        var columnDataList = [
            new columnAssignmentService.ColumnData(5, function(tweet) {
                return tweet.pinned === true;
            }, chronologicalOrdering),
            new columnAssignmentService.ColumnData(6, function(tweet) {
                return tweet.wallPriority === true;
            }, chronologicalOrdering),
            new columnAssignmentService.ColumnData(6, function(tweet) {
                return true;
            }, chronologicalOrdering),
        ];

        activate();

        function activate() {
            updateTweets();
            $interval(updateTweets, 500);
            $interval(updateInteractions, 5000);
        }

        function updateTweets() {
            twitterWallDataService.getTweets(vm.latestUpdateTime).then(function(results) {
                if (results.updates.length > 0) {
                    var newTweets = [];
                    if (results.tweets.length > 0) {
                        results.tweets.forEach(function(tweet) {
                            $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
                        });
                        newTweets = $scope.setFlagsForTweets(results.tweets, vm.updates);
                    }
                    $scope.tweets = $scope.tweets.concat(newTweets);
                    vm.latestUpdateTime = results.updates[results.updates.length - 1].since;
                    $scope.tweets = $scope.setFlagsForTweets($scope.tweets, results.updates);
                    vm.updates = vm.updates.concat(results.updates);
                    displayTweets($scope.tweets, columnDataList);
                }
            });
        }

        function updateInteractions() {
            var visibleTweets = [];
            $scope.displayColumns.forEach(function(column) {
                column.forEach(function(tweet) {
                    visibleTweets.push({
                        id_str: tweet.id_str,
                        favorite_count: tweet.favorite_count,
                        retweet_count: tweet.retweet_count
                    });
                });
            });
            twitterWallDataService.updateInteractions(JSON.stringify(visibleTweets)).then(function(results) {
                if (results) {
                    results.favourites.forEach(function(favouriteUpdate) {
                        var updatedTweet = $scope.tweets.find(function(tweet) {
                            return tweet.id_str === favouriteUpdate.id;
                        });
                        updatedTweet.favorite_count = favouriteUpdate.value;
                    });
                    results.retweets.forEach(function(retweetUpdate) {
                        var updatedTweet = $scope.tweets.find(function(tweet) {
                            return tweet.id_str === retweetUpdate.id;
                        });
                        updatedTweet.retweet_count = retweetUpdate.value;
                    });
                }
            });
        }

        function displayTweets(tweets, columnDataList) {
            var assignedColumns = columnAssignmentService.assignColumns(tweets, columnDataList);
            var sortedColumns = columnAssignmentService.sortColumns(assignedColumns, columnDataList);
            var backfilledColumns = columnAssignmentService.backfillColumns(sortedColumns, columnDataList);
            $scope.displayColumns = backfilledColumns;
        }

        $scope.setFlagsForTweets = function(tweets, updates) {
            updates.forEach(function(update) {
                if (update.type === "tweet_status") {
                    var updatedTweet = tweets.find(function(tweet) {
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
                } else if (update.type === "retweet_display") {
                    tweets.forEach(function(tweet) {
                        switch (update.status) {
                            case "all":
                                tweet.hide_retweet = false;
                                break;
                            case "bristech_only":
                                tweet.hide_retweet = (tweet.retweeted_status && (tweet.user.screen_name !== "bristech")) ? true : false;
                                break;
                            case "none":
                                tweet.hide_retweet = tweet.retweeted_status ? true : false;
                                break;
                            default:
                                tweet.hide_retweet = false;
                                break;
                        }
                    });
                }
            });
            return tweets;
        };

        if (!Array.prototype.find) {
            Array.prototype.find = function(predicate) {
                "use strict";
                if (this === null) {
                    throw new TypeError("Array.prototype.find called on null or undefined");
                }
                if (typeof predicate !== "function") {
                    throw new TypeError("predicate must be a function");
                }
                var list = Object(this);
                var length = list.length >>> 0;
                var thisArg = arguments[1];
                var value;

                for (var i = 0; i < length; i++) {
                    value = list[i];
                    if (predicate.call(thisArg, value, i, list)) {
                        return value;
                    }
                }
                return undefined;
            };
        }
    }
})();
