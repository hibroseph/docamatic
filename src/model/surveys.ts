// Surveys written in PostHog, shown in the popup by Docamatic's own code.
//
// What to ask, who sees it and when is decided in PostHog (Surveys), so it
// can change without an extension update. Only the survey *definitions* are
// fetched, as data: the Chrome Web Store doesn't allow running code from
// elsewhere, so PostHog's own survey popup (which downloads its script) is
// never used. Everything fetched is checked here and shown as plain text.
//
// Pure functions, so they can be tested without Chrome; the background
// (background/surveys.js) does the fetching and sending, and the popup
// (app/Survey.tsx) the showing.
//
// How to write surveys for Docamatic: docs/surveys.md.

export type QuestionType = "open" | "rating" | "single_choice" | "multiple_choice" | "link";

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  optional: boolean;
  buttonText?: string;
  // rating
  scale?: number;
  lowerBoundLabel?: string;
  upperBoundLabel?: string;
  // single/multiple choice; with hasOpenChoice the last choice takes typed text
  choices?: string[];
  hasOpenChoice?: boolean;
  // link
  link?: string;
}

export interface Survey {
  id: string;
  name: string;
  questions: SurveyQuestion[];
  iteration: number | null;
  iterationStartDate: string | null;
  linkedFlagKey?: string;
  linkedFlagVariant?: string;
  targetingFlagKey?: string;
  internalTargetingFlagKey?: string;
  /** No survey for this many days after the last one was seen */
  waitPeriodDays?: number;
  /** Shown only once one of these events has happened on this install */
  triggerEvents?: string[];
  placeholder?: string;
  thankYou?: { header: string; description?: string };
}

/** What this install remembers about surveys (storage.local "surveys") */
export interface SurveyMemory {
  /** Answered or dismissed, by surveyKey: never shown again */
  done?: Record<string, { how: "sent" | "dismissed"; at: number }>;
  /** Days each survey was shown on */
  shown?: Record<string, string[]>;
  /** When any survey was last seen (for wait periods) */
  lastSeenAt?: number;
  /** Event names that have happened on this install (for event triggers) */
  events?: Record<string, number>;
  /** Days the popup was opened on: how many, and the last one */
  daysUsed?: { count: number; last: string };
}

export const SURVEYS_STORAGE_KEY = "surveys";
// Limits kept in the code whatever is set up in PostHog, so people are never
// nagged: a survey is shown on at most this many days; after answering or
// dismissing one, no other for this many days
export const MAX_DAYS_SHOWN = 3;
export const MIN_DAYS_BETWEEN = 3;
const DAY_MS = 86400000;

const MAX_TEXT = 500;
const MAX_CHOICES = 20;
const SCALES = [2, 3, 5, 7, 10];
export const MAX_ANSWER = 2000;

const text = (value: unknown, max = MAX_TEXT) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const optionalText = (value: unknown, max = MAX_TEXT) => text(value, max) || undefined;

// Questions' descriptions may be written as HTML in PostHog; only their text is shown
const plain = (value: unknown) =>
  optionalText(
    typeof value === "string"
      ? value
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
      : undefined
  );

const cleanQuestion = (raw: any): SurveyQuestion | null => {
  const id = text(raw?.id, 100);
  const question = text(raw?.question);
  if (!id || !question) return null;
  const base = {
    id,
    question,
    description: plain(raw.description),
    optional: raw.optional === true,
    buttonText: optionalText(raw.buttonText, 40),
  };
  switch (raw.type) {
    case "open":
      return { ...base, type: "open" };
    case "rating":
      if (!SCALES.includes(raw.scale)) return null;
      return {
        ...base,
        type: "rating",
        scale: raw.scale,
        lowerBoundLabel: optionalText(raw.lowerBoundLabel, 60),
        upperBoundLabel: optionalText(raw.upperBoundLabel, 60),
      };
    case "single_choice":
    case "multiple_choice": {
      const choices = Array.isArray(raw.choices) ? raw.choices.map((c: unknown) => text(c, 200)).filter(Boolean).slice(0, MAX_CHOICES) : [];
      if (choices.length === 0) return null;
      return { ...base, type: raw.type, choices, hasOpenChoice: raw.hasOpenChoice === true };
    }
    case "link": {
      // Only web addresses, opened in a new tab
      const link = typeof raw.link === "string" && /^https:\/\/[^\s]+$/i.test(raw.link.trim()) ? raw.link.trim() : undefined;
      return { ...base, type: "link", link };
    }
    default:
      return null;
  }
};

