(function() {
    angular
        .module("TwitterWallApp")
        .factory("tweetTextManipulationService", tweetTextManipulationService);

    function tweetTextManipulationService() {
        return {
            updateTweet: updateTweet,
            getUntruncatedText: getUntruncatedText,
            addHashtag: addHashtag,
            addMention: addMention,
            addDisplayUrls: addDisplayUrls,
            addUrls: addUrls,
            deleteMediaLink: deleteMediaLink,
        };

        function updateTweet(tweet) {
            if (tweet.retweeted_status) {
                tweet.text = getUntruncatedText(tweet);
                tweet.entities = tweet.retweeted_status.entities;
                tweet.truncated = tweet.retweeted_status.truncated;
            }
            tweet.text = addHashtag(tweet.text, tweet.entities.hashtags);
            tweet.text = addMention(tweet.text, tweet.entities.user_mentions);
            if (tweet.truncated) {
                tweet.text = addUrls(tweet.text, tweet.entities.urls);
            } else {
                tweet.text = addDisplayUrls(tweet.text, tweet.entities.urls);
            }

            if (tweet.entities.media) {
                tweet.text = deleteMediaLink(tweet.text, tweet.entities.media);
            }
            return tweet.text;
        }

        function getUntruncatedText(tweet) {
            if (tweet.retweeted_status) {
                return "RT @" + tweet.retweeted_status.user.screen_name + ": " + tweet.retweeted_status.text;
            } else {
                return tweet.text;
            }
        }

        function addHashtag(str, hashtags) {
            hashtags.forEach(function(hashtag) {
                var substr = hashtag.text;
                str = str.split("#" + substr).join("<b>#" + substr + "</b>");
            });
            return str;
        }

        function addMention(str, mentions) {
            mentions.forEach(function(mention) {
                var substr = mention.screen_name;
                var match = new RegExp("@" + substr, "i");
                str = str.split(match).join("<b>@" + substr + "</b>");
            });
            return str;
        }

        function addDisplayUrls(str, urls) {
            urls.forEach(function(uri) {
                var substr = uri.url;
                str = str.split(substr).join("<b>" + uri.display_url + "</b>");
            });
            return str;
        }

        function addUrls(str, urls) {
            urls.forEach(function(uri) {
                var substr = uri.url;
                str = str.split(substr).join("<b>" + substr + "</b>");
            });
            return str;
        }

        function deleteMediaLink(str, media) {
            media.forEach(function(m) {
                str = str.split(m.url).join("");
            });
            return str;
        }

    }

})();
