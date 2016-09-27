(function () {
    angular.module("TwitterWallApp", ["angularMoment", "ngSanitize", "ngMaterial", "ngRoute"])
    .filter("left", function () {
        return function (tweets) {
            return tweets.filter (function (tweet) {
                return tweet.wallTag === "official";
            });

        };
    })
    .filter("middle", function () {
        return function (tweets) {
            var filtered = [];
            for (var i = 0; i < tweets.length; i++) {
                var tweet = tweets[i];
                if (Number(tweet.id_str.charAt(15)) < 5 && tweet.wallTag !== "official") {
                    filtered.push(tweet);
                }
            }
            return filtered;
        };
    })
    .filter("right", function () {
        return function (tweets) {
            var filtered = [];
            for (var i = 0; i < tweets.length; i++) {
                var tweet = tweets[i];
                if (Number(tweet.id_str.charAt(15))  >= 5 && tweet.wallTag !== "official") {
                    filtered.push(tweet);
                }
            }
            return filtered;
        };
    });

})();
