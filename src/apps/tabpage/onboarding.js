// The welcome page, opened when Docamatic is installed (and from the popup's
// tutorial button). Its job is to get people to their first note: many
// installs never open the popup at all. So besides explaining where the
// button is, it can put a first note on a real page for them, and it lets
// them try a note right here.
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore } from "redux";
import "../../styles/tokens.css";
import "../../styles/fonts.css";
import "../../../design-system/components/bundle.css";
import "./welcome.css";
import NoteList from "../../components/NoteList";
import reducer from "../../redux/reducer";
import { addNote, addText, addTitle, trackEvent, updateNotePosition, userOnboarded } from "../../redux/actions";
import { initSentry } from "../../utils/sentry";
import { createProxyStore } from "../../utils/createProxyStore";
import { generateUUID } from "../../utils/GenerateUUID";
import { noteUrlFor, redactUrl } from "../../utils/noteUrl";
import { CHROME_MESSAGES } from "../../utils/constants";

initSentry("onboarding");

// The real notes, in the background
const store = createProxyStore();
const track = (event, properties) => store.ready().then(() => store.dispatch(trackEvent(event, properties)));

store.ready().then(() => store.dispatch(userOnboarded()));

// ---- The toolbar tip ----------------------------------------------------------

document.getElementById("toolbar-tip-close").addEventListener("click", () => {
  document.getElementById("toolbar-tip").hidden = true;
});

// ---- A first note on a real page ----------------------------------------------

// (The final address: "Sticky_note" redirects here)
const FIRST_NOTE_PAGE = "https://en.wikipedia.org/wiki/Post-it_note";
const FIRST_NOTE_TITLE = "My first note";
const FIRST_NOTE_BODY =
  "Drag me by my colored top bar, and click here to write anything.<br><br>" +
  "To add a note on any website: click Docamatic in your toolbar, then the note button at the top.";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Resolves when the tab has finished loading (or rejects after `ms`)
const loaded = (tabId, ms = 20000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("timed out"));
    }, ms);
    const listener = (id, change) => {
      if (id !== tabId || change.status !== "complete") return;
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    chrome.tabs.onUpdated.addListener(listener);
  });

// Where to put the note, from Docamatic's script in that page (as the popup
// asks). It may need a moment to start after the page loads.
const pageInformation = async (tabId) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const info = await chrome.tabs.sendMessage(tabId, { action: CHROME_MESSAGES.GET_PAGE_INFORMATION });
      if (info) return info;
    } catch {
      // Not ready yet
    }
    await sleep(300);
  }
  throw new Error("page didn't answer");
};

const status = document.getElementById("first-status");
const firstButton = document.getElementById("first-note");

firstButton.addEventListener("click", async () => {
  firstButton.disabled = true;
  status.textContent = "Opening the page…";
  track("onboarding_first_note_clicked");
  let stage = "opening";
  try {
    const tab = await chrome.tabs.create({ url: FIRST_NOTE_PAGE });
    stage = "loading";
    await loaded(tab.id);
    stage = "asking the page";
    const info = await pageInformation(tab.id);
    stage = "adding";
    await store.ready();
    const id = generateUUID();
    const url = noteUrlFor(info.page);
    await store.dispatch(addNote(id, info.scrollPosition + 120, url, redactUrl(info.page)));
    // On the right, beside the article's first lines
    await store.dispatch(updateNotePosition(id, Math.max(24, (info.pageWidth || 1200) - 340), info.scrollPosition + 120, url));
    await store.dispatch(addTitle(id, FIRST_NOTE_TITLE, url));
    await store.dispatch(addText(id, FIRST_NOTE_BODY, url));
    status.textContent = "Done! Your note is on the Wikipedia page that just opened. Go back to it any time and it'll be there.";
    track("onboarding_first_note_added");
  } catch (err) {
    status.textContent =
      "That didn't work this time. Try it yourself: go to any website, click Docamatic in the toolbar, then the note button.";
    firstButton.disabled = false;
    track("onboarding_first_note_failed", { stage });
  }
});

// ---- Practice notes, right here ----------------------------------------------

// A separate store, only in this tab: practice notes aren't saved
const practice = createStore(reducer, { pages: {}, tags: [] });
const here = window.location.href;
let practiceCount = 0;

document.getElementById("practice-note").addEventListener("click", () => {
  const area = document.getElementById("practice-area").getBoundingClientRect();
  const offset = (practiceCount++ % 5) * 28;
  const x = Math.round(area.left + window.scrollX + 24 + offset);
  const y = Math.round(area.top + window.scrollY + 16 + offset);
  const id = generateUUID();
  const url = noteUrlFor(here);
  practice.dispatch(addNote(id, y, url));
  practice.dispatch(updateNotePosition(id, x, y, url));
  if (practiceCount === 1) track("onboarding_practice_note_added");
});

ReactDOM.render(
  <Provider store={practice}>
    <NoteList url={here} windowWidth={window.innerWidth} disconnected={false} />
  </Provider>,
  document.getElementById("practice-notes")
);
