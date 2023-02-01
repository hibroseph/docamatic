export const migrate = (storage) => {
  console.debug("migrating");

  var migrationsApplied = 0;

  if (!storage.metadata) {
    console.debug("Adding metadata node");
    storage.metadata = {
      onboarded: false,
      user: generateUUID(),
    };

    migrationsApplied++;
  }

  if (!storage.metadata.onboarded) {
    console.debug("User has not onboarded and has no onboarded indicator");
    storage.metadata.onboarded = false;
    migrationsApplied++;
  }

  if (!storage.metadata.user) {
    console.debug("Giving user a uuid");
    storage.metadata.user = generateUUID();
    migrationsApplied++;
  }

  if (!storage.metadata.errors) {
    console.debug("User does not have errors node");
    storage.metadata.errors = [];
    migrationsApplied++;
  }

  if (!storage.metadata.tracking) {
    console.debug("User does not have tracking data");
    storage.metadata.tracking = [];
    migrationsApplied++;
  }

  if (!storage.metadata.canTrack) {
    console.debug("User does not have tracking indicator");
    storage.metadata.canTrack = true;
    migrationsApplied++;
  }

  if (!storage.metadata.trackingTime) {
    console.debug("User does not have last tracking data sent");
    storage.metadata.trackingTime = Date.now();
    migrationsApplied++;
  }

  console.debug("Successfully migrated " + (migrationsApplied > 0 ? " with " + migrationsApplied + " migrations applied" : ""));
  return storage;
};
