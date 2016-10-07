var googleAuthoriser = require("../../server/oauth-google.js");

var request = require("request");
var sinon = require("sinon");

var authoriser;
var oauth2Client;
var verifier;
var fs;

var testToken = {
    id_token: "4543246426fggfh",
    access_token: "1234567testtoken"
};
var tokenInfo = {
    sub: "978356lgdhrh"
};
var oAuthUri = "OAuth URI";
var invalidToken = "gdg";

describe("Authoriser", function() {

    beforeEach(function() {
        oauth2Client = {
            generateAuthUrl: function() {},
            getToken: function() {},
            clientId_: "client id"
        };

        sinon.stub(oauth2Client, "generateAuthUrl", function(scope) {
            return oAuthUri;
        });

        verifier = {
            verify: function() {}
        };

        fs = {
            readFile: function() {}
        };

        authoriser = googleAuthoriser(oauth2Client, verifier, fs);
    });

    function getTokenFromCode() {
        sinon.stub(oauth2Client, "getToken", function(code, callback) {
            callback(null, testToken);
        });
    }

    function verifyToken() {
        sinon.stub(verifier, "verify", function(token, clientId, callback) {
            callback(null, tokenInfo);
        });
    }

    describe("Authoriser", function() {

        it("callback with error if can't get token from code", function(done) {

            var error = new Error("can't get token from code");
            sinon.stub(oauth2Client, "getToken", function(code, callback) {
                callback(error, null);
            });

            authoriser.authorise({
                query: {
                    code: "code"
                }
            }, function(err, token) {
                expect(err).toEqual(error);
                done();
            });
        });

        it("callback with error if token doesn't verify", function(done) {

            var error = new Error("Invalid token");
            getTokenFromCode();
            sinon.stub(verifier, "verify", function(token, clientId, callback) {
                callback(error, null);
            });

            authoriser.authorise({
                query: {
                    code: "code"
                }
            }, function(err, token) {
                expect(err).toEqual(error);
                done();
            });
        });

        it("callback with error if unable to read admin file", function(done) {

            var error = new Error("bad read");
            getTokenFromCode();
            verifyToken();
            sinon.stub(fs, "readFile", function(location, encoding, callback) {
                callback(error, null);
            });

            authoriser.authorise({
                query: {
                    code: "code"
                }
            }, function(err, token) {
                expect(err).toEqual(error);
                done();
            });
        });

        it("callback with error if unauthorised user", function(done) {

            var error = new Error("Unauthorised user");
            getTokenFromCode();
            verifyToken();
            sinon.stub(fs, "readFile", function(location, encoding, callback) {
                callback(null, "{\"subs\": [\"" + invalidToken + "\"]}");
            });

            authoriser.authorise({
                query: {
                    code: "code"
                }
            }, function(err, token) {
                expect(err).toEqual(error);
                done();
            });
        });

        it("callback with access token if authorised user", function(done) {

            getTokenFromCode();
            verifyToken();
            sinon.stub(fs, "readFile", function(location, encoding, callback) {
                callback(null, "{\"subs\": [\"" + tokenInfo.sub + "\"]}");
            });

            authoriser.authorise({
                query: {
                    code: "code"
                }
            }, function(err, token) {
                expect(token).toEqual(testToken.access_token);
                done();
            });
        });
    });
});