/**
 * A survey Docamatic can show, from PostHog's definition, or null when it
 * can't be shown faithfully: an unknown question type, or conditions that
 * only make sense on websites (page address, element, actions). Branching
 * and translations are ignored: questions are asked in order, as written.
 */
export const cleanSurvey = (raw: any, now = Date.now()): Survey | null => {
  if (!raw || typeof raw !== "object") return null;
  const id = text(raw.id, 100);
  if (!id || (raw.type !== "api" && raw.type !== "popover")) return null;
  // Running: started and not ended (as PostHog decides it)
  if (!raw.start_date || raw.end_date) return null;
  if (Date.parse(raw.start_date) > now) return null;
  const conditions = raw.conditions || {};
  if (conditions.url || conditions.selector || conditions.actions?.values?.length) return null;
  const eventValues = conditions.events?.values;
  // Event triggers with property filters can't be checked here
  if (Array.isArray(eventValues) && eventValues.some((e: any) => e?.propertyFilters && Object.keys(e.propertyFilters).length)) return null;
  if (!Array.isArray(raw.questions) || raw.questions.length === 0) return null;
  const questions = raw.questions.map(cleanQuestion);
  if (questions.some((q: SurveyQuestion | null) => !q)) return null;
  const appearance = raw.appearance || {};
  return {
    id,
    name: text(raw.name, 200),
    questions: questions as SurveyQuestion[],
    iteration: Number.isInteger(raw.current_iteration) ? raw.current_iteration : null,
    iterationStartDate: typeof raw.current_iteration_start_date === "string" ? raw.current_iteration_start_date : null,
    linkedFlagKey: optionalText(raw.linked_flag_key, 200),
    linkedFlagVariant: optionalText(conditions.linkedFlagVariant, 200),
    targetingFlagKey: optionalText(raw.targeting_flag_key, 200),
    internalTargetingFlagKey: optionalText(raw.internal_targeting_flag_key, 200),
    waitPeriodDays: Number.isFinite(conditions.seenSurveyWaitPeriodInDays) ? conditions.seenSurveyWaitPeriodInDays : undefined,
    triggerEvents: Array.isArray(eventValues) ? eventValues.map((e: any) => text(e?.name, 200)).filter(Boolean) : undefined,
    placeholder: optionalText(appearance.placeholder, 200),
    thankYou:
      appearance.displayThankYouMessage === false
        ? undefined
        : { header: text(appearance.thankYouMessageHeader, 200) || "Thank you!", description: plain(appearance.thankYouMessageDescription) },
  };
};

/** Answers and dismissals are remembered per survey and per round of it */
export const surveyKey = (survey: Pick<Survey, "id" | "iteration">) => (survey.iteration ? `${survey.id}/${survey.iteration}` : survey.id);

/** Flag keys PostHog needs to evaluate to decide on these surveys */
export const flagKeysFor = (surveys: Survey[]) =>
  [...new Set(surveys.flatMap((s) => [s.linkedFlagKey, s.targetingFlagKey, s.internalTargetingFlagKey]).filter(Boolean) as string[])];

/**
 * What PostHog targets surveys on ("Who should see this" person properties).
 * Docamatic's events don't create person profiles, so these are sent with
 * each flags request instead. Counts only, never note contents. Includes
 * the "already answered/dismissed" marks PostHog's own survey targeting uses.
 */
export const personProperties = (
  counts: Record<string, number>,
  memory: SurveyMemory,
  extra: Record<string, string | number | boolean>
) => {
  const marks = Object.fromEntries(
    Object.entries(memory.done || {}).map(([key, { how }]) => [`$survey_${how === "sent" ? "responded" : "dismissed"}/${key}`, true])
  );
  return { ...counts, days_used: memory.daysUsed?.count || 0, ...extra, ...marks };
};

type Flags = Record<string, { enabled: boolean; variant?: string | null }>;

const flagOn = (flags: Flags, key?: string, variant?: string) => {
  if (!key) return true;
  const flag = flags[key];
  if (!flag?.enabled) return false;
  return !variant || variant === "any" || flag.variant === variant;
};

/**
 * The survey to show now, if any: running, for this install (its flags),
 * not answered or dismissed, triggered (if it waits for an event), outside
 * any wait period, and within the limits above. With `flags` null, flags
 * aren't checked: the surveys that could be shown, before asking PostHog.
 */
