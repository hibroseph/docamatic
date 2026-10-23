// The welcome page, opened once when Docamatic is installed (and from
// Settings > Quick tour).
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../../design-system/components/bundle.css";
import "../../styles/page-full.css";
import "../../styles/practice-menu.css";
import "./welcome.css";
import { initSentry } from "../../utils/sentry";
import { createProxyStore } from "../../utils/createProxyStore";
import { addTitle, trackEvent, userOnboarded } from "../../redux/actions";
import { CHROME_MESSAGES, CREATE_NOTE_COMMAND } from "../../utils/constants";
import { startDemo } from "../../page/demo";
import { attachPracticeMenu } from "../../page/practiceMenu";
import { mountSurvey } from "../../app/Survey";

initSentry("onboarding");

const store = createProxyStore();
store.ready().then(() => {
  store.dispatch(userOnboarded());
  const theme = store.getState().metadata?.preferences?.theme;
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
});

chrome.commands
  ?.getAll()
  .then((commands) => {
    const shortcut = commands.find((command) => command.name === CREATE_NOTE_COMMAND)?.shortcut;
    if (!shortcut) {
      // The browser left it unset (another extension or the browser itself
      // uses it, or it was removed): offer to set one
      document.getElementById("shortcut-missing")!.hidden = false;
      return;
    }
    document.getElementById("shortcut-hint")!.textContent = ` (or press ${shortcut} on any website)`;
    document.querySelectorAll(".shortcut-hint").forEach((hint) => (hint.textContent = `, or press ${shortcut}`));
  })
  .catch(() => {});

// Firefox has no shortcuts page of its own; it's in the add-ons manager
const isFirefox = /firefox/i.test(navigator.userAgent);
document.getElementById("set-shortcut")!.addEventListener("click", () =>
  chrome.tabs.create({ url: isFirefox ? "about:addons" : "chrome://extensions/shortcuts" })
);

// Practice notes: the real notes, kept only in this tab
const demo = startDemo();
document.getElementById("try-note")!.addEventListener("click", () => demo.addNote());
attachPracticeMenu({
  area: document.getElementById("practice-area")!,
  iconUrl: chrome.runtime.getURL("/icons/docamatic-icon-16.png"),
  addNoteAt: (x, y) => demo.addNote({ x, y }),
});

// The arrow to the toolbar: "Got it" puts it away for this visit
const toolbarTip = document.getElementById("toolbar-tip")!;
document.getElementById("toolbar-tip-close")!.addEventListener("click", () => (toolbarTip.hidden = true));

// A survey from PostHog, if there's one for this install (say, how they
// heard about Docamatic)
const surveySlot = document.getElementById("survey");
if (surveySlot) mountSurvey(surveySlot, "welcome");

// ---- A first note on a real page --------------------------------------------
// Many installs never open the popup. This puts a first note on a real page
// for them, through the same path as the popup's New note, with what to do
// next written in it.
const FIRST_NOTE_PAGE = "https://en.wikipedia.org/wiki/Post-it_note"; // "Sticky_note" redirects here
const FIRST_NOTE_TITLE = "My first note";
const FIRST_NOTE_TEXT =
  "Click here to write anything.\n\nTo add a note on any website: click Docamatic in your toolbar, then New note on this page. Or right-click where you want it.";

const loaded = (tabId: number, ms = 20000) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("timed out"));
    }, ms);
    const listener = (id: number, change: { status?: string }) => {
      if (id !== tabId || change.status !== "complete") return;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

const firstButton = document.getElementById("first-note") as HTMLButtonElement;
const firstStatus = document.getElementById("first-status")!;
const trackOnboarding = (event: string, properties?: Record<string, unknown>) =>
  store.ready().then(() => store.dispatch(trackEvent(event, properties)));

firstButton.addEventListener("click", async () => {
  firstButton.disabled = true;
  firstStatus.textContent = "Opening the page…";
  trackOnboarding("onboarding_first_note_clicked");
  let stage = "opening";
  try {
    const tab = await chrome.tabs.create({ url: FIRST_NOTE_PAGE });
    stage = "loading";
    await loaded(tab.id!);
    stage = "adding";
    const result = await chrome.runtime.sendMessage({
      type: CHROME_MESSAGES.CREATE_NOTE,
      tabId: tab.id,
      placement: "page",
      source: "welcome",
      text: FIRST_NOTE_TEXT,
    });
    if (!result?.ok) throw new Error(result?.reason || "not added");
    await store.ready();
    await store.dispatch(addTitle(result.noteId, FIRST_NOTE_TITLE, result.pageUrl));
    firstStatus.textContent = "Done! Your note is on the Wikipedia page that just opened. Go back to it any time and it'll be there.";
    trackOnboarding("onboarding_first_note_added");
  } catch {
    firstStatus.textContent =
      "That didn't work this time. Try it yourself: go to any website, click Docamatic in the toolbar, then New note on this page.";
    firstButton.disabled = false;
    trackOnboarding("onboarding_first_note_failed", { stage });
  }
});
