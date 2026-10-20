# Steps to develop:
1. Clone using `git clone https://github.com/hibroseph/sticky-notes`
2. Use Node 22 (see `.nvmrc`; with nvm: `nvm install 22` then `nvm use 22`)
3. Install packages `npm ci`
4. Start development `npm run watch` (rebuilds on save), or build once with `npm run build`. Run the tests with `npm test`
5. Cross your fingers that webpack can successfully build and bundle the app
6. Open chrome and enter `chrome://extensions` in the url
7. Top right click on `Developer mode`
8. Click `Load unpacked` on the top left bar
9. Find where dist was built in your file directory
10. Pray to the almighty that it worked and hopefully it should be visible in chrome as a normal extension

# Development practice
1. Find an issue that you would like to work on (Preferably ones listed on the current milestone)
2. Comment that you'd like to work on it and if we see fit, we will add the label WIP (work in progress) and add you to working on the issue.
3. Name the branch the feature/fix you are working on.
4. When ready, open a pull request
5. We will give you a nice code review and either merge it with master or have you change it accordingly.

# Steps to build for production
1. Start production build with `npm run prod`
2. This will produce an app.zip (which we actually upload to the chrome extension store)
3. The directory build should be in the root, this will be the production build
# Changing the saved data format
Notes are saved in `chrome.storage.local` with a `metadata.schema_version`. Any change to what gets saved must be a new numbered migration in `src/redux/migrations.js` (the steps are at the top of that file), plus a fixture of the previous release's data in `src/redux/__fixtures__/`. The tests run every fixture through the migrations and fail if a note, tag or setting is lost.

# Test hooks
UI elements that automated browser tests interact with have `data-testid` attributes, defined in `src/utils/testIds.js`. Never rename or remove a shipped id: the upgrade test drives the previously published version with them.

# Releasing: Chrome Web Store credentials
The **publish extension** workflow uploads with three repository/environment secrets: `CHROME_WEBSTORE_CLIENT_ID`, `CHROME_WEBSTORE_CLIENT_SECRET` and `CHROME_WEBSTORE_REFRESH_TOKEN`. If it fails with "Couldn't get a Chrome Web Store access token", make a new refresh token:
1. In Google Cloud Console (the project with the OAuth client): **APIs & Services → OAuth consent screen**. Make sure the publishing status is **In production**, not Testing; in Testing, refresh tokens expire after 7 days.
2. **Credentials**: use the existing OAuth client (type Web application) or create one, with `https://developers.google.com/oauthplayground` as an authorized redirect URI. The Chrome Web Store API must be enabled.
3. In the [OAuth Playground](https://developers.google.com/oauthplayground): gear icon → "Use your own OAuth credentials" → enter client ID and secret. Scope: `https://www.googleapis.com/auth/chromewebstore`. Authorize with the Google account that owns the extension, then "Exchange authorization code for tokens".
4. Put the new refresh token (and client ID/secret if they changed) into the GitHub secrets. If the workflow's job uses an environment (e.g. `production`), update them there.
