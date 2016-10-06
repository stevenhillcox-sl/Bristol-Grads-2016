describe("MainController", function() {

    var $testScope;
    var $q;
    var $interval;
    var twitterWallDataService;
    var tweetTextManipulationService;
    var MainController;

    var deferredGetTweetsResponse;

    var testSuccessResponse;
    var user1;
    var user2;
    var entities1;
    var entities2;
    var tweet1;
    var tweet2;
    var deletedTweet1;
    var blockedTweet2;
    var pinnedTweet1;
    var speakerTweet2;
    var testTweets;
    var testDeleteTweets;
    var testBlockedTweets;
    var testPinnedTweets;
    var testSpeakerTweets;
    var testTweetData;
    var testBlockedData;
    var testDeletedData;
    var testPinnedData;
    var testSpeakerData;

    var testUri;

    function initValues() {
        testSuccessResponse = {
            status: 200,
            statusText: "OK"
        };

        user1 = {
            name: "Test user 1",
            screen_name: "user1"
        };

        user2 = {
            name: "Test user 2",
            screen_name: "user2"
        };

        entities1 = {
            hashtags: [{
                text: "hello"
            }],
            user_mentions: [{
                screen_name: "bristech"
            }],
            urls: []
        };

        entities2 = {
            hashtags: [],
            user_mentions: [],
            urls: [{
                url: "www.google.com",
                display_url: "google.com"
            }]
        };

        tweet1 = {
            id_str: "1",
            text: "Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1
        };

        tweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2
        };

        deletedTweet1 = {
            id_str: "1",
            text: "Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            deleted: true,
        };

        blockedTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            blocked: true
        };

        pinnedTweet1 = {
            id_str: "1",
            text: "Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            pinned: true
        };

        speakerTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            wallPriority: true
        };

        testTweets = [tweet1, tweet2];
        testDeleteTweets = [deletedTweet1, tweet2];
        testBlockedTweets = [tweet1, blockedTweet2];
        testPinnedTweets = [pinnedTweet1, tweet2];
        testSpeakerTweets = [tweet1, speakerTweet2];

        testTweetData = {
            tweets: testTweets,
            updates: [{
                type: "new_tweets",
                since: new Date(),
                tag: "official",
                startIdx: 0,
            }]
        };

        testDeletedData = {
            tweets: [],
            updates: [{
                type: "tweet_status",
                since: new Date(),
                status: {
                    deleted: true
                },
                id: "1"
            }]
        };

        testBlockedData = {
            tweets: [],
            updates: [{
                type: "user_block",
                screen_name: "user2",
                name: "Test user 2",
                blocked: true,
            }]
        };

        testPinnedData = {
            tweets: [],
            updates: [{
                type: "tweet_status",
                since: new Date(),
                status: {
                    pinned: true
                },
                id: "1"
            }]
        };

        testSpeakerData = {
            tweets: [],
            updates: [{
                type: "speaker_update",
                since: new Date(),
                operation: "add",
                screen_name: user2.screen_name,
            }]
        };

        testUri = "http://googleLoginPage.com";
    }

    initValues();
    beforeEach(initValues);

    beforeEach(function() {
        angular.module("ngMaterial", []);
        angular.module("angularMoment", []);
        angular.module("ngSanitize", []);
        module("TwitterWallApp");
    });

    beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _$interval_) {
        $testScope = _$rootScope_.$new();
        $q = _$q_;
        $interval = _$interval_;
        twitterWallDataService = jasmine.createSpyObj("twitterWallDataService", [
            "getTweets",
        ]);
        tweetTextManipulationService = jasmine.createSpyObj("tweetTextManipulationService", [
            "updateTweet",
            "addHashtag",
            "addMention",
            "addUrl",
            "deleteMediaLink",
            "sortByDate",
        ]);

        deferredGetTweetsResponse = $q.defer();
        twitterWallDataService.getTweets.and.returnValue(deferredGetTweetsResponse.promise);

        MainController = _$controller_("MainController", {
            $scope: $testScope,
            twitterWallDataService: twitterWallDataService,
            tweetTextManipulationService: tweetTextManipulationService,
            $interval: $interval,
        });
    }));

    describe("On activation", function() {
        it("gets tweets and sets the local values", function() {
            deferredGetTweetsResponse.resolve(testTweetData);
            $testScope.$apply();
            expect(twitterWallDataService.getTweets).toHaveBeenCalled();
            expect($testScope.tweets).toEqual(testTweets);
        });
    });

    describe("New tweets", function() {
        beforeEach(function() {
            deferredGetTweetsResponse.resolve(testTweetData);
            $testScope.$apply();
        });
        it("appends new tweets received to the scope", function() {
            expect($testScope.tweets).toEqual(testTweets);
        });
        it("uses the tweet text manipulation service to format tweets for display", function() {
            expect(tweetTextManipulationService.updateTweet).toHaveBeenCalledTimes(testTweets.length);
            expect(tweetTextManipulationService.updateTweet.calls.allArgs()).toEqual(testTweets.map(function(tweet) {
                return [tweet];
            }));
        });
        it("sets the `latestUpdateTime` property equal to the time of the latest update received", function() {
            expect(MainController.latestUpdateTime).toEqual(testTweetData.updates[0].since);
        });
    });

    describe("Status updates", function() {
        describe("On old tweets", function() {
            beforeEach(function() {
                deferredGetTweetsResponse.resolve(testTweetData);
                $testScope.$apply();
                deferredGetTweetsResponse = $q.defer();
                twitterWallDataService.getTweets.and.returnValue(deferredGetTweetsResponse.promise);
                $interval.flush(500);
            });

            function getOldTweetTests(servedData, expectedTweets) {
                return function() {
                    beforeEach(function() {
                        deferredGetTweetsResponse.resolve(servedData);
                        $testScope.$apply();
                    });
                    it("updates tweets by adding the new status flag", function() {
                        expect($testScope.tweets).toEqual(expectedTweets);
                    });
                };
            }

            describe("Pinned tweets", getOldTweetTests(testPinnedData, testPinnedTweets));
            describe("Deleted tweets", getOldTweetTests(testDeletedData, testDeleteTweets));
            describe("Blocked tweets", getOldTweetTests(testBlockedData, testBlockedTweets));
            describe("Speaker tweets", getOldTweetTests(testSpeakerData, testSpeakerTweets));
        });

        describe("On new tweets", function() {
            var testSetup = function(serverData) {
                deferredGetTweetsResponse.resolve(serverData);
                $testScope.$apply();
                deferredGetTweetsResponse = $q.defer();
                twitterWallDataService.getTweets.and.returnValue(deferredGetTweetsResponse.promise);
                $interval.flush(500);
                deferredGetTweetsResponse.resolve(testTweetData);
                $testScope.$apply();
            };

            function getNewTweetTests(serverData, expectedTweets) {
                return function() {
                    beforeEach(function() {
                        deferredGetTweetsResponse.resolve(serverData);
                        $testScope.$apply();
                        deferredGetTweetsResponse = $q.defer();
                        twitterWallDataService.getTweets.and.returnValue(deferredGetTweetsResponse.promise);
                        $interval.flush(500);
                        deferredGetTweetsResponse.resolve(testTweetData);
                        $testScope.$apply();
                    });
                    it("updates tweets by adding the new status flag", function() {
                        expect($testScope.tweets).toEqual(expectedTweets);
                    });
                };
            }

            describe("Pinned tweets", getNewTweetTests(testPinnedData, testPinnedTweets));
            describe("Deleted tweets", getNewTweetTests(testDeletedData, testDeleteTweets));
            describe("Blocked tweets", getNewTweetTests(testBlockedData, testBlockedTweets));
            describe("Speaker tweets", getNewTweetTests(testSpeakerData, testSpeakerTweets));
        });
    });
});
