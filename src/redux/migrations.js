// Versioned migrations for the saved notes state.
//
// The saved state records which format it is in as metadata.schema_version.
// On startup the background runs every migration between that version and
// CURRENT_SCHEMA_VERSION, in order, then saves the result.
//
// How to change the storage format:
//   1. Add the next numbered migration below. It receives state in the
//      previous version's shape and returns it in the new shape. It must not
//      lose data, and must be a pure function of the state.
//   2. Bump CURRENT_SCHEMA_VERSION.
//   3. Add a fixture of the *previous* version's state to
//      src/redux/__fixtures__/ (copy real saved data from that release). The
//      fixture tests in migrations.test.js then prove every old format still
//      upgrades cleanly.
// Never edit a migration that has shipped: users may be anywhere in history.
//
// Version history:
//   0: Saved before versioning existed (2022-2023 builds). Same shape as 1.
//      Older formats (the MV2 localStorage data and the 2022 JSON string in
//      storage.local) are first converted to this shape by legacyState.js.
//   1: 5.0.0. { pages: { [url]: { notes } }, tags, metadata }. Notes created
//      from 5.0.0 on also have created_on_url (optional; older notes don't).

export const CURRENT_SCHEMA_VERSION = 1;

const MIGRATIONS = {
  // 0 -> 1: no shape change; this only starts recording the version
  1: (state) => state,
};

export const schemaVersionOf = (state) => state?.metadata?.schema_version ?? 0;

/**
 * Upgrades saved state to CURRENT_SCHEMA_VERSION.
 *
 * State from a *newer* version (e.g. someone downgraded the extension) is
 * returned unchanged rather than guessed at, so the data is still intact if
 * they upgrade again. `onNewerVersion` lets the caller report it.
 */
export const migrateState = (state, { onNewerVersion = () => {} } = {}) => {
  const fromVersion = schemaVersionOf(state);

  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    onNewerVersion(fromVersion);
    return state;
  }

  let migrated = state;
  for (let version = fromVersion + 1; version <= CURRENT_SCHEMA_VERSION; version++) {
    const migrate = MIGRATIONS[version];
    if (!migrate) {
      throw new Error(`Missing storage migration to schema version ${version}`);
    }
    migrated = migrate(migrated);
    migrated = { ...migrated, metadata: { ...migrated.metadata, schema_version: version } };
  }

  return migrated;
};

// Exposed for tests: every version from 1 to CURRENT_SCHEMA_VERSION must have
// a migration
export const MIGRATION_VERSIONS = Object.keys(MIGRATIONS).map(Number);
