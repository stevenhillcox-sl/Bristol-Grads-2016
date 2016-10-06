describe("AdminController", function() {

    var $testScope;
    var $q;
    var $interval;
    var adminDashDataService;
    var AdminController;

    var deferredAuthenticateResponse;
    var deferredGetAuthUriResponse;
    var deferredGetLogOutResponse;
    var deferredGetSpeakersResponse;
    var deferredBlockedUsersResponse;

    var testSuccessResponse;
    var user1;
    var user2;
    var entities1;
    var entities2;
    var testSpeakers;
    var testNewSpeaker;
    var testAddedSpeakers;
    var testRemoveSpeaker;
    var testRemovedSpeakers;
    var testBlockedData;
    var testDeletedData;
    var testPinnedData;

    var testUri;

    beforeEach(function() {
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

        testSpeakers = ["Walt", "Jesse", "Hank", "Mike", "Saul"];
        testNewSpeaker = "Gus";
        testAddedSpeakers = ["Walt", "Jesse", "Hank", "Mike", "Saul", "Gus"];
        testRemoveSpeaker = "Mike";
        testRemovedSpeakers = ["Walt", "Jesse", "Hank", "Saul"];

        testUri = "http://googleLoginPage.com";
    });

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
        adminDashDataService = jasmine.createSpyObj("adminDashDataService", [
            "authenticate",
            "getAuthUri",
            "deleteTweet",
            "getSpeakers",
            "addSpeaker",
            "removeSpeaker",
            "logOut",
            "blockedUsers",
            "addBlockedUser",
            "removeBlockedUser",
            "displayBlockedTweet",
        ]);

        deferredAuthenticateResponse = $q.defer();
        deferredGetAuthUriResponse = $q.defer();
        deferredGetLogOutResponse = $q.defer();
        deferredGetSpeakersResponse = $q.defer();
        deferredBlockedUsersResponse = $q.defer();

        adminDashDataService.authenticate.and.returnValue(deferredAuthenticateResponse.promise);
        adminDashDataService.getAuthUri.and.returnValue(deferredGetAuthUriResponse.promise);
        adminDashDataService.getSpeakers.and.returnValue(deferredGetSpeakersResponse.promise);
        adminDashDataService.logOut.and.returnValue(deferredGetLogOutResponse.promise);
        adminDashDataService.blockedUsers.and.returnValue(deferredBlockedUsersResponse.promise);
        adminDashDataService.addBlockedUser.and.returnValue(deferredBlockedUsersResponse.promise);
        adminDashDataService.removeBlockedUser.and.returnValue(deferredBlockedUsersResponse.promise);

        AdminController = _$controller_("AdminController", {
            $scope: $testScope,
            adminDashDataService: adminDashDataService,
            $interval: $interval,
        });
    }));

    describe("startup", function() {
        describe("when already authenticated", function() {
            beforeEach(function() {
                deferredAuthenticateResponse.resolve(testSuccessResponse);
                $testScope.$apply();
            });
            it("Calls the authenticate function in adminDashDataService", function() {
                expect(adminDashDataService.authenticate).toHaveBeenCalled();
            });
            it("Sets logged in as true when already authenticated", function() {
                expect($testScope.loggedIn).toBe(true);
            });
            it("get speakers and sets the local value", function() {
                deferredGetSpeakersResponse.resolve(testSpeakers);
                $testScope.$apply();
                expect(adminDashDataService.getSpeakers).toHaveBeenCalled();
                expect($testScope.speakers).toEqual(testSpeakers);
            });
        });
        describe("when not already authenticated", function() {
            beforeEach(function() {
                deferredAuthenticateResponse.reject();
                $testScope.$apply();
                deferredGetAuthUriResponse.resolve(testUri);
                $testScope.$apply();
            });
            it("calls the authenticate and getAuthUri functions in adminDashDataService", function() {
                expect(adminDashDataService.authenticate).toHaveBeenCalled();
                expect(adminDashDataService.getAuthUri).toHaveBeenCalled();
            });
            it("sets local URI variable", function() {
                expect($testScope.loginUri).toEqual(testUri);
            });
            it("does not attempt to get speakers", function() {
                deferredGetSpeakersResponse.resolve(testSpeakers);
                $testScope.$apply();
                expect(adminDashDataService.getSpeakers).not.toHaveBeenCalled();
                expect($testScope.speakers).toEqual([]);
            });
        });
    });

    describe("logOut()", function() {

        beforeEach(function() {
            deferredAuthenticateResponse.resolve(testSuccessResponse);
            $testScope.$apply();
        });

        it("calls the logOut function in the adminDashDataService", function() {
            $testScope.logOut();
            deferredGetLogOutResponse.resolve(testSuccessResponse);
            $testScope.$apply();
            expect(adminDashDataService.logOut).toHaveBeenCalled();
        });

        it("gets login URI and sets loggedIn to false", function() {
            expect($testScope.loggedIn).toBe(true);
            $testScope.logOut();
            deferredGetLogOutResponse.resolve(testSuccessResponse);
            deferredGetAuthUriResponse.resolve(testUri);
            $testScope.$apply();
            expect($testScope.loginUri).toEqual(testUri);
            expect($testScope.loggedIn).toEqual(false);
        });
    });

    describe("getBlockedUsers()", function() {

        var blockedUsers = ["a", "b"];

        beforeEach(function() {
            $testScope.getBlockedUsers();
            deferredBlockedUsersResponse.resolve(testSuccessResponse);
            $testScope.$apply();
        });

        it("calls the blockedUsers() function in the adminDashDataService", function() {
            expect(adminDashDataService.blockedUsers).toHaveBeenCalled();
        });
    });

    describe("displayBlockedTweet()", function() {

        beforeEach(function() {
            $testScope.displayBlockedTweet("1");
        });

        it("calls the displayBlockedTweet() function in the adminDashDataService", function() {
            expect(adminDashDataService.displayBlockedTweet).toHaveBeenCalled();
        });
    });

    describe("addBlockedUser()", function() {
        var blockedUsers = ["a", "b"];

        beforeEach(function() {
            $testScope.addBlockedUser();
            deferredBlockedUsersResponse.resolve(testSuccessResponse);
            $testScope.$apply();
        });

        it("calls the addBlockedUser() function in the adminDashDataService", function() {
            expect(adminDashDataService.addBlockedUser).toHaveBeenCalled();
        });
        it("calls the blockedUsers() function in the adminDashDataService", function() {
            expect(adminDashDataService.blockedUsers).toHaveBeenCalled();
        });
    });

    describe("removeBlockedUser()", function() {
        var blockedUsers = ["a", "b"];

        beforeEach(function() {
            $testScope.removeBlockedUser();
            deferredBlockedUsersResponse.resolve(testSuccessResponse);
            $testScope.$apply();
        });

        it("calls the removeBlockedUser() function in the adminDashDataService", function() {
            expect(adminDashDataService.removeBlockedUser).toHaveBeenCalled();
        });
        it("calls the blockedUsers() function in the adminDashDataService", function() {
            expect(adminDashDataService.blockedUsers).toHaveBeenCalled();
        });
    });

    describe("toggleBlocked() on unblocked user", function() {
        var blockedUsers = ["a", "b"];

        beforeEach(function() {
            $testScope.toggleBlocked("jim", "jim", false);
            deferredBlockedUsersResponse.resolve(testSuccessResponse);
            $testScope.$apply();
        });

        it("calls the addBlockedUser() function in the adminDashDataService", function() {
            expect(adminDashDataService.addBlockedUser).toHaveBeenCalled();
        });
        it("calls the blockedUsers() function in the adminDashDataService", function() {
            expect(adminDashDataService.blockedUsers).toHaveBeenCalled();
        });
    });

    describe("toggleBlocked() on blocked user", function() {
        var blockedUsers = ["a", "b"];

        beforeEach(function() {
            $testScope.toggleBlocked("jim", "jim", true);
            deferredBlockedUsersResponse.resolve(testSuccessResponse);
            $testScope.$apply();
        });

        it("calls the removeBlockedUser() function in the adminDashDataService", function() {
            expect(adminDashDataService.removeBlockedUser).toHaveBeenCalled();
        });
        it("calls the blockedUsers() function in the adminDashDataService", function() {
            expect(adminDashDataService.blockedUsers).toHaveBeenCalled();
        });
    });

    describe("addSpeaker()", function() {

        var deferredSpeakerResponse;

        beforeEach(function() {
            // Setup
            deferredSpeakerResponse = $q.defer();
            deferredSpeakerResponse.resolve();
            adminDashDataService.addSpeaker.and.returnValue(deferredSpeakerResponse.promise);
            adminDashDataService.getSpeakers.and.returnValues(deferredGetSpeakersResponse.promise);
            deferredGetSpeakersResponse.resolve(testAddedSpeakers);
            // Events
            $testScope.ctrl.speaker = testNewSpeaker;
            $testScope.addSpeaker();
            $testScope.$apply();
        });

        it("calls the addSpeaker function in the adminDashDataService with the value taken from the user", function() {
            expect(adminDashDataService.addSpeaker).toHaveBeenCalled();
            expect(adminDashDataService.addSpeaker.calls.allArgs()).toEqual([
                [testNewSpeaker]
            ]);
        });

        it("gets a new copy of the speakers list from the server and updates the local speakers list", function() {
            expect(adminDashDataService.getSpeakers).toHaveBeenCalledTimes(1);
            expect($testScope.speakers).toEqual(testAddedSpeakers);
        });

        it("clears the local value of the 'speaker' input field", function() {
            expect($testScope.ctrl.speaker).toEqual("");
        });
    });

    describe("removeSpeaker()", function() {

        var deferredSpeakerResponse;

        beforeEach(function() {
            // Setup
            deferredSpeakerResponse = $q.defer();
            deferredSpeakerResponse.resolve();
            adminDashDataService.removeSpeaker.and.returnValue(deferredSpeakerResponse.promise);
            adminDashDataService.getSpeakers.and.returnValues(deferredGetSpeakersResponse.promise);
            deferredGetSpeakersResponse.resolve(testRemovedSpeakers);
            // Events
            $testScope.removeSpeaker(testRemoveSpeaker);
            $testScope.$apply();
        });

        it("calls the removeSpeaker function in the adminDashDataService with the value passed as an argument",
            function() {
                expect(adminDashDataService.removeSpeaker).toHaveBeenCalled();
                expect(adminDashDataService.removeSpeaker.calls.allArgs()).toEqual([
                    [testRemoveSpeaker]
                ]);
            }
        );

        it("gets a new copy of the speakers list from the server and updates the local speakers list", function() {
            expect(adminDashDataService.getSpeakers).toHaveBeenCalledTimes(1);
            expect($testScope.speakers).toEqual(testRemovedSpeakers);
        });
    });
});
