describe("tweetTextManipulationService", function() {
    var tweetTextManipulationService;

    beforeEach(function() {
        angular.module("ngMaterial", []);
        angular.module("angularMoment", []);
        angular.module("ngSanitize", []);
        module("TwitterWallApp");
    });

    var truncatedTestTweet = {
        full_text: "Test tweet 1...",
        entities: {
            hashtags: [{
                text: "hello"
            }],
            user_mentions: [{
                screen_name: "bristech"
            }],
            urls: []
        },
        user: {
            name: "Test user 1",
            screen_name: "user1"
        },
        retweeted_status: {
            full_text: "untruncated Test tweet 1",
            user: {
                name: "Original Tweeter",
                screen_name: "original_tweeter"
            }
        }
    };

    beforeEach(inject(function(_tweetTextManipulationService_) {
        tweetTextManipulationService = _tweetTextManipulationService_;
    }));

    describe("On string manipulation", function() {
        it("gets the untruncated tweet text for retweets", function() {
            expect(tweetTextManipulationService.getUntruncatedText(truncatedTestTweet))
                .toEqual("RT @original_tweeter: untruncated Test tweet 1");
        });
        it("adds special html tag for displaying hashtags inside tweets", function() {
            expect(tweetTextManipulationService.addHashtag("#hello world", [{
                text: "hello"
            }])).toEqual("<b>#hello</b> world");
        });
        it("adds special html tag for displaying mentions inside tweets", function() {
            expect(tweetTextManipulationService.addMention("@hello world", [{
                screen_name: "hello"
            }])).toEqual("<b>@hello</b> world");
        });
        it("adds special html tag for displaying display urls inside tweets", function() {
            expect(tweetTextManipulationService.addDisplayUrls("www.hello world", [{
                url: "www.hello",
                display_url: "hell"
            }])).toEqual("<b>hell</b> world");
        });
        it("adds special html tag for displaying standard urls in tweets", function() {
            expect(tweetTextManipulationService.addUrls("www.hello world", [{
                url: "www.hello",
                display_url: "hell"
            }])).toEqual("<b>www.hello</b> world");
        });
        it("delete media urls inside tweets", function() {
            expect(tweetTextManipulationService.deleteMediaLink("www.hello world", [{
                url: "www.hello"
            }])).toEqual(" world");
        });
    });
});
