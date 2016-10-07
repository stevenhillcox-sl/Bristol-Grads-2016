var server = require("../../server/server.js");

var request = require("request");

var testPort = 1234;
var baseUrl = "http://localhost:" + testPort;

var tweetSearcher;
var authoriser;
var testServer;
var cookieJar;

var testToken = "1234567testtoken";
var oAuthUri = "OAuth URI";

describe("Admin", function() {

    beforeEach(function() {
        cookieJar = request.jar();

        tweetSearcher = jasmine.createSpyObj("tweetSearcher", [
            "getTweetData",
            "setDeletedStatus",
            "loadTweets",
            "addBlockedUser",
            "removeBlockedUser",
            "getBlockedUsers",
            "addSpeaker",
            "removeSpeaker",
            "getSpeakers",
            "displayBlockedTweet",
            "setRetweetDisplayStatus",
            "updateInteractions",
        ]);
        tweetSearcher.updateInteractions.and.callFake(function(tweets, callback) {
            callback(null, "interactions");
        });

        authoriser = {
            authorise: jasmine.createSpy("authorise"),
            oAuthUri: oAuthUri,
        };

        testServer = server(testPort, tweetSearcher, authoriser);

    });

    afterEach(function() {
        testServer.close();
    });

    function authenticateUser(token, callback) {
        authoriser.authorise.and.callFake(function(req, authCallback) {
            authCallback(null, token);
        });

        request(baseUrl + "/oauth", function(error, response) {
            cookieJar.setCookie(request.cookie("sessionToken=" + token), baseUrl);
            callback();
        });
    }

    describe("Admin page routes", function() {

        function authenticationTest(method, route) {
            return function(done) {
                request({
                    method: method,
                    uri: baseUrl + route,
                }, function(error, response, body) {
                    expect(response.statusCode).toEqual(401);
                    done();
                });
            };
        }

        describe("GET /admin", function() {
            it("responds with 401 if not logged in", authenticationTest("GET", "/admin"));

            it("responds with 200 if logged in", function(done) {
                authenticateUser(testToken, function() {
                    request({
                        url: baseUrl + "/admin",
                        jar: cookieJar
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        done();
                    });
                });
            });
        });

        describe("POST /admin/logout", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/logout"));

            it("responds with 200 if logged in", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/logout",
                        jar: cookieJar
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        done();
                    });
                });
            });
        });

        describe("POST /admin/tweets/delete", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/tweets/delete"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/tweets/delete",
                        jar: cookieJar,
                        body: JSON.stringify({
                            id: "7",
                            deleted: true,
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.setDeletedStatus.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/tweets/delete",
                        jar: cookieJar,
                        body: JSON.stringify({
                            id: "7",
                            deleted: true,
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        done();
                    });
                });
            });
        });

        describe("POST /admin/blocked/add", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/blocked/add"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/blocked/add",
                        jar: cookieJar,
                        body: JSON.stringify({
                            user: {
                                name: "user",
                                screen_name: "user"
                            },
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.addBlockedUser).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.addBlockedUser.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/blocked/add",
                        jar: cookieJar,
                        body: JSON.stringify({
                            user: {
                                name: "user",
                                screen_name: "user"
                            },
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        done();
                    });
                });
            });
        });

        describe("POST /admin/blocked/display", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/blocked/display"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/blocked/display",
                        jar: cookieJar,
                        body: JSON.stringify({
                            id: "1",
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.displayBlockedTweet).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.displayBlockedTweet.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/blocked/display",
                        jar: cookieJar,
                        body: JSON.stringify({
                            id: "1",
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        done();
                    });
                });
            });
        });

        describe("POST /admin/blocked/remove", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/blocked/remove"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/blocked/remove",
                        jar: cookieJar,
                        body: JSON.stringify({
                            user: {
                                name: "user",
                                screen_name: "user"
                            },
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.removeBlockedUser).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.removeBlockedUser.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/blocked/remove",
                        jar: cookieJar,
                        body: JSON.stringify({
                            user: {
                                name: "user",
                                screen_name: "user"
                            },
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        expect(tweetSearcher.removeBlockedUser).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });

        describe("GET /admin/blocked", function() {
            it("responds with 401 if not logged in", authenticationTest("GET", "/admin/blocked"));

            it("responds with 200 if logged in", function(done) {
                authenticateUser(testToken, function() {
                    request.get({
                        url: baseUrl + "/admin/blocked",
                        jar: cookieJar,
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.getBlockedUsers).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });

        describe("POST /admin/speakers/add", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/speakers/add"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/speakers/add",
                        jar: cookieJar,
                        body: JSON.stringify({
                            name: "user"
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.addSpeaker).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.addSpeaker.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/speakers/add",
                        jar: cookieJar,
                        body: JSON.stringify({
                            name: "user"
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        expect(tweetSearcher.addSpeaker).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });

        describe("POST /admin/speakers/remove", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/speakers/remove"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/speakers/remove",
                        jar: cookieJar,
                        body: JSON.stringify({
                            name: "user"
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.removeSpeaker).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.removeSpeaker.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/speakers/remove",
                        jar: cookieJar,
                        body: JSON.stringify({
                            name: "user"
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        expect(tweetSearcher.removeSpeaker).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });

        describe("POST /admin/tweets/retweetDisplayStatus", function() {
            it("responds with 401 if not logged in", authenticationTest("POST", "/admin/speakers/retweetDisplayStatus"));

            it("responds with 200 if logged in and query is valid", function(done) {
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/tweets/retweetDisplayStatus",
                        jar: cookieJar,
                        body: JSON.stringify({
                            status: "all"
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.setRetweetDisplayStatus).toHaveBeenCalled();
                        done();
                    });
                });
            });

            it("responds with 404 if logged in and query is invalid", function(done) {
                tweetSearcher.setRetweetDisplayStatus.and.throwError();
                authenticateUser(testToken, function() {
                    request.post({
                        url: baseUrl + "/admin/tweets/retweetDisplayStatus",
                        jar: cookieJar,
                        body: JSON.stringify({
                            status: "all"
                        }),
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(404);
                        expect(tweetSearcher.setRetweetDisplayStatus).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });

        describe("GET /api/speakers", function() {
            it("responds with 200 if not logged in", function(done) {
                request.get(baseUrl + "/api/speakers", function(error, response, body) {
                    expect(response.statusCode).toEqual(200);
                    done();
                });
            });

            it("responds with 200 if logged in", function(done) {
                authenticateUser(testToken, function() {
                    request.get({
                        url: baseUrl + "/api/speakers",
                        jar: cookieJar,
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.getSpeakers).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });

    });
    describe("OAuth routes", function() {
        it("GET /oauth responds with 400 if authentication fails", function(done) {
            authoriser.authorise.and.callFake(function(req, authCallback) {
                authCallback({
                    err: "bad"
                }, null);
            });

            request(baseUrl + "/oauth", function(error, response, body) {
                expect(response.statusCode).toEqual(400);
                done();
            });
        });

        it("GET /oauth responds with 302 if authentication succeeds", function(done) {
            authoriser.authorise.and.callFake(function(req, authCallback) {
                authCallback(null, testToken);
            });

            request({
                url: baseUrl + "/oauth",
                followRedirect: false
            }, function(error, response, body) {
                expect(response.statusCode).toEqual(302);
                done();
            });
        });

        it("GET /oauth responds with a redirect to /dash if authentication succeeds", function(done) {
            authoriser.authorise.and.callFake(function(req, authCallback) {
                authCallback(null, testToken);
            });

            request(baseUrl + "/oauth", function(error, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(response.request.uri.hash).toEqual("#/dash");
                done();
            });
        });

        it("GET /oauth responds with a redirect to #/dash/unauthorised if authentication succeeds but user is not authorised", function(done) {
            authoriser.authorise.and.callFake(function(req, authCallback) {
                authCallback(new Error("Unauthorised user"), null);
            });

            request(baseUrl + "/oauth", function(error, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(response.request.uri.hash).toEqual("#/dash/unauthorised");
                done();
            });
        });

        it("GET /api/oauth/uri responds with url", function(done) {
            request(baseUrl + "/api/oauth/uri", function(error, response, body) {
                expect(response.statusCode).toEqual(200);
                expect(JSON.parse(body)).toEqual({
                    uri: oAuthUri
                });
                done();
            });
        });
    });
    describe("Other routes", function() {
        describe("GET /api/interactions", function() {
            it("responds with 200 if not logged in", function(done) {
                request.get(baseUrl + "/api/interactions", function(error, response, body) {
                    expect(response.statusCode).toEqual(200);
                    done();
                });
            });

            it("responds with 200 if logged in", function(done) {
                authenticateUser(testToken, function() {
                    request.get({
                        url: baseUrl + "/api/interactions",
                        jar: cookieJar,
                        headers: {
                            "Content-type": "application/json"
                        }
                    }, function(error, response, body) {
                        expect(response.statusCode).toEqual(200);
                        expect(tweetSearcher.updateInteractions).toHaveBeenCalled();
                        done();
                    });
                });
            });
        });
    });

});
