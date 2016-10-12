describe("MainController", function() {

    var $window;
    var $document;
    var $testScope;
    var $q;
    var $interval;
    var twitterWallDataService;
    var tweetTextManipulationService;
    var columnAssignmentService;
    var MainController;

    var deferredGetTweetsResponse;
    var deferredUpdateInteractionsResponse;

    var testSuccessResponse;
    var user1;
    var user2;
    var entities1;
    var entities2;
    var tweet1;
    var tweet2;
    var sizedTweet1;
    var sizedTweet2;
    var deletedTweet1;
    var favouritedTweet1;
    var blockedTweet2;
    var retweetedTweet2;
    var pinnedTweet1;
    var speakerTweet2;
    var retweetedTweet1;
    var interactedTweet2;
    var testTweets;
    var testInteractedTweets;
    var testDeleteTweets;
    var testBlockedTweets;
    var testPinnedTweets;
    var testSpeakerTweets;
    var testRetweetDisplayTweets;
    var testTweetData;
    var testBlockedData;
    var testDeletedData;
    var testPinnedData;
    var testSpeakerData;
    var testRetweetDisplayData;
    var testAssignedColumns;
    var testSortedColumns;
    var testBackfilledColumns;

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
            text: "RT Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            retweeted_status: {
                id_str: "5",
                text: "Test tweet 1 #hello @bristech",
                entities: entities1,
                user: user2,
            },
            favorite_count: 0,
            retweet_count: 0
        };

        tweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            favorite_count: 0,
            retweet_count: 0,
        };

        sizedTweet1 = {
            id_str: "1",
            text: "RT Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            retweeted_status: {
                id_str: "5",
                text: "Test tweet 1 #hello @bristech",
                entities: entities1,
                user: user2,
            },
            favorite_count: 0,
            retweet_count: 0,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        sizedTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            favorite_count: 0,
            retweet_count: 0,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        deletedTweet1 = {
            id_str: "1",
            text: "RT Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            retweeted_status: {
                id_str: "5",
                text: "Test tweet 1 #hello @bristech",
                entities: entities1,
                user: user2,
            },
            favorite_count: 0,
            retweet_count: 0,
            deleted: true,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        favouritedTweet1 = {
            id_str: "1",
            text: "RT Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            retweeted_status: {
                id_str: "5",
                text: "Test tweet 1 #hello @bristech",
                entities: entities1,
                user: user2,
            },
            favorite_count: 100,
            retweet_count: 0,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        blockedTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            favorite_count: 0,
            retweet_count: 0,
            blocked: true,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        interactedTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            favorite_count: 0,
            retweet_count: 50,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        pinnedTweet1 = {
            id_str: "1",
            text: "RT Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            retweeted_status: {
                id_str: "5",
                text: "Test tweet 1 #hello @bristech",
                entities: entities1,
                user: user2,
            },
            favorite_count: 0,
            retweet_count: 0,
            pinned: true,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        speakerTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            favorite_count: 0,
            retweet_count: 0,
            wallPriority: true,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        retweetedTweet1 = {
            id_str: "1",
            text: "RT Test tweet 1 #hello @bristech",
            entities: entities1,
            user: user1,
            retweeted_status: {
                id_str: "5",
                text: "Test tweet 1 #hello @bristech",
                entities: entities1,
                user: user2,
            },
            favorite_count: 0,
            retweet_count: 0,
            hide_retweet: true,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        retweetedTweet2 = {
            id_str: "2",
            text: "Test tweet 2 www.google.com",
            entities: entities2,
            user: user2,
            favorite_count: 0,
            retweet_count: 0,
            hide_retweet: false,
            displayHeightPx: jasmine.any(Number),
            displayWidthPx: jasmine.any(Number),
        };

        testTweets = [tweet1, tweet2];
        testDeleteTweets = [deletedTweet1, sizedTweet2];
        testBlockedTweets = [sizedTweet1, blockedTweet2];
        testPinnedTweets = [pinnedTweet1, sizedTweet2];
        testSpeakerTweets = [sizedTweet1, speakerTweet2];
        testRetweetDisplayTweets = [retweetedTweet1, retweetedTweet2];
        testInteractedTweets = [favouritedTweet1, interactedTweet2];

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

        testRetweetDisplayData = {
            tweets: [],
            updates: [{
                type: "retweet_display",
                since: new Date(),
                status: "none"
            }]
        };

        testAssignedColumns = [
            [],
            [],
            [tweet1, tweet2],
        ];
        testSortedColumns = [
            [],
            [],
            [tweet2, tweet1],
        ];
        testBackfilledColumns = [
            [],
            [tweet1],
            [tweet2],
        ];

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

    beforeEach(inject(function(_$rootScope_, _$controller_, _$q_, _$interval_, _$window_, _$document_) {
        $window = _$window_;
        $document = _$document_;
        $window.innerHeight = 500;
        $window.innerWidth = 500;
        $testScope = _$rootScope_.$new();
        $q = _$q_;
        $interval = _$interval_;
        twitterWallDataService = jasmine.createSpyObj("twitterWallDataService", [
            "getTweets",
            "updateInteractions",
        ]);
        tweetTextManipulationService = jasmine.createSpyObj("tweetTextManipulationService", [
            "updateTweet",
            "addHashtag",
            "addMention",
            "addUrl",
            "deleteMediaLink",
            "sortByDate",
        ]);
        columnAssignmentService = jasmine.createSpyObj("columnAssignmentService", [
            "ColumnData",
            "assignColumns",
            "sortColumns",
            "backfillColumns",
        ]);

        deferredGetTweetsResponse = $q.defer();
        deferredUpdateInteractionsResponse = $q.defer();
        twitterWallDataService.getTweets.and.returnValue(deferredGetTweetsResponse.promise);
        twitterWallDataService.updateInteractions.and.returnValue(deferredUpdateInteractionsResponse.promise);
        columnAssignmentService.assignColumns.and.returnValue(testAssignedColumns);
        columnAssignmentService.sortColumns.and.returnValue(testSortedColumns);
        columnAssignmentService.backfillColumns.and.returnValue(testBackfilledColumns);
        columnAssignmentService.ColumnData.and.callFake(function(slots, selector, ordering, extraContentSpacing) {
            this.ordering = ordering;
            this.selector = selector;
            this.slots = slots;
            this.extraContentSpacing = extraContentSpacing;
        });

        MainController = _$controller_("MainController", {
            $scope: $testScope,
            twitterWallDataService: twitterWallDataService,
            tweetTextManipulationService: tweetTextManipulationService,
            columnAssignmentService: columnAssignmentService,
            $interval: $interval,
            $window: $window,
            $document: $document,
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
            $interval.flush(100);
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
    });

    describe("Status updates", function() {
        describe("With all updates", function() {
            beforeEach(function() {
                deferredGetTweetsResponse.resolve(testTweetData);
                $testScope.$apply();
                $interval.flush(100);
            });

            it("sets the `latestUpdateTime` property equal to the time of the latest update received", function() {
                expect(MainController.latestUpdateTime).toEqual(testTweetData.updates[0].since);
            });

            it("processes tweets using the columnAssignmentService and outputs the results", function() {
                expect(columnAssignmentService.assignColumns).toHaveBeenCalledWith($testScope.tweets, jasmine.any(Array));
                expect(columnAssignmentService.sortColumns).toHaveBeenCalledWith(testAssignedColumns, jasmine.any(Array));
                expect(columnAssignmentService.backfillColumns).toHaveBeenCalledWith(testSortedColumns, jasmine.any(Array));
                expect($testScope.displayColumns).toEqual(testBackfilledColumns);
            });
        });

        describe("On old tweets", function() {
            beforeEach(function() {
                deferredGetTweetsResponse.resolve(testTweetData);
                $testScope.$apply();
                $interval.flush(100);
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
            describe("Retweet display", getOldTweetTests(testRetweetDisplayData, testRetweetDisplayTweets));
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
            describe("Retweet display", getNewTweetTests(testRetweetDisplayData, testRetweetDisplayTweets));
        });
    });

    describe("update interactions", function() {

        var response = {
            favourites: [{
                id: "1",
                value: 100
            }],
            retweets: [{
                id: "2",
                value: 50
            }]
        };

        beforeEach(function() {
            deferredGetTweetsResponse.resolve(testTweetData);
            $testScope.$apply();
            deferredGetTweetsResponse = $q.defer();
            twitterWallDataService.getTweets.and.returnValue(deferredGetTweetsResponse.promise);
            deferredGetTweetsResponse.resolve({
                tweets: [],
                updates: []
            });
            $testScope.$apply();
            $interval.flush(5000);
            deferredUpdateInteractionsResponse.resolve(response);
            $testScope.$apply();
        });

        it("updates favourite and retweet counts", function() {
            expect($testScope.tweets).toEqual(testInteractedTweets);
        });

    });

    describe("adminView", function() {
        it("should perform an update when switching between admin and user views", function() {
            deferredGetTweetsResponse.resolve(testTweetData);
            $testScope.$apply();
            $interval.flush(100);
            expect(columnAssignmentService.assignColumns).toHaveBeenCalledTimes(1);
            expect(columnAssignmentService.sortColumns).toHaveBeenCalledTimes(1);
            expect(columnAssignmentService.backfillColumns).toHaveBeenCalledTimes(1);
            $testScope.$apply();
            $interval.flush(100);
            expect(columnAssignmentService.assignColumns).toHaveBeenCalledTimes(1);
            expect(columnAssignmentService.sortColumns).toHaveBeenCalledTimes(1);
            expect(columnAssignmentService.backfillColumns).toHaveBeenCalledTimes(1);
            $testScope.adminView = true;
            $testScope.$apply();
            $interval.flush(100);
            expect(columnAssignmentService.assignColumns).toHaveBeenCalledTimes(2);
            expect(columnAssignmentService.sortColumns).toHaveBeenCalledTimes(2);
            expect(columnAssignmentService.backfillColumns).toHaveBeenCalledTimes(2);
            $testScope.adminView = false;
            $testScope.$apply();
            $interval.flush(100);
            expect(columnAssignmentService.assignColumns).toHaveBeenCalledTimes(3);
            expect(columnAssignmentService.sortColumns).toHaveBeenCalledTimes(3);
            expect(columnAssignmentService.backfillColumns).toHaveBeenCalledTimes(3);
        });

        it("should display columns without backfilling when using the admin view", function() {
            deferredGetTweetsResponse.resolve(testTweetData);
            $testScope.adminView = false;
            $testScope.$apply();
            $interval.flush(100);
            expect($testScope.displayColumns).toEqual(testBackfilledColumns);
            $testScope.adminView = true;
            $testScope.$apply();
            $interval.flush(100);
            expect($testScope.displayColumns).toEqual(testSortedColumns);
        });
    });

    describe("setTweetDimensions", function() {
        beforeEach(function() {
            deferredGetTweetsResponse.resolve(testTweetData);
            $testScope.$apply();
        });

        it("should assign a numerical value to the displayHeightPx property of each tweet", function() {
            $testScope.tweets.forEach(function(tweet) {
                expect(tweet.displayHeightPx).toBeUndefined();
            });
            $interval.flush(100);
            $testScope.tweets.forEach(function(tweet) {
                expect(tweet.displayHeightPx).toEqual(jasmine.any(Number));
            });
        });

        it("should assign a numerical value to the displayWidthPx property of each tweet", function() {
            $testScope.tweets.forEach(function(tweet) {
                expect(tweet.displayWidthPx).toBeUndefined();
            });
            $interval.flush(100);
            $testScope.tweets.forEach(function(tweet) {
                expect(tweet.displayWidthPx).toEqual(jasmine.any(Number));
            });
        });

        describe("On changed data", function() {
            var initialDisplayHeight;
            var initialDisplayWidth;

            beforeEach(function() {
                deferredGetTweetsResponse.resolve(testTweetData);
                $testScope.$apply();
                $interval.flush(100);
                initialDisplayHeight = $testScope.tweets[0].displayHeightPx;
                initialDisplayWidth = $testScope.tweets[0].displayWidthPx;
                $testScope.adminView = true;
                $testScope.$apply();
                $testScope.adminView = false;
                $testScope.$apply();
            });

            it("should assign a smaller displayHeightPx value when the window is smaller", function() {
                $window.innerHeight = 400;
                $interval.flush(100);
                $testScope.$apply();
                expect($testScope.tweets[0].displayHeightPx).toBeLessThan(initialDisplayHeight);
            });

            it("should assign a smaller displayWidthPx value when the window is smaller", function() {
                $window.innerWidth = 400;
                $interval.flush(100);
                $testScope.$apply();
                expect($testScope.tweets[0].displayWidthPx).toBeLessThan(initialDisplayWidth);
            });

            it("should assign at least twice as large a displayHeightPx value when a tweet contains an image", function() {
                $testScope.tweets[0].entities.media = {
                    image: "dog pic",
                };
                $interval.flush(100);
                $testScope.$apply();
                expect($testScope.tweets[0].displayHeightPx).not.toBeLessThan(initialDisplayHeight * 2);
            });
        });
    });
});
