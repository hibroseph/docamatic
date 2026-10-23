import { eventForAction } from './analytics';
import { addNote, addText, addTitle, removeNote, trackEvent, updateNotePosition } from '../redux/actions';

test("Maps note actions to events", () => {
    expect(eventForAction(addNote("n1", 0, "https://a.com/"))).toEqual({ event: "note_created", properties: { note_id: "n1" } });
    expect(eventForAction(removeNote("n1", "https://a.com/"))).toEqual({ event: "note_deleted" });
})

test("Ignores actions that aren't interesting, like moving a note", () => {
    expect(eventForAction(updateNotePosition("n1", 1, 2, "https://a.com/"))).toBeNull();
})

test("Counts only the first edit of each note, not every keystroke", () => {
    expect(eventForAction(addText("n2", "h", "https://a.com/"))).toEqual({ event: "note_edited" });
    expect(eventForAction(addText("n2", "hi", "https://a.com/"))).toBeNull();
    expect(eventForAction(addTitle("n2", "title", "https://a.com/"))).toBeNull();
    expect(eventForAction(addTitle("n3", "title", "https://a.com/"))).toEqual({ event: "note_edited" });
})

test("Passes through explicit events from the popup", () => {
    expect(eventForAction(trackEvent("popup_page_viewed", { page: "search" })))
        .toEqual({ event: "popup_page_viewed", properties: { page: "search" } });
})

test("Never includes the page url in note events", () => {
    const { properties } = eventForAction(addNote("n4", 0, "https://private.example/", "https://private.example/?q=1"));
    expect(JSON.stringify(properties || {})).not.toContain("private.example");
})

test("Putting away a first-time hint says which, and how", () => {
  const { dismissHint } = require("../redux/actions");
  expect(eventForAction(dismissHint("first_note"))).toEqual({ event: "hint_dismissed", properties: { hint: "first_note", how: "closed" } });
  expect(eventForAction(dismissHint("board", "used"))).toEqual({ event: "hint_dismissed", properties: { hint: "board", how: "used" } });
});
