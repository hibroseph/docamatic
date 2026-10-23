import {
  MAX_ANSWER,
  cleanAnswers,
  cleanSurvey,
  flagKeysFor,
  personProperties,
  surveySentProperties,
  surveyToShow,
  withDayUsed,
  withDone,
  withEvent,
  withShown,
  type Survey,
} from "./surveys";

const NOW = Date.parse("2026-10-22T12:00:00Z");
const DAY = 86400000;
const raw = (overrides: Record<string, unknown> = {}) => ({
  id: "s1",
  name: "What would make it better",
  type: "api",
  start_date: "2026-10-01T00:00:00Z",
  end_date: null,
  questions: [{ id: "q1", type: "open", question: "What would make Docamatic better?" }],
  targeting_flag_key: "survey-targeting-s1",
  internal_targeting_flag_key: "survey-targeting-s1-internal",
  conditions: null,
  appearance: { thankYouMessageHeader: "Thanks!", displayThankYouMessage: true },
  ...overrides,
});
const survey = (overrides = {}) => cleanSurvey(raw(overrides), NOW)!;
const ON = { "survey-targeting-s1": { enabled: true }, "survey-targeting-s1-internal": { enabled: true } };

describe("Which surveys Docamatic can show", () => {
  test("A running API or popover survey with supported questions", () => {
    expect(survey()).toMatchObject({ id: "s1", questions: [{ id: "q1", type: "open", optional: false }], thankYou: { header: "Thanks!" } });
    expect(survey({ type: "popover" })).not.toBeNull();
  });

  test("Not ones that aren't running, are widgets, or depend on a website's page", () => {
    expect(cleanSurvey(raw({ start_date: null }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ end_date: "2026-10-20T00:00:00Z" }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ start_date: "2026-11-01T00:00:00Z" }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ type: "widget" }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ conditions: { url: "example.com" } }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ conditions: { selector: "#x" } }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ conditions: { events: { values: [{ name: "note_created", propertyFilters: { a: { values: ["1"], operator: "exact" } } }] } } }), NOW)).toBeNull();
    expect(cleanSurvey(raw({ questions: [{ id: "q", type: "matrix", question: "?" }] }), NOW)).toBeNull();
  });

  test("Text is kept plain: HTML descriptions become text, links must be https", () => {
    const s = survey({
      questions: [
        { id: "q1", type: "open", question: "Hi", description: "<b>Bold</b> &amp; <script>alert(1)</script>more" },
        { id: "q2", type: "link", question: "Read", link: "javascript:alert(1)" },
        { id: "q3", type: "link", question: "Read", link: "https://hibroseph.github.io/docamatic/" },
      ],
    });
    expect(s.questions[0]!.description).toBe("Bold & alert(1) more");
    expect(s.questions[1]!.link).toBeUndefined();
    expect(s.questions[2]!.link).toBe("https://hibroseph.github.io/docamatic/");
  });

  test("Flags to ask PostHog about", () => {
    expect(flagKeysFor([survey({ linked_flag_key: "beta" })])).toEqual(["beta", "survey-targeting-s1", "survey-targeting-s1-internal"]);
  });
});

