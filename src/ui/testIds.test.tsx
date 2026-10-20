// @vitest-environment jsdom
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { createStore } from "redux";
import notesApp from "../redux/reducer";
import { TEST_IDS } from "../utils/testIds";
import { UndoProvider } from "./undo";
import { StickyNote } from "../page/StickyNote";
import { NoteCard } from "../app/NoteCard";
import { App } from "../app/App";
import fixture from "../redux/__fixtures__/storage-schema-v1.json";
import type { NoteRecord, State } from "../model/types";

// Browser tests rely on these attributes reaching the DOM. Ids that shipped
// before must keep working (see utils/testIds.js).

const URL = "https://www.example.com/recipes/pasta";
const state = fixture as unknown as State;
const record: NoteRecord = { note: state.pages[URL]!.notes[0]!, pageUrl: URL };

const render = (element: React.ReactElement) =>
  renderToStaticMarkup(
    <Provider store={createStore(notesApp, state as never)}>
      <UndoProvider>{element}</UndoProvider>
    </Provider>
  );

const sticky = () =>
  render(
    <StickyNote record={record} tags={state.tags} windowWidth={1600} zIndex={0} onBringToFront={() => {}} disconnected={false} autoFocus={false} />
  );

test("A note on the page carries its test ids", () => {
  const html = sticky();
  for (const id of [
    TEST_IDS.note,
    TEST_IDS.noteTitle,
    TEST_IDS.noteBody,
    TEST_IDS.noteFavorite,
    TEST_IDS.noteDelete,
    TEST_IDS.noteVisibility,
    TEST_IDS.noteDragHandle,
    TEST_IDS.noteColor,
    TEST_IDS.noteTag,
    TEST_IDS.noteAddTag,
  ]) {
    expect(html).toContain(`data-testid="${id}"`);
  }
  expect(html).toContain(`data-note-id="${record.note.id}"`);
  expect(html).toContain('data-tag-text="cooking"');
});

test("A note from before 5.1 is drawn at its saved position and width, in its own color", () => {
  const html = sticky();
  const { x, y } = record.note.position;
  expect(html).toContain(`translate(${x}px,${y}px)`);
  expect(html).toContain(`width:${record.note.size.width}px`);
  // Its old color stays, as the band across the top, and is offered in the color menu
  expect(html).toContain("note--legacy");
  expect(html).toContain(`--band:${record.note.color.title}`);
  expect(html).toContain(`data-color="${record.note.color.title}"`);
});

test("A note in a list carries the ids, including Open page", () => {
  const html = render(<NoteCard record={record} />);
  for (const id of [TEST_IDS.note, TEST_IDS.noteTitle, TEST_IDS.noteBody, TEST_IDS.noteFavorite, TEST_IDS.noteOpenPage]) {
    expect(html).toContain(`data-testid="${id}"`);
  }
});

test("The popup keeps one navigation id per section", () => {
  const html = render(<App surface="popup" />);
  for (const name of ["new", "current", "search", "sort", "hearted", "settings"]) {
    expect(html).toContain(`data-testid="${TEST_IDS.popupNav(name)}"`);
  }
  expect(html).toContain(`data-testid="${TEST_IDS.searchInput}"`);
});
