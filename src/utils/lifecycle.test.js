import { lifecycleContext, lifecycleTags, recordInstallEvent } from "./lifecycle";

let data;
beforeEach(() => {
  data = {};
  global.chrome = {
    storage: {
      local: {
        get: async (key) => ({ [key]: data[key] }),
        set: async (values) => Object.assign(data, values),
      },
    },
  };
});

afterEach(() => {
  delete global.chrome;
});

test("Records updates and reports the version the install came from", async () => {
  await recordInstallEvent({ reason: "install" }, { version: "5.0.0", now: new Date("2026-10-19T10:00:00Z") });
  const lifecycle = await recordInstallEvent(
    { reason: "update", previousVersion: "5.0.0" },
    { version: "5.0.1", now: new Date("2026-10-21T10:00:00Z") }
  );

  expect(lifecycle.history).toHaveLength(2);
  expect(lifecycleTags(lifecycle, new Date("2026-10-21T13:30:00Z"))).toEqual({
    previous_version: "5.0.0",
    install_reason: "update",
    hours_since_install_or_update: "3",
  });
  expect(lifecycleContext(lifecycle)["2"]).toBe("update 5.0.0 -> 5.0.1 at 2026-10-21T10:00:00.000Z");
});

test("Keeps only the last few events", async () => {
  for (let i = 0; i < 8; i++) {
    await recordInstallEvent({ reason: "update", previousVersion: `5.0.${i}` }, { version: `5.0.${i + 1}` });
  }
  expect(data.lifecycle.history).toHaveLength(5);
  expect(data.lifecycle.history[4].to).toBe("5.0.8");
});

test("Unknown for installs from before history was recorded", () => {
  expect(lifecycleTags(undefined)).toEqual({ previous_version: "unknown", install_reason: "unknown" });
  expect(lifecycleTags({ history: "garbage" })).toEqual({ previous_version: "unknown", install_reason: "unknown" });
  expect(lifecycleTags({ history: [{ reason: "install", to: "5.0.0", at: new Date().toISOString() }] }).previous_version).toBe("none");
});