describe("When a survey is shown", () => {
  test("When PostHog's flags say this install is targeted", () => {
    expect(surveyToShow([survey()], ON, {}, NOW)?.id).toBe("s1");
    expect(surveyToShow([survey()], { ...ON, "survey-targeting-s1": { enabled: false } }, {}, NOW)).toBeNull();
    expect(surveyToShow([survey()], {}, {}, NOW)).toBeNull();
    expect(surveyToShow([survey({ linked_flag_key: "beta", conditions: { linkedFlagVariant: "b" } })], { ...ON, beta: { enabled: true, variant: "a" } }, {}, NOW)).toBeNull();
  });

  test("Never again once answered or dismissed, and no other survey for a few days after", () => {
    const s = survey();
    expect(surveyToShow([s], ON, withDone({}, s, "dismissed", NOW - 30 * DAY), NOW)).toBeNull();
    const other = survey({ id: "s2" });
    const memory = withDone({}, s, "sent", NOW - DAY);
    expect(surveyToShow([other], ON, memory, NOW)).toBeNull();
    expect(surveyToShow([other], ON, memory, NOW + 3 * DAY)?.id).toBe("s2");
  });

  test("Shown on at most 3 days if it's neither answered nor dismissed", () => {
    const s = survey();
    let memory = {};
    for (const d of [0, 1, 2]) memory = withShown(memory, s, NOW + d * DAY);
    expect(surveyToShow([s], ON, memory, NOW + 2 * DAY)?.id).toBe("s1"); // still the third day
    expect(surveyToShow([s], ON, memory, NOW + 3 * DAY)).toBeNull();
  });

  test("Wait periods and event triggers set in PostHog", () => {
    const s = survey({ conditions: { seenSurveyWaitPeriodInDays: 14 } });
    expect(surveyToShow([s], ON, withShown({}, survey({ id: "old" }), NOW - 5 * DAY), NOW)).toBeNull();
    expect(surveyToShow([s], ON, withShown({}, survey({ id: "old" }), NOW - 15 * DAY), NOW)?.id).toBe("s1");
    const triggered = survey({ conditions: { events: { values: [{ name: "board_opened" }] } } });
    expect(surveyToShow([triggered], ON, {}, NOW)).toBeNull();
    expect(surveyToShow([triggered], ON, withEvent({}, "board_opened", NOW), NOW)?.id).toBe("s1");
  });
});

test("What PostHog targets on: counts, days used, and its answered/dismissed marks", () => {
  let memory = withDayUsed(withDayUsed(withDayUsed({}, "2026-10-01"), "2026-10-01"), "2026-10-03");
  memory = withDone(memory, survey({ current_iteration: 2 }), "sent", NOW);
  expect(personProperties({ note_count: 4 }, memory, { browser: "Chrome" })).toEqual({
    note_count: 4,
    days_used: 2,
    browser: "Chrome",
    "$survey_responded/s1/2": true,
  });
});

describe("Answers", () => {
  const s: Survey = survey({
    questions: [
      { id: "open", type: "open", question: "Why?" },
      { id: "rate", type: "rating", question: "How likely?", scale: 10, display: "number" },
      { id: "one", type: "single_choice", question: "Pick", choices: ["A", "B", "Other"], hasOpenChoice: true },
      { id: "many", type: "multiple_choice", question: "Pick some", choices: ["X", "Y"], optional: true },
    ],
  });

  test("Checked against the questions", () => {
    expect(cleanAnswers(s, { open: " Because ", rate: 0, one: "my own words", many: ["X", "Z", "X"] })).toEqual({
      open: "Because",
      rate: "0",
      one: "my own words",
      many: ["X"],
    });
    expect(cleanAnswers(s, { open: "x".repeat(5000), rate: 10, one: "A" })!.open).toHaveLength(MAX_ANSWER);
  });

  test("Missing a required answer, or out of range: nothing is sent", () => {
    expect(cleanAnswers(s, { rate: 5, one: "A" })).toBeNull();
    expect(cleanAnswers(s, { open: "a", rate: 11, one: "A" })).toBeNull();
    const noOpenChoice = survey({ questions: [{ id: "one", type: "single_choice", question: "Pick", choices: ["A"] }] });
    expect(cleanAnswers(noOpenChoice, { one: "B" })).toBeNull();
  });

  test("Sent the way PostHog's results pages read them", () => {
    const props = surveySentProperties(s, { open: "Because", rate: "9" }, "sub-1");
    expect(props).toMatchObject({
      $survey_id: "s1",
      $survey_response_open: "Because",
      $survey_response_rate: "9",
      $survey_submission_id: "sub-1",
      $survey_completed: true,
    });
    expect(props.$survey_questions).toHaveLength(4);
  });
});
