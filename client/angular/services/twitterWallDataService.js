(function() {
    angular
        .module("TwitterWallApp")
        .factory("twitterWallDataService", twitterWallDataService);

    twitterWallDataService.$inject = ["$http"];

    function twitterWallDataService($http) {
        return {
            getTweets: getTweets,
        };

        function getTweets(since) {
            var query = {};
            if (since) {
                query.since = since;
            }
            return $http.get("/api/tweets", {
                params: query
            }).then(function(result) {
                return result.data;
            });
        }
    }

})();
