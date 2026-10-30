# Steps to develop
1. Clone using `git clone https://github.com/hibroseph/sticky-notes`
2. Use Node 22 (see `.nvmrc`; with nvm: `nvm install 22` then `nvm use 22`)
3. Install packages: `npm ci`
4. `npm run dev` opens Chrome with the extension loaded and reloads it as you edit (`npm run dev:firefox` for Firefox). Or build once with `npm run build` and load `dist/chrome-mv3` yourself: `chrome://extensions`, turn on **Developer mode**, **Load unpacked**.
5. `npm test` runs the tests (Vitest), `npm run typecheck` checks types.
6. The website: `npm run site` serves it locally at http://localhost:5173 (opening `site/index.html` directly shows it without styles: its styles and demo are built by Vite). `npm run site:build` builds it into `dist/site`, whose pages also work opened straight from disk.

# How it's put together
- Built with [WXT](https://wxt.dev) (Vite), which writes the manifest for Chrome and Firefox from `wxt.config.ts` and the entrypoints in `src/entrypoints/`: background, content script (a tiny loader), `notes-ui` (the notes on pages, injected only where there are notes), popup, side panel, options (Backup & restore), onboarding, offscreen (Chrome only, for importing 2019-2022 notes).
- `src/model/`: the note model and everything that reads it (selectors, search, sorting, colors, placement of new notes). Views use these rather than reading the saved state directly.
- `src/redux/`: the store in the background, its actions, migrations and the safety checks around saving.
- `src/page/`: notes on web pages. `src/app/`: the popup and side panel (one app, two layouts). `src/ui/`: the note parts both use.
- Look and feel come from the design system in `design-system/` (`tokens.json`, `components/bundle.css`). `npm run tokens` regenerates `src/styles/tokens.css` after `tokens.json` changes.
- Firefox: `npm run build:firefox` builds it; it hasn't been tested or published yet. In Firefox, all-sites access is something the user grants after installing, which needs a prompt before notes can show.

# Development practice
1. Find an issue that you would like to work on (Preferably ones listed on the current milestone)
2. Comment that you'd like to work on it and if we see fit, we will add the label WIP (work in progress) and add you to working on the issue.
3. Name the branch the feature/fix you are working on.
4. When ready, open a pull request
5. We will give you a nice code review and either merge it with master or have you change it accordingly.

# Steps to build for production
`./build.sh <version> <production|uat>` (what the "build extension" workflow runs) builds the extension for Chrome and Firefox and the website, and writes `dist/app.zip` (uploaded to the Chrome Web Store), `dist/app-firefox.zip`, `dist/sentry/` and `dist/homepage/`. It needs `jq` and `zip`.
# Changing the saved data format
Notes are saved in `chrome.storage.local` with a `metadata.schema_version`. Any change that older versions can't read must be a new numbered migration in `src/redux/migrations.js` (the steps are at the top of that file), plus a fixture of the previous release's data in `src/redux/__fixtures__/`. The tests run every fixture through the migrations and fail if a note, tag or setting is lost. Adding an optional field that older versions ignore doesn't need a new version; note it in the version history at the top of `migrations.js`.

# Test hooks
UI elements that automated browser tests interact with have `data-testid` attributes, defined in `src/utils/testIds.js`. Never rename or remove a shipped id: the upgrade test drives the previously published version with them.

# Releasing
Releases are made from **master** only, with the **release** workflow (Actions → release → Run workflow, from master):

1. Bump `version` in `package.json` (the store refuses a version it already has; the workflow checks before building).
2. Run **release**, choosing `production` or `uat`. The build job typechecks, tests and builds, and its summary shows the version, commit, name and store summary of the package.
3. The **publish-extension** job waits for an approval (the run's page, "Review deployments"). Approving uploads the source maps to Sentry, creates the GitHub Release `v<version>` with `app.zip` (production), and uploads the package to the Chrome Web Store.
4. Submit it for review in the Chrome Web Store developer dashboard.
5. For production, the website is published after the upload (uncheck "Also publish the website" to skip it).

Setup for the gate: Settings → Environments → **production** → Required reviewers (yourself). For **uat**, add a `CHROME_EXTENSION_ID` variable with the test listing's id.

Every commit on every branch, master included, is built and tested by **development build** (Chrome, Firefox and the website). The older **build extension**, **publish extension** and **publish homepage** workflows still work (copying the build's run id into the publish ones) and are kept as a fallback.

# Releasing: Chrome Web Store credentials
The **publish extension** workflow uploads with three repository/environment secrets: `CHROME_WEBSTORE_CLIENT_ID`, `CHROME_WEBSTORE_CLIENT_SECRET` and `CHROME_WEBSTORE_REFRESH_TOKEN`. If it fails with "Couldn't get a Chrome Web Store access token", make a new refresh token:
1. In Google Cloud Console (the project with the OAuth client): **APIs & Services → OAuth consent screen**. Make sure the publishing status is **In production**, not Testing; in Testing, refresh tokens expire after 7 days.
2. **Credentials**: use the existing OAuth client (type Web application) or create one, with `https://developers.google.com/oauthplayground` as an authorized redirect URI. The Chrome Web Store API must be enabled.
3. In the [OAuth Playground](https://developers.google.com/oauthplayground): gear icon → "Use your own OAuth credentials" → enter client ID and secret. Scope: `https://www.googleapis.com/auth/chromewebstore`. Authorize with the Google account that owns the extension, then "Exchange authorization code for tokens".
4. Put the new refresh token (and client ID/secret if they changed) into the GitHub secrets. If the workflow's job uses an environment (e.g. `production`), update them there.
