import { cleanFeedback, MAX_MESSAGE } from "./feedback";

test("Only a message, trimmed and capped, and an email that looks like one, are sent", () => {
  expect(cleanFeedback({ message: "   " })).toBeNull();
  expect(cleanFeedback({ message: 42 })).toBeNull();
  expect(cleanFeedback({ message: " Love it ", email: "me@example.com" })).toEqual({ message: "Love it", email: "me@example.com" });
  expect(cleanFeedback({ message: "Hi", email: "not an email" })).toEqual({ message: "Hi" });
  expect(cleanFeedback({ message: "x".repeat(5000) })!.message).toHaveLength(MAX_MESSAGE);
});
