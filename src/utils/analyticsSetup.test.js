import { getInstallId, isInternalInstall, resetAnalyticsForTests, setInternalInstall, track, useStoreForAnalyticsSetting } from "./analytics";

// A fake chrome.storage.local that, like the real one, answers asynchronously
const fakeStorage = (initial = {}) => {
    const data = { ...initial };
    return {
        data,
        get: jest.fn(async (key) => (key === null ? { ...data } : { [key]: data[key] })),
        set: jest.fn(async (values) => Object.assign(data, values)),
    };
};

let storage;
beforeEach(() => {
    resetAnalyticsForTests();
    storage = fakeStorage();
    global.chrome = { storage: { local: storage }, management: { getSelf: async () => ({ installType: "normal" }) } };
    global.fetch = jest.fn(async () => ({ ok: true }));
});

afterEach(() => {
    delete global.chrome;
    delete global.fetch;
});

test("Events sent at the same time share one install id", async () => {
    const ids = await Promise.all([getInstallId(), getInstallId(), getInstallId()]);
    expect(new Set(ids).size).toBe(1);
    expect(storage.set).toHaveBeenCalledTimes(1);
    expect(storage.data.analytics.installId).toBe(ids[0]);
})

test("Keeps an existing install id", async () => {
    storage.data.analytics = { installId: "existing", lastDailyActive: "2026-10-18" };
    expect(await getInstallId()).toBe("existing");
    expect(storage.set).not.toHaveBeenCalled();
})

test("Opting out takes effect immediately once the store is used", async () => {
    // Storage still says enabled (the save hasn't happened yet)...
    storage.data.metadata = { analytics_enabled: true };
    // ...but the live state says the user just opted out
    useStoreForAnalyticsSetting(() => ({ metadata: { analytics_enabled: false } }));
    await track("popup_opened");
    expect(global.fetch).not.toHaveBeenCalled();
})

test("Before the store is loaded, the setting is read from storage", async () => {
    storage.data.metadata = { analytics_enabled: false };
    await track("extension_installed");
    expect(global.fetch).not.toHaveBeenCalled();
})

const sentProperties = () => JSON.parse(global.fetch.mock.calls[0][1].body).properties;

test("Web Store installs aren't internal by default", async () => {
    await track("popup_opened");
    expect(sentProperties().internal).toBe(false);
})

test("Unpacked (development) installs are always internal", async () => {
    chrome.management.getSelf = async () => ({ installType: "development" });
    await track("popup_opened");
    expect(sentProperties().internal).toBe(true);
})

test("Any install can be marked internal by hand, and unmarked", async () => {
    await setInternalInstall(true);
    expect(await isInternalInstall()).toBe(true);
    expect(storage.data.analytics.installId).toBeDefined(); // id kept
    await setInternalInstall(false);
    expect(await isInternalInstall()).toBe(false);
})
