(function () {

    angular.module("TwitterWallApp").controller("AdminController", AdminController);

    AdminController.$inject = ["$scope", "adminDashDataService", "$sce", "tweetTextManipulationService", "$routeParams"];

    function AdminController($scope, adminDashDataService, $sce, tweetTextManipulationService, $routeParams) {
        $scope.loggedIn = false;
        $scope.ctrl = {};
        $scope.tweets = [];
        $scope.motd = "";
        $scope.errorMessage = "";

        $scope.deleteTweet = adminDashDataService.deleteTweet;

        adminDashDataService.authenticate().then(function () {
            $scope.loggedIn = true;
        }, function () {
            adminDashDataService.getAuthUri().then(function (uri) {
                if ($routeParams.status) {
                    $scope.errorMessage = "This account is not authorised, please log in with an authorised account";
                }
                $scope.loginUri = uri;
            });
        });

        adminDashDataService.getTweets().then(function (tweets) {
            $scope.tweets = tweets;
            if ($scope.tweets.length > 0) {
                $scope.tweets.forEach(function (tweet) {
                    tweet.text = $sce.trustAsHtml(tweetTextManipulationService.updateTweet(tweet));
                });
            }
        });

        adminDashDataService.getMotd().then(function (motd) {
            $scope.motd = motd;
        });

        $scope.setMotd = function () {
            adminDashDataService.setMotd($scope.ctrl.motd).then(function (result) {
                $scope.ctrl.motd = "";
                adminDashDataService.getMotd().then(function (motd) {
                    $scope.motd = motd;
                });
            });
        };
    }
})();
