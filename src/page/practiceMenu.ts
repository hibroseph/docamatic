// Practice for the right-click menu, on the welcome page and the website.
// Right-clicking in the practice area opens a look-alike of the browser's
// menu with "Add a note here", which puts a practice note where you clicked,
// just like the real one does on other sites. (The real menu can't add notes
// to the welcome page itself: browsers don't let extensions run on their own
// pages, and on the website the extension may not be installed.)
//
// Styles: styles/practice-menu.css.

interface PracticeMenuOptions {
  /** Where right-clicking opens the menu */
  area: HTMLElement;
  /** The Docamatic icon shown next to the menu item */
  iconUrl: string;
  /** Adds a practice note at page coordinates */
  addNoteAt: (x: number, y: number) => void;
}

export const attachPracticeMenu = ({ area, iconUrl, addNoteAt }: PracticeMenuOptions) => {
  const menu = document.createElement("div");
  menu.className = "practice-menu";
  menu.setAttribute("role", "menu");
  // In the browser's top layer, above the practice notes: they use the
  // highest z-index there is, like on any website
  menu.popover = "manual";
  menu.innerHTML = `
    <div class="practice-menu__item is-muted" aria-disabled="true">Back</div>
    <div class="practice-menu__item is-muted" aria-disabled="true">Reload</div>
    <hr>
    <button type="button" class="practice-menu__item practice-menu__add" role="menuitem">
      <img src="${iconUrl}" alt="" width="16" height="16">Add a note here
    </button>
    <hr>
    <div class="practice-menu__item is-muted" aria-disabled="true">Inspect</div>`;
  document.body.appendChild(menu);
  const add = menu.querySelector<HTMLButtonElement>(".practice-menu__add")!;

  let at = { x: 0, y: 0 };
  const isOpen = () => menu.matches(":popover-open");
  const close = () => {
    if (isOpen()) menu.hidePopover();
  };
  const open = (clientX: number, clientY: number) => {
    at = { x: clientX + window.scrollX, y: clientY + window.scrollY };
    if (!isOpen()) menu.showPopover();
    // Like the browser's menu: opens at the pointer, flipped to stay on screen
    const { width, height } = menu.getBoundingClientRect();
    const left = clientX + width > window.innerWidth - 8 ? clientX - width : clientX;
    const top = clientY + height > window.innerHeight - 8 ? clientY - height : clientY;
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${Math.max(8, top)}px`;
    add.focus();
  };

  area.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    open(event.clientX, event.clientY);
  });
  // The keyboard's menu key (or Shift+F10) on the focused area works too
  area.addEventListener("keydown", (event) => {
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault();
      const box = area.getBoundingClientRect();
      open(box.left + box.width / 2, box.top + box.height / 2);
    }
  });
  add.addEventListener("click", () => {
    close();
    // The new note's top left corner lands at the click, like the real one
    addNoteAt(at.x, at.y);
    area.classList.add("is-done");
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      area.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (isOpen() && !menu.contains(event.target as Node)) close();
  });
  window.addEventListener("blur", close);
  window.addEventListener("resize", close);
  // It stays where it opened on screen, so it closes when the page scrolls
  window.addEventListener("scroll", close, { passive: true });
};
