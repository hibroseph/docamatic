// Shared by every page of the website: styles, and the live demo on the
// home page (the extension's real notes, kept only in this tab).
import "../src/styles/fonts.css";
import "../src/styles/tokens.css";
import "../design-system/components/bundle.css";
import "../src/styles/practice-menu.css";
import "./site.css";
import { startDemo, type DemoNote } from "../src/page/demo";
import { attachPracticeMenu } from "../src/page/practiceMenu";

const art = document.getElementById("hero-art");
const tryButton = document.getElementById("try-note");

if (art && tryButton) {
  // Notes sit at page coordinates, like on any website; these start in the
  // space beside the headline (below it on phones)
  const box = art.getBoundingClientRect();
  const left = box.left + window.scrollX;
  const top = box.top + window.scrollY;
  const narrow = box.width < 420;
  const width = Math.min(240, box.width - 16);

  const seed: DemoNote[] = [
    {
      x: left + (narrow ? 0 : 24),
      y: top + 8,
      width,
      title: "Try me",
      body: "Drag me by my top edge. Type anywhere in here. The ⋯ menu has colors and tags.",
      tags: ["demo"],
    },
    {
      x: left + (narrow ? Math.max(0, box.width - width) : box.width - width - 8),
      y: top + (narrow ? 196 : 132),
      width,
      color: "pink",
      title: "Still here tomorrow",
      body: "Notes stay exactly where you put them, every time you come back.",
    },
    ...(narrow
      ? []
      : [
          {
            x: left + 64,
            y: top + 300,
            width: 220,
            color: "blue" as const,
            title: "Find it later",
            body: "Tag notes to find them again from any page.",
            tags: ["ideas", "to read"],
          },
        ]),
  ];

  // A note on one message in the example inbox; it scrolls with the list
  const panel = document.getElementById("demo-panel");
  const row = panel?.children[1];
  if (panel && row) {
    const rowBox = row.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const noteWidth = Math.min(200, panelBox.width - 24);
    seed.push({
      x: panelBox.right + window.scrollX - noteWidth - 12,
      y: rowBox.top + window.scrollY + 6,
      width: noteWidth,
      color: "green",
      title: "By Tuesday",
      body: "Send Sam the budget numbers.",
      inPanel: "#demo-panel",
    });
  }

  const demo = startDemo(seed);
  tryButton.addEventListener("click", () => demo.addNote());
  // Right-click practice, the other way to add a note
  // (favicon.png is published next to every page)
  attachPracticeMenu({ area: art, iconUrl: "favicon.png", addNoteAt: (x, y) => demo.addNote({ x, y }) });
}
