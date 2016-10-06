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

        // arrays to visualise in the 3 columns -> cut off to fit the page
        $scope.visitorsTweets = [];
        $scope.speakersTweets = [];
        $scope.pinnedTweets = [];

        // all tweets in that cathegory -> without a cut off
        $scope.allVisitorsTweets = [];
        $scope.allSpeakersTweets = [];
        $scope.allPinnedTweets = [];

        $scope.extraPinnedTweets = [];
        $scope.extraSpeakersTweets = [];

        $scope.speakers = [];
        vm.updates = [];

        activate();

        function activate() {
            updateTweets();
            $interval(updateTweets, 500);
        }

        function updateTweets() {
            twitterWallDataService.getTweets(vm.latestUpdateTime).then(function(results) {
                if (results.updates.length > 0 || $scope.hasChanged) {
                    if (results.tweets.length > 0) {
                        results.tweets.forEach(function(tweet) {
                            $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
                            if ($scope.speakers.indexOf(tweet.user.screen_name) !== -1) {
                                tweet.wallPriority = true;
                                addToSpeakers(tweet);
                            } else {
                                addToVisitors(tweet);
                            }
                        });
                    }
                    if (results.updates.length > 0) {
                        vm.updates = vm.updates.concat(results.updates);
                        vm.latestUpdateTime = results.updates[results.updates.length - 1].since;
                    }
                    setFlagsForTweets(vm.updates);
                }
            });
        }

        function setStatusForArray(array, update, prop, found) {
            var i;
            for (i = 0; i < array.length && found === false; i++) {
                var tweet = array[i];
                if (tweet.id_str === update.id) {
                    tweet[prop] = update.status[prop];
                    if (prop === "pinned" && update.status[prop] === true) {
                        addToPinned(tweet);
                        array.splice(i, 1);
                        found = true;
                    } else if (prop === "pinned" && update.status[prop] === false) {
                        if (tweet.wallPriority) {
                            addToSpeakers(tweet);
                        } else {
                            addToVisitors(tweet);
                        }
                        array.splice(i, 1);
                        found = true;
                    }
                }
            }
            return {
                tweets: array,
                found: found
            };
        }

        function setStatus(update) {
            for (var prop in update.status) {
                var found = false;
                var result;

                result = setStatusForArray($scope.allVisitorsTweets, update, prop, found);
                found = result.found;
                $scope.allVisitorsTweets = result.tweets;

                result = setStatusForArray($scope.allSpeakersTweets, update, prop, found);
                found = result.found;
                $scope.allSpeakersTweets = result.tweets;

                result = setStatusForArray($scope.allPinnedTweets, update, prop, found);
                found = result.found;
                $scope.allPinnedTweets = result.tweets;
            }
        }

        function updateSpeaker(update, value) {
            var tweet;
            var i;
            if (value) {
                for (i = 0; i < $scope.allVisitorsTweets.length; i++) {
                    tweet = $scope.allVisitorsTweets[i];
                    if (tweet.user.screen_name === update.screen_name) {
                        tweet.wallPriority = value;
                        addToSpeakers(tweet);
                        $scope.allVisitorsTweets.splice(i, 1);
                        i--;
                    }
                }
                for (i = 0; i < $scope.allPinnedTweets.length; i++) {
                    tweet = $scope.allPinnedTweets[i];
                    if (tweet.user.screen_name === update.screen_name) {
                        tweet.wallPriority = value;
                        addToSpeakers(tweet);
                        $scope.allPinnedTweets.splice(i, 1);
                        i--;
                    }
                }
            } else {
                for (i = 0; i < $scope.allSpeakersTweets.length; i++) {
                    tweet = $scope.allSpeakersTweets[i];
                    if (tweet.user.screen_name === update.screen_name) {
                        tweet.wallPriority = value;
                        if (tweet.pinned) {
                            addToPinned(tweet);
                        } else {
                            addToVisitors(tweet);
                        }
                        $scope.allSpeakersTweets.splice(i, 1);
                        i--;
                    }
                }
            }
        }

        function blockUser(update) {
            $scope.allVisitorsTweets.forEach(function(tweet) {
                if (tweet.user.screen_name === update.screen_name) {
                    tweet.blocked = update.blocked;
                }
            });
            $scope.allPinnedTweets.forEach(function(tweet) {
                if (tweet.user.screen_name === update.screen_name) {
                    tweet.blocked = update.blocked;
                }
            });
            $scope.allSpeakersTweets.forEach(function(tweet) {
                if (tweet.user.screen_name === update.screen_name) {
                    tweet.blocked = update.blocked;
                }
            });
        }

        function addToSpeakers(tweet) {
            $scope.allSpeakersTweets.push(tweet);
        }

        function addToVisitors(tweet) {
            $scope.allVisitorsTweets.push(tweet);
        }

        function addToPinned(tweet) {
            $scope.allPinnedTweets.push(tweet);
        }

        function splitTweetsIntoCategories() {
            var result;
            var countVisitors = 0;
            var countSpeakers = 0;
            var countPinned = 0;

            $scope.visitorsTweets = [];
            $scope.speakersTweets = [];
            $scope.pinnedTweets = [];

            $scope.extraPinnedTweets = [];
            $scope.extraSpeakersTweets = [];

            result = cutOffArray($scope.allSpeakersTweets, 6);
            $scope.speakersTweets = result.tweets;
            countSpeakers = result.count;

            result = cutOffArray($scope.allPinnedTweets, 5);
            $scope.pinnedTweets = result.tweets;
            countPinned = result.count;

            cutOffVisitorsAndFillEmptySpace(countVisitors, countSpeakers, countPinned);

        }

        function cutOffVisitorsAndFillEmptySpace(countVisitors, countSpeakers, countPinned) {
            $scope.allVisitorsTweets = $scope.allVisitorsTweets.sort(compare);
            $scope.allVisitorsTweets.forEach(function(tweet) {
                var tweetCount = tweet.entities.media !== undefined ? 2 : 1;
                tweetCount = ((tweet.deleted || tweet.blocked) && !tweet.display) ? 0 : tweetCount;
                if (!(tweet.deleted || tweet.blocked) || tweet.display || $scope.switch) {
                    if (tweetCount + countVisitors < 6) {
                        $scope.visitorsTweets.push(tweet);
                        countVisitors += tweetCount;
                    } else if (tweetCount + countPinned < 5) {
                        $scope.extraPinnedTweets.push(tweet);
                        countPinned += tweetCount;
                    } else if (tweetCount + countSpeakers < 6) {
                        $scope.extraSpeakersTweets.push(tweet);
                        countSpeakers += tweetCount;
                    }
                }
            });
        }

        function cutOffArray(array, maxCount) {
            var tweetCount;
            var count = 0;
            var newArray = [];
            array = array.sort(compare);
            array.forEach(function(tweet) {
                tweetCount = tweet.entities.media !== undefined ? 2 : 1;
                tweetCount = ((tweet.deleted || tweet.blocked) && !tweet.display) ? 0 : tweetCount;
                if (tweetCount + count < maxCount) {
                    if (!(tweet.deleted || tweet.blocked) || tweet.display || $scope.switch) {
                        newArray.push(tweet);
                        count += tweetCount;
                    }
                } else {
                    return newArray;
                }
            });
            return {
                tweets: newArray,
                count: count
            };
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

        function setFlagsForTweets(updates) {
            updates.forEach(function(update) {
                if (update.type === "tweet_status") {
                    setStatus(update);
                } else if (update.type === "user_block") {
                    blockUser(update);
                } else if (update.type === "speaker_update") {
                    if (update.operation === "add") {
                        updateSpeaker(update, true);
                    } else if (update.operation === "remove") {
                        updateSpeaker(update, false);
                    }
                }
            });
            splitTweetsIntoCategories();
        }
    }
})();
