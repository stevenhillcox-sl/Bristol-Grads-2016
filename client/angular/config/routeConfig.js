angular.module("TwitterWallApp").config(["$routeProvider", "$locationProvider",
    function($routeProvider, $locationProvider) {
        $routeProvider
            .when("/", {
                templateUrl: "/templates/clientTweetWall.html",
                controller: "MainController"
            })
            .when("/dash", {
                templateUrl: "/templates/adminTweetWall.html",
                controller: "AdminController"

            })
            .when("/dash/:status", {
                templateUrl: "/templates/adminTweetWall.html",
                controller: "AdminController"

            })
            .otherwise({
                templateUrl: "/templates/clientTweetWall.html",
                controller: "MainController"
            });
    }
]);
