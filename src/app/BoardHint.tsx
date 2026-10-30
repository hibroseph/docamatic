// The popup's first-time pointer to the board (model/hints.ts): once someone
// has a few notes, the board is the easiest way to see them all, and it's
// only a small button in the header. Shown until they open the board (from
// anywhere) or close this.
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { TEST_IDS } from "../utils/testIds";
import { dismissHint } from "../redux/actions";
import { BOARD_HINT_NOTES } from "../model/hints";
import type { State } from "../model/types";
import { CloseIcon } from "../ui/icons";
import { openBoard, type Surface } from "./hooks";

const noteCount = (state: State) =>
  Object.values(state.pages || {}).reduce((count, page) => count + (page?.notes?.length || 0), 0);

export const BoardHint = ({ surface }: { surface: Surface }) => {
  const dispatch = useDispatch();
  const show = useSelector(
    (state: State) => !state.metadata?.safe_mode && !state.metadata?.hints?.board && noteCount(state) >= BOARD_HINT_NOTES
  );
  if (!show) return null;

  return (
    <aside className="board-hint" aria-label="Tip" data-testid={TEST_IDS.boardHint}>
      <p>
        <strong>See all your notes at once</strong>
        <span>The board lays them out by tag or by website, and you can arrange them.</span>
      </p>
      <div className="board-hint__actions">
        <button
          type="button"
          className="dm-btn dm-btn--sm"
          data-testid={TEST_IDS.boardHintOpen}
          onClick={() => openBoard("hint", surface)}
        >
          Open the board
        </button>
      </div>
      <button
        type="button"
        className="dm-btn dm-btn--ghost dm-btn--icon dm-btn--sm board-hint__close"
        aria-label="Close tip"
        data-testid={TEST_IDS.boardHintDismiss}
        onClick={() => dispatch(dismissHint("board"))}
      >
        <CloseIcon size={14} />
      </button>
    </aside>
  );
};
