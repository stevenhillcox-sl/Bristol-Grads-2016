(function () {

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
        $scope.motd = "";
        $scope.speakers = [];
        $scope.errorMessage = "";

        $scope.deleteTweet = adminDashDataService.deleteTweet;

        $scope.sortByDate = tweetTextManipulationService.sortByDate;
        $scope.addSpeaker = addSpeaker;

        $scope.setMotd = function () {
            adminDashDataService.setMotd($scope.ctrl.motd).then(function (result) {
                $scope.ctrl.motd = "";
                return adminDashDataService.getMotd();
            }).then(function (motd) {
                $scope.motd = motd;
            });
        };

        $scope.logOut = function () {
            adminDashDataService.logOut().then(function () {
                adminDashDataService.getAuthUri().then(function(uri) {
                    $scope.loginUri = uri;
                    $scope.loggedIn = false;
                });
            });
        };

        activate();

        function activate() {
            adminDashDataService.authenticate().then(function () {
                $scope.loggedIn = true;
                pageUpdate();
                $interval(pageUpdate, 5000);
            }).catch(function () {
                adminDashDataService.getAuthUri().then(function (uri) {
                    if ($routeParams.status === "unauthorised") {
                        $scope.errorMessage = "This account is not authorised, please log in with an authorised account";
                    }
                    $scope.loginUri = uri;
                });
            });
        }

        function pageUpdate() {
            updateTweets();
            adminDashDataService.getMotd().then(function (motd) {
                $scope.motd = motd;
            });
            adminDashDataService.getSpeakers().then(function (speakers) {
                $scope.speakers = speakers;
            });
        }

        function updateTweets() {
            adminDashDataService.getTweets(vm.latestUpdateTime).then(function (results) {
                if (results.updates.length > 0) {
                    if (results.tweets.length > 0) {
                        results.tweets.forEach(function (tweet) {
                            tweet.text = $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
                        });
                    }
                    $scope.tweets = $scope.tweets.concat(results.tweets);
                    vm.latestUpdateTime = results.updates[results.updates.length - 1].since;
                    $scope.tweets = setDeletedFlagForDeletedTweets($scope.tweets, results.updates);
                }
            });
        }

        function addSpeaker() {
            adminDashDataService.addSpeaker($scope.ctrl.speaker).then(function (result) {
                $scope.ctrl.speaker = "";
                return adminDashDataService.getSpeakers();
            }).then(function (speakers) {
                $scope.speakers = speakers;
            });
        }

        function setDeletedFlagForDeletedTweets(tweets, updates) {
            updates.forEach(function(del) {
                if (del.type === "tweet_status" && del.status.deleted) {
                    tweets.forEach(function(tweet) {
                        if (tweet.id_str === del.id) {
                            tweet.deleted = true;
                        }
                    });
                }
            });
            return tweets;
        }
    }
})();
