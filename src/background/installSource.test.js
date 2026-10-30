import { installSourceFromUrls } from "./installSource";

const STORE = "https://chromewebstore.google.com/detail/docamatic-add-sticky-notes/mbpkbeacgamdiajpgbblpcgpkidaobob";

test("An install with the website and its store link open", () => {
  expect(
    installSourceFromUrls([
      "https://hibroseph.github.io/docamatic/index.html",
      `${STORE}?utm_source=docamatic_website&utm_medium=hero`,
      "https://mail.example.com/inbox",
    ])
  ).toEqual({ came_from_website: true, store_tab_open: true, store_utm_source: "docamatic_website", store_utm_medium: "hero" });
});

test("The store listing without the website (e.g. found by searching the store)", () => {
  expect(installSourceFromUrls([STORE, "chrome://newtab/"])).toEqual({ came_from_website: false, store_tab_open: true });
});

test("Neither open, or nothing readable", () => {
  expect(installSourceFromUrls(["https://example.com/", "", "not a url"])).toEqual({ came_from_website: false });
});

test("Only label-like campaign tags are sent, and only from Docamatic's own listing", () => {
  expect(installSourceFromUrls([`${STORE}?utm_source=${"x".repeat(60)}&utm_campaign=hello%20there%40me.com`])).toEqual({
    came_from_website: false,
    store_tab_open: true,
  });
  expect(installSourceFromUrls(["https://chromewebstore.google.com/detail/other/abcdefabcdefabcdefabcdefabcdefab?utm_source=x"])).toEqual({
    came_from_website: false,
  });
});

test("Other pages under the same host aren't the website", () => {
  expect(installSourceFromUrls(["https://hibroseph.github.io/something-else/"]).came_from_website).toBe(false);
});
