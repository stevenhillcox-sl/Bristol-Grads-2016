(function() {

    angular.module("TwitterWallApp").controller("AdminController", AdminController);

    AdminController.$inject = [
        "$scope",
        "adminDashDataService",
        "$sce",
        "$routeParams",
        "$interval",
    ];

    function AdminController(
        $scope, adminDashDataService, $sce, $routeParams, $interval
    ) {
        var vm = this;
        $scope.speakers = [];
        $scope.loggedIn = false;
        $scope.ctrl = {};
        $scope.errorMessage = "";
        $scope.blockedUsers = [];

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

        $scope.setDeletedStatus = adminDashDataService.setDeletedStatus;
        $scope.setPinnedStatus = adminDashDataService.setPinnedStatus;
        $scope.addSpeaker = addSpeaker;
        $scope.removeSpeaker = removeSpeaker;
        $scope.switch = false;
        $scope.hasChanged = false;
        $scope.isMobile = false; //initiate as false
        $scope.tab = 1;

        getDevice();

        $scope.changeTab = function(value) {
            $scope.tab = value;
        };

        function getDevice() {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                $scope.isMobile = true;
            }
        }

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

        $scope.toggleBlocked = function(name, screen_name, blocked) {
            if (blocked) {
                var user = {
                    name: name,
                    screen_name: screen_name
                };
                $scope.removeBlockedUser(user);
            } else {
                $scope.addBlockedUser(name, screen_name);
            }
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
                adminDashDataService.getSpeakers().then(function(speakers) {
                    $scope.speakers = speakers;
                }).catch(function(err) {
                    console.log("Could not get list of speakers:" + err);
                });
                $scope.loggedIn = true;
            }).catch(function() {
                adminDashDataService.getAuthUri().then(function(uri) {
                    if ($routeParams.status === "unauthorised") {
                        $scope.errorMessage = "This account is not authorised, please log in with an authorised account";
                    }
                    $scope.loginUri = uri;
                });
            });
        }

        $scope.check = function(value) {
            $scope.hasChanged = true;
            $scope.switch = !value;
        };

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
    }

})();
