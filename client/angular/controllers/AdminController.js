(function() {

    angular.module("TwitterWallApp").controller("AdminController", AdminController);

    AdminController.$inject = [
        "$scope",
        "adminDashDataService",
        "$sce",
        "tweetTextManipulationService",
        "$routeParams",
        "$interval",
    ];

    function AdminController(
        $scope, adminDashDataService, $sce, tweetTextManipulationService, $routeParams, $interval
    ) {
        var vm = this;
        $scope.loggedIn = false;
        $scope.ctrl = {};
        $scope.tweets = [];
        $scope.speakers = [];
        $scope.errorMessage = "";
        $scope.blockedUsers = [];

        $scope.visitorsTweets = [];
        $scope.speakersTweets = [];
        $scope.pinnedTweets = [];
        $scope.extraPinnedTweets = [];
        $scope.extraSpeakersTweets = [];

        $scope.setDeletedStatus = adminDashDataService.setDeletedStatus;
        $scope.setPinnedStatus = adminDashDataService.setPinnedStatus;
        $scope.addSpeaker = addSpeaker;
        $scope.removeSpeaker = removeSpeaker;

        $scope.displayBlockedTweet = adminDashDataService.displayBlockedTweet;

        $scope.getBlockedUsers = function() {
            adminDashDataService.blockedUsers().then(function(users) {
                $scope.blockedUsers = users;
            });
        };

        $scope.removeBlockedUser = function(user) {
            adminDashDataService.removeBlockedUser(user).then(function(result) {
                adminDashDataService.blockedUsers().then(function(users) {
                    $scope.blockedUsers = users;
                });
            });
        };

        $scope.addBlockedUser = function(name, screen_name) {
            adminDashDataService.addBlockedUser(name, screen_name).then(function(result) {
                adminDashDataService.blockedUsers().then(function(users) {
                    $scope.blockedUsers = users;
                });
            });
        };

        $scope.logOut = function() {
            adminDashDataService.logOut().then(function() {
                adminDashDataService.getAuthUri().then(function(uri) {
                    $scope.loginUri = uri;
                    $scope.loggedIn = false;
                });
            });
        };

        activate();

        function activate() {
            adminDashDataService.authenticate().then(function() {
                $scope.loggedIn = true;
                pageUpdate();
                $interval(pageUpdate, 500);
            }).catch(function() {
                adminDashDataService.getAuthUri().then(function(uri) {
                    if ($routeParams.status === "unauthorised") {
                        $scope.errorMessage = "This account is not authorised, please log in with an authorised account";
                    }
                    $scope.loginUri = uri;
                });
            });
        }

        function pageUpdate() {
            updateTweets();
            adminDashDataService.getSpeakers().then(function(speakers) {
                $scope.speakers = speakers;
            }).catch(function(err) {
                console.log("Could not get list of speakers:" + err);
            });
        }

        function updateTweets() {
            adminDashDataService.getTweets(vm.latestUpdateTime).then(function(results) {
                if (results.updates.length > 0) {
                    if (results.tweets.length > 0) {
                        results.tweets.forEach(function(tweet) {
                            tweet.text = $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
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

        function addSpeaker() {
            adminDashDataService.addSpeaker($scope.ctrl.speaker).then(function(result) {
                $scope.ctrl.speaker = "";
                return adminDashDataService.getSpeakers();
            }).then(function(speakers) {
                $scope.speakers = speakers;
            });
        }

        function removeSpeaker(speaker) {
            adminDashDataService.removeSpeaker(speaker).then(function(result) {
                return adminDashDataService.getSpeakers();
            }).then(function(speakers) {
                $scope.speakers = speakers;
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
            $scope.visitorsTweets = [];
            $scope.speakersTweets = [];
            $scope.pinnedTweets = [];
            $scope.extraPinnedTweets = [];
            $scope.extraSpeakersTweets = [];
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
                            pinnedCount += tweetCount;
                        }
                    } else if (tweets[i].wallPriority) {
                        if (speakersCount + tweetCount < 6) {
                            $scope.speakersTweets.push(tweets[i]);
                            speakersCount += tweetCount;
                        }
                    } else {
                        if (visitorsCount + tweetCount < 6) {
                            $scope.visitorsTweets.push(tweets[i]);
                            visitorsCount += tweetCount;
                        } else {
                            if (speakersCount + tweetCount < 6) {
                                $scope.extraSpeakersTweets.push(tweets[i]);
                                speakersCount += tweetCount;
                            } else if (pinnedCount + tweetCount < 5) {
                                $scope.extraPinnedTweets.push(tweets[i]);
                                pinnedCount += tweetCount;
                            }
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
