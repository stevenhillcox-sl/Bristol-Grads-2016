module.exports = function(oauth2Client, verifier, fs, configFile) {

    var oAuthUri = oauth2Client.generateAuthUrl({
        scope: "profile",
        prompt: "select_account"
    });

    function authorise(req, callback) {
        var code = req.query.code;
        oauth2Client.getToken(code, function(err, tokens) {
            if (!err) {
                var IdToken = tokens.id_token;
                verifier.verify(IdToken, oauth2Client.clientId_, function(err, tokenInfo) {
                    if (!err) {
                        console.log(tokenInfo.sub);
                        getAdminIDs().then(function(data) {
                            if (data.subs.indexOf(tokenInfo.sub) !== -1) {
                                callback(null, tokens.access_token);
                            } else {
                                callback(new Error("Unauthorised user"), null);
                            }
                        }).catch(function(err) {
                            console.log("Error reading admin data: " + err);
                            callback(err, null);
                        });
                    } else {
                        callback(err, null);
                    }
                });
            } else {
                callback(err, null);
            }
        });
    }

    function getAdminIDs() {
        return new Promise(function(resolve, reject) {
            fs.readFile(configFile, "utf8", function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                }
            });
        });
    }

    return {
        authorise: authorise,
        oAuthUri: oAuthUri
    };
};