export const surveysToShow = (surveys: Survey[], flags: Flags | null, memory: SurveyMemory, now = Date.now(), day = new Date(now).toISOString().slice(0, 10)) => {
  const done = memory.done || {};
  const lastDone = Math.max(0, ...Object.values(done).map((d) => d.at));
  if (now - lastDone < MIN_DAYS_BETWEEN * DAY_MS) return [];
  return surveys.filter((survey) => {
    const key = surveyKey(survey);
    if (done[key]) return false;
    const shown = memory.shown?.[key] || [];
    if (shown.length >= MAX_DAYS_SHOWN && !shown.includes(day)) return false;
    if (flags && !flagOn(flags, survey.linkedFlagKey, survey.linkedFlagVariant)) return false;
    if (flags && !flagOn(flags, survey.targetingFlagKey)) return false;
    if (flags && !flagOn(flags, survey.internalTargetingFlagKey)) return false;
    // A wait period counts from the last survey seen, unless it's this one still being shown
    if (survey.waitPeriodDays && memory.lastSeenAt && shown.length === 0 && now - memory.lastSeenAt < survey.waitPeriodDays * DAY_MS) return false;
    if (survey.triggerEvents?.length && !survey.triggerEvents.some((name) => memory.events?.[name])) return false;
    return true;
  });
};

/** The one survey to show now (the first that qualifies), or null */
export const surveyToShow = (...args: Parameters<typeof surveysToShow>) => surveysToShow(...args)[0] || null;

/** Remembers that a survey was shown today */
export const withShown = (memory: SurveyMemory, survey: Survey, now = Date.now(), day = new Date(now).toISOString().slice(0, 10)): SurveyMemory => {
  const key = surveyKey(survey);
  const shown = memory.shown?.[key] || [];
  return {
    ...memory,
    lastSeenAt: now,
    shown: { ...memory.shown, [key]: shown.includes(day) ? shown : [...shown, day] },
  };
};

export const withDone = (memory: SurveyMemory, survey: Survey, how: "sent" | "dismissed", now = Date.now()): SurveyMemory => ({
  ...memory,
  lastSeenAt: now,
  done: { ...memory.done, [surveyKey(survey)]: { how, at: now } },
});

/** Counts today as a day the popup was used */
export const withDayUsed = (memory: SurveyMemory, day: string): SurveyMemory =>
  memory.daysUsed?.last === day ? memory : { ...memory, daysUsed: { count: (memory.daysUsed?.count || 0) + 1, last: day } };

export const withEvent = (memory: SurveyMemory, name: string, now = Date.now()): SurveyMemory =>
  memory.events?.[name] ? memory : { ...memory, events: { ...memory.events, [name]: now } };

/**
 * The answers that may be sent, checked against the survey: ratings within
 * the scale, choices from the list (or typed text for an open choice), text
 * capped. Null when a required question has no answer.
 */
export const cleanAnswers = (survey: Survey, answers: Record<string, unknown>) => {
  const out: Record<string, string | string[]> = {};
  for (const q of survey.questions) {
    const raw = answers?.[q.id];
    let value: string | string[] | undefined;
    if (q.type === "open") value = text(raw, MAX_ANSWER) || undefined;
    else if (q.type === "rating") {
      const n = Number(raw);
      const min = q.scale === 10 ? 0 : 1;
      if (Number.isInteger(n) && n >= min && n <= q.scale!) value = String(n);
    } else if (q.type === "single_choice") {
      const t = text(raw, 200);
      if (t && (q.choices!.includes(t) || q.hasOpenChoice)) value = t;
    } else if (q.type === "multiple_choice") {
      const list = Array.isArray(raw) ? raw.map((r) => text(r, 200)).filter(Boolean) : [];
      const valid = list.filter((t) => q.choices!.includes(t) || q.hasOpenChoice).slice(0, MAX_CHOICES + 1);
      if (valid.length) value = [...new Set(valid)];
    } else if (q.type === "link") {
      if (raw === "link clicked") value = "link clicked";
    }
    if (value === undefined) {
      if (!q.optional && q.type !== "link") return null;
      continue;
    }
    out[q.id] = value;
  }
  return out;
};

/** PostHog's properties for survey events (its results pages read these) */
export const surveyEventProperties = (survey: Survey) => ({
  $survey_id: survey.id,
  $survey_name: survey.name,
  $survey_iteration: survey.iteration,
  $survey_iteration_start_date: survey.iterationStartDate,
});

export const surveySentProperties = (survey: Survey, answers: Record<string, string | string[]>, submissionId: string) => ({
  ...surveyEventProperties(survey),
  $survey_questions: survey.questions.map(({ id, question }) => ({ id, question })),
  ...Object.fromEntries(Object.entries(answers).map(([id, value]) => [`$survey_response_${id}`, value])),
  $survey_submission_id: submissionId,
  $survey_completed: true,
});
