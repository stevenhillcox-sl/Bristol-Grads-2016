describe("twitterWallDataService", function() {

    var twitterWallDataService;
    var $httpMock;

    var testTweets = [{
        text: "Test tweet 1",
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
        }
    }, {
        text: "Test tweet 2",
        entities: {
            hashtags: [],
            user_mentions: [],
            urls: [{
                url: "www.google.com",
                display_url: "google.com"
            }]
        },
        user: {
            name: "Test user 2",
            screen_name: "user2"
        }
    }];

    var testSpeakers = ["Alice", "Bob", "Charlie"];

    beforeEach(function() {
        angular.module("ngMaterial", []);
        angular.module("angularMoment", []);
        angular.module("ngSanitize", []);
        module("TwitterWallApp");
    });

    beforeEach(inject(function(_twitterWallDataService_, _$httpBackend_) {
        twitterWallDataService = _twitterWallDataService_;
        //Corresponds to the $http service in the actual data service
        $httpMock = _$httpBackend_;
        $httpMock
            .when("GET", "/api/tweets")
            .respond(testTweets);
        $httpMock
            .when("GET", "/api/speakers")
            .respond(testSpeakers);
    }));

    describe("getTweets", function() {
        it("returns a promise which resolves with a list of the tweet objects sent by the server when getTweets is called",
            function(done) {
                var failed = jasmine.createSpy("failed");
                $httpMock.expectGET("/api/tweets");
                twitterWallDataService.getTweets().catch(failed).then(function(result) {
                    expect(failed.calls.any()).toEqual(false);
                    expect(result).toEqual(testTweets);
                    done();
                });
                $httpMock.flush();
            }
        );

        it("returns a promise which rejects when getTweets is called and the server returns an error code",
            function(done) {
                var failed = jasmine.createSpy("failed");
                $httpMock.expectGET("/api/tweets").respond(500, "");
                twitterWallDataService.getTweets().catch(failed).then(function(result) {
                    expect(failed.calls.any()).toEqual(true);
                    expect(failed.calls.argsFor(0)[0].status).toEqual(500);
                    done();
                });
                $httpMock.flush();
            }
        );
    });

    describe("getSpeakers", function() {
        it("returns a promise which resolves with the speaker array sent by the server when getSpeakers is called",
            function(done) {
                var failed = jasmine.createSpy("failed");
                $httpMock.expectGET("/api/speakers");
                twitterWallDataService.getSpeakers().catch(failed).then(function(result) {
                    expect(failed.calls.any()).toEqual(false);
                    expect(result).toEqual(testSpeakers);
                    done();
                });
                $httpMock.flush();
            }
        );

        it("returns a promise which rejects when getSpeakers is called and the server returns an error code",
            function(done) {
                var failed = jasmine.createSpy("failed");
                $httpMock.expectGET("/api/speakers").respond(500, "");
                twitterWallDataService.getSpeakers().catch(failed).then(function(result) {
                    expect(failed.calls.any()).toEqual(true);
                    expect(failed.calls.argsFor(0)[0].status).toEqual(500);
                    done();
                });
                $httpMock.flush();
            }
        );
    });

});
