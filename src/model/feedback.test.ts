import { cleanFeedback, shouldAsk, withDayUsed, withShown, MAX_MESSAGE } from "./feedback";

test("Asks only people who have used Docamatic: 3 notes, on 3 different days", () => {
  let state = {};
  state = withDayUsed(state, "2026-10-01");
  state = withDayUsed(state, "2026-10-01"); // the same day counts once
  state = withDayUsed(state, "2026-10-02");
  expect(shouldAsk(state, 10, "2026-10-02")).toBe(false);
  state = withDayUsed(state, "2026-10-05");
  expect(shouldAsk(state, 2, "2026-10-05")).toBe(false);
  expect(shouldAsk(state, 3, "2026-10-05")).toBe(true);
});

test("Shown on at most 3 days, and never again once answered", () => {
  let state: Parameters<typeof shouldAsk>[0] = { days: ["a", "b", "c"] };
  for (const day of ["d1", "d2", "d3"]) {
    expect(shouldAsk(state, 5, day)).toBe(true);
    state = withShown(state, day);
  }
  expect(shouldAsk(state, 5, "d3")).toBe(true); // still today
  expect(shouldAsk(state, 5, "d4")).toBe(false);
  expect(shouldAsk({ days: ["a", "b", "c"], done: "dismissed" }, 5, "d1")).toBe(false);
  expect(shouldAsk({ days: ["a", "b", "c"], done: "sent" }, 5, "d1")).toBe(false);
});

test("Only a message, trimmed and capped, and an email that looks like one, are sent", () => {
  expect(cleanFeedback({ message: "   " })).toBeNull();
  expect(cleanFeedback({ message: 42 })).toBeNull();
  expect(cleanFeedback({ message: " Love it ", email: "me@example.com" })).toEqual({ message: "Love it", email: "me@example.com" });
  expect(cleanFeedback({ message: "Hi", email: "not an email" })).toEqual({ message: "Hi" });
  expect(cleanFeedback({ message: "x".repeat(5000) })!.message).toHaveLength(MAX_MESSAGE);
});
