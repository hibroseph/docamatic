# Tabs

A pill-shaped segmented control for switching between views of the same notes; the selected tab is highlighter yellow.

## Use

- For two to five views of one list: This page, All, Timeline, Favorites. These replace the popup's old icon column; every option has a **text label**.
- Mark the selected tab with `aria-selected="true"`. Use `role="tablist"` and `role="tab"`.
- For a setting picked from a few options (Theme, Group by) use `role="radiogroup"` and `role="radio"` instead, and mark the chosen one with `aria-checked="true"`. Radios don't take `aria-selected`.

## Don't

- Use tabs for actions (use buttons), or for more than five options (use a menu).
