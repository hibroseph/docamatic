import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SettingsBar } from "../components/Note/SettingsBar";
import { IconList } from "../components/Popup/PopupNavigation/IconList";
import { TagBubble } from "../components/TagBubble/TagBubble";
import { faCog, faStickyNote } from "@fortawesome/free-solid-svg-icons";
import { TEST_IDS } from "./testIds";

// Browser tests rely on these attributes reaching the DOM. Font Awesome icons
// render their own <svg>, so check the ids are passed through to it.

test("Note action icons and color choices carry their test ids", () => {
    const html = renderToStaticMarkup(
        <SettingsBar color={{ title: "#f8ac59", text: "#000" }} visible={true} url="https://a.com/" onToggleVisibility={() => {}} onColorChange={() => {}} />
    );
    for (const id of [TEST_IDS.noteFavorite, TEST_IDS.noteDelete, TEST_IDS.noteVisibility, TEST_IDS.noteDragHandle, TEST_IDS.noteColor]) {
        expect(html).toContain(`data-testid="${id}"`);
    }
    expect(html).toContain('data-color="#f8ac59"');
})

test("Popup navigation icons carry one test id per section", () => {
    const icons = [{ type: faStickyNote, name: "new" }, { type: faCog, name: "settings" }];
    const html = renderToStaticMarkup(<IconList icons={icons} page="settings" onClicky={() => {}} />);
    expect(html).toContain(`data-testid="${TEST_IDS.popupNav("new")}"`);
    expect(html).toContain(`data-testid="${TEST_IDS.popupNav("settings")}"`);
})

test("Tags carry their test id and text", () => {
    const html = renderToStaticMarkup(<TagBubble testId={TEST_IDS.noteTag} text="work" color="#08597d" removeTag={() => {}} />);
    expect(html).toContain(`data-testid="${TEST_IDS.noteTag}"`);
    expect(html).toContain('data-tag-text="work"');
})
