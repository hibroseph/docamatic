// The welcome page, opened once when Docamatic is installed (and from
// Settings > Quick tour).
import "../../styles/fonts.css";
import "../../styles/tokens.css";
import "../../../design-system/components/bundle.css";
import "../../styles/page-full.css";
import "./welcome.css";
import { initSentry } from "../../utils/sentry";
import { createProxyStore } from "../../utils/createProxyStore";
import { userOnboarded } from "../../redux/actions";
import { CREATE_NOTE_COMMAND } from "../../utils/constants";
import { startDemo } from "../../page/demo";

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
    if (shortcut) document.getElementById("shortcut-hint")!.textContent = `, or press ${shortcut}`;
  })
  .catch(() => {});

// Practice notes: the real notes, kept only in this tab
const demo = startDemo();
document.getElementById("try-note")!.addEventListener("click", () => demo.addNote());
