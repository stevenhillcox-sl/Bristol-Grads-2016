# Bristol-Grads-2016

Technologies
---

- Frontend : Angular 1
- Backend : Node js
- Testing : Jasmine (frontend & backend)
- Grunt used as a task runner
- Webpack used for bundling
- Sass used for styling

Requirements
---

Node.js

Installation
---

- Clone the repo
- Run `npm install`
- Set up API credentials and config files as described below
- By default `grunt` will run linting checks and all tests
- To bundle and start the server run `grunt build && npm start`
- Access main page on [localhost:8080](https://localhost:8080)
- Access admin page on [localhost:8080/dash](https://localhost:8080/dash)


API credentials
---

Store your server's address in the environment variable `SERVER_IP_ADDRESS`.

Set up twitter API credentials [here](https://apps.twitter.com/). The callback URL should be your server's address appended with /oauth, e.g. `http://127.0.0.1:8080/oauth`.
Save your consumer key in the environment variable `TWITTER_CONSUMER_KEY` and your consumer secret in `TWITTER_CONSUMER_SECRET`.
Generate your own access token and save it in the environment variable `TWITTER_ACCESS_TOKEN_KEY` and save the access token secret in `TWITTER_ACCESS_TOKEN_SECRET`.

Sign-in for the admin dash is done with any google hosted email address.
Set up google API credentials for the app as described [here](https://developers.google.com/identity/sign-in/web/devconsole-project).
Save your client ID in the environment variable `TWEET_WALL_OAUTH_CLIENT_ID` and your client secret in `TWEET_WALL_OAUTH_SECRET`.

Server config
---

On startup, the server will load a set of JSON configuration files from `server/config/`.
The configuration files currently used are `adminConfig.json` and `eventConfig.json`.
Files with these exact names must be present in the config directory, and no keys may be omitted from the files.
Valid example config files can be found in `server/config/examples/`.

`adminConfig.json` has the following format:

```JSON5
{
  // An array of google-powered email addresses which are authorised to use the admin page
  "emails": ["example@gmail.com", "example@scottlogic.com"]
}
```

`eventConfig.json` has the following format:
```JSON5
{ 
  // An array of hashtags, where tweets that use these hashtags will be displayed by the twitter wall
  "hashtags":["#bristech", "#bristech2016"],
  // An array of twitter users, where tweets that mention these users will be displayed by the twitter wall
  "mentions":["@bristech"],
  // A twitter user, where all tweets from the user will be displayed by the twitter wall
  "officialUser":"bristech",
  // An array of users, where tweets from these users that use any of the above hashtags will be prioritised by the twitter wall
  "speakers":["Aprill13", "danfairs"]
}
```

Deployment info
---

Included with the project are a set of files used for deploying to AWS:
`circle.yml` for automatic deployment with CircleCI,
`appspec.yml` for specifying deployment behaviour,
and the lifecycle scripts `app-config.sh`, `app-start.sh`, and `app-stop.sh`.
Notably these configuration files and scripts are intended for use with Linux only.

As the configuration files and environment variables used by the server are not stored in the repository, it is necessary to provide these files on the deployment instance.
This is done by creating a folder `/home/ec2-user/TwitterWallConfig/` on the instance, containing all the files in `server/config/` (with the same names), and a script `env.sh` that exports all the necessary environment variables.

