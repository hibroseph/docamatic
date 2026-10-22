# Asking Docamatic's users questions (PostHog Surveys)

Questions Docamatic asks in its popup are surveys written in PostHog. What to
ask, who sees it and when are all set there; no extension update is needed.
(Since 5.1. The code: `src/model/surveys.ts`, `src/background/surveys.js`,
`src/app/Survey.tsx`.)

## Making a survey

In PostHog: **Surveys → New survey**.

1. **Presentation:** choose **API** (Docamatic shows it; PostHog's own popover
   can't run in an extension). A "Popover" survey is shown the same way.
2. **Questions** Docamatic can show, one at a time:
   - Open text. The survey's placeholder text is used.
   - Rating (scales 2, 3, 5, 7 or 10; 10 is 0 to 10), with the low and high labels.
   - Single choice and multiple choice, with "open-ended choice" (the last choice takes typed text).
   - Link (only `https://` links; opens in a new tab).

   Questions are asked in order: branching isn't used. Descriptions are shown as
   plain text (no formatting). A survey with any other kind of question isn't
   shown at all.
3. **Thank you message:** its header and description are shown after Send.
4. **Display conditions**, under "Who should see this":
   - **Person properties** Docamatic sends (counts only, never notes):

     | Property | What it is |
     |---|---|
     | `note_count`, `page_count`, `tag_count`, `favorite_count` | How much they have |
     | `days_used` | Days the popup was opened on |
     | `extension_version`, `browser` | e.g. `5.1.0`, `Chrome` |
     | `internal` | `true` on your own installs |

     For example the old built-in prompt was `note_count ≥ 3` and `days_used ≥ 3`.
   - **When a user sends an event:** the survey waits until that event has
     happened on the install, e.g. `board_opened` or `note_created` (event
     property filters aren't supported).
   - **Wait period** ("don't show if they've seen a survey in the last N days").
   - A **linked feature flag** (and variant), to show it to a flag's audience.
   - Not supported, and such surveys aren't shown: URL, CSS selector, and
     action conditions (they're about websites).
5. **Launch.** Docamatic picks it up within about 3 hours (definitions are
   cached), the next time someone opens the popup.

To try one first, target `internal = true`: your own installs (unpacked ones,
or one marked with `docamaticMarkInternal()`) see it.

## What Docamatic adds, whatever is set up

- Only when usage statistics are on (Settings).
- One survey at a time, in the popup. "No thanks" or Send: that survey is never
  shown again on that install. Left alone, it's shown on at most 3 days.
- After a survey is answered or dismissed, no other survey for 3 days.
- Repeating surveys: each new iteration counts as a new survey.

## Results

Answers arrive as PostHog's standard `survey shown`, `survey dismissed` and
`survey sent` events, so the survey's results page in PostHog works. Each
event also has `extension_version`, `browser` and `internal` (filter out
`internal = true`).

"Send feedback" in Settings is separate: those arrive as `feedback_submitted`
events (`message`, optional `email`).
