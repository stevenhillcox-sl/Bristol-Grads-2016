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

        var tweetMargin = 12;

        $scope.tweets = [];
        $scope.tweetColumnList = [];
        vm.updates = [];

        // Ordering function such that newer tweets precede older tweets
        var chronologicalOrdering = function(tweetA, tweetB) {
            return new Date(tweetB.created_at).getTime() - new Date(tweetA.created_at).getTime();
        };
        var columnDataList = [
            new columnAssignmentService.ColumnData(4, function(tweet) {
                return tweet.pinned === true;
            }, chronologicalOrdering, 26),
            new columnAssignmentService.ColumnData(5, function(tweet) {
                return tweet.wallPriority === true;
            }, chronologicalOrdering, 0),
            new columnAssignmentService.ColumnData(5, function(tweet) {
                return true;
            }, chronologicalOrdering, 0),
        ];

        $scope.columnDataList = columnDataList;

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
            setTweetHeights($scope.displayColumns);
        }

        function setTweetHeights(tweetColumnList) {
            $scope.screenHeight = window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight;
            $scope.screenWidth = window.innerWidth ||
                document.documentElement.clientWidth ||
                document.body.clientWidth;
            tweetColumnList.forEach(function(tweetColumn, colIdx) {
                var baseHeight = (($scope.screenHeight - //the total screen height
                        (2 * tweetMargin * columnDataList[colIdx].slots) - //remove total size of margins between tweets
                        ($scope.screenHeight * (columnDataList[colIdx].extraContentSpacing * 0.01))) / //remove any extra space taken up by extra content
                    columnDataList[colIdx].slots); //divide the remaining avaliable space between slots
                tweetColumn.forEach(function(tweet) {
                    tweet.height = tweet.entities.media !== undefined ? ((baseHeight * 2) + (tweetMargin * 2)) : baseHeight;
                });
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

        $scope.hasImage = function(tweet) {
            return tweet.entities.media !== undefined;
        };
        $scope.getSize = function(text) {
            var size;
            var charCount = text.toString().split("").length;
            if (charCount < 85) {
                size = "x-large";
            } else if (charCount < 120) {
                size = "large";
            } else {
                size = "medium";
            }
            return {
                "font-size": size
            };
        };
        $scope.getTweetDimensions = function(tweet) {
            return {
                "height": tweet.height + "px",
                "margin-top": tweetMargin + "px",
                "margin-bottom": tweetMargin + "px",
                "margin-left": tweetMargin + "px",
                "margin-right": tweetMargin + "px"
            };
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
