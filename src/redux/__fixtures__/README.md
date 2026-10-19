# Saved-state fixtures

One file per historical storage format. `migrations.test.js` loads every file
here, runs it through the same steps the background runs on startup
(`normalizeState` for pre-versioning layouts, then `migrateState`), and checks
the result is in the current format with every note and tag still present.

When a release changes the storage format, add a fixture of the *previous*
release's data. Best is a real copy: in that version's service worker console
run `chrome.storage.local.get(null).then(s => copy(JSON.stringify(s, null, 2)))`
and paste it into a new file (remove any personal notes first).

File names:
- `storage-*.json`: the contents of `chrome.storage.local`.
- `mv2-localstorage-*.json`: the MV2 background page's localStorage notes
  (the url-keyed object the offscreen import reads).

The current files were written to match the exact shapes saved by each
version's code in git history.
