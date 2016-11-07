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

Node js

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