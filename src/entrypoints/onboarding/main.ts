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
import { userOnboarded } from "../../redux/actions";
import { CREATE_NOTE_COMMAND } from "../../utils/constants";
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
