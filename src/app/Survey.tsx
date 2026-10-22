// A survey written in PostHog, in the popup (model/surveys.ts, and the
// background's background/surveys.js decide which and when). One question at
// a time, drawn with Docamatic's own components; everything in it is text.
import React, { useEffect, useState } from "react";
import type { Survey as SurveyDefinition, SurveyQuestion } from "../model/surveys";
import { CHROME_MESSAGES } from "../utils/constants";
import { TEST_IDS } from "../utils/testIds";
import { openTab, type Surface } from "./hooks";

type Answer = string | string[] | number | undefined;

const record = (kind: "shown" | "dismissed" | "sent", surveyId: string, answers?: Record<string, unknown>) =>
  chrome.runtime.sendMessage({ type: CHROME_MESSAGES.SURVEY_EVENT, kind, surveyId, answers }).catch(() => ({ ok: false }));

// With an open choice, the last choice is the one that takes typed text
const isOpenChoice = (q: SurveyQuestion, choice: string) => Boolean(q.hasOpenChoice) && choice === q.choices![q.choices!.length - 1];

const Question = ({
  q,
  value,
  placeholder,
  onChange,
}: {
  q: SurveyQuestion;
  value: Answer;
  placeholder?: string;
  onChange: (value: Answer) => void;
}) => {
  // Typed text for an open choice, kept apart from the picked choices
  const [other, setOther] = useState("");
  const [otherPicked, setOtherPicked] = useState(false);

  if (q.type === "open") {
    return (
      <textarea
        className="dm-input survey__text"
        rows={3}
        aria-label={q.question}
        placeholder={placeholder || "Your answer…"}
        value={(value as string) || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (q.type === "rating") {
    const from = q.scale === 10 ? 0 : 1;
    return (
      <div className="survey__rating">
        <div className="survey__scale" role="radiogroup" aria-label={q.question}>
          {Array.from({ length: q.scale! - from + 1 }, (_, i) => from + i).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={value === n} className="survey__point" onClick={() => onChange(n)}>
              {n}
            </button>
          ))}
        </div>
        {(q.lowerBoundLabel || q.upperBoundLabel) && (
          <div className="survey__bounds">
            <span>{q.lowerBoundLabel}</span>
            <span>{q.upperBoundLabel}</span>
          </div>
        )}
      </div>
    );
  }

  if (q.type === "single_choice" || q.type === "multiple_choice") {
    const multiple = q.type === "multiple_choice";
    const picked = new Set(multiple ? (value as string[]) || [] : value ? [value as string] : []);
    const fixed = (q.choices || []).filter((choice) => !isOpenChoice(q, choice));
    const openLabel = q.hasOpenChoice ? q.choices![q.choices!.length - 1] : null;
    const emit = (choices: string[], typed: string, withOther: boolean) => {
      const all = [...choices, ...(withOther && typed.trim() ? [typed.trim()] : [])];
      onChange(multiple ? all : all[0]);
    };
    const pickedFixed = fixed.filter((choice) => picked.has(choice));
    return (
      <div className="survey__choices" role={multiple ? "group" : "radiogroup"} aria-label={q.question}>
        {fixed.map((choice) => (
          <label key={choice} className="survey__choice">
            <input
              type={multiple ? "checkbox" : "radio"}
              name={q.id}
              checked={picked.has(choice)}
              onChange={(event) => {
                if (multiple) {
                  const next = event.target.checked ? [...pickedFixed, choice] : pickedFixed.filter((c) => c !== choice);
                  emit(next, other, otherPicked);
                } else {
                  setOtherPicked(false);
                  emit([choice], other, false);
                }
              }}
            />
            {choice}
          </label>
        ))}
        {openLabel && (
          <label className="survey__choice survey__choice--open">
            <input
              type={multiple ? "checkbox" : "radio"}
              name={q.id}
              checked={otherPicked}
              onChange={(event) => {
                const on = multiple ? event.target.checked : true;
                setOtherPicked(on);
                emit(multiple ? pickedFixed : [], other, on);
              }}
            />
            {openLabel}
            <input
              className="dm-input survey__other"
              aria-label={openLabel}
              value={other}
              onFocus={() => {
                if (!otherPicked) {
                  setOtherPicked(true);
                  emit(multiple ? pickedFixed : [], other, true);
                }
              }}
              onChange={(event) => {
                setOther(event.target.value);
                emit(multiple ? pickedFixed : [], event.target.value, true);
              }}
            />
          </label>
        )}
      </div>
    );
  }

  // link
  return q.link ? (
    <button
      type="button"
      className="dm-btn dm-btn--sm"
      onClick={() => {
        openTab(q.link!);
        onChange("link clicked");
      }}
    >
      {q.buttonText || "Open"}
    </button>
  ) : null;
};

const answered = (q: SurveyQuestion, value: Answer) =>
  Array.isArray(value) ? value.length > 0 : typeof value === "number" ? true : typeof value === "string" ? value.trim().length > 0 : false;

export const SurveyPrompt = ({ surface }: { surface: Surface }) => {
  const [survey, setSurvey] = useState<SurveyDefinition | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [phase, setPhase] = useState<"asking" | "sending" | "failed" | "thanks" | "closed">("asking");

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: CHROME_MESSAGES.GET_SURVEY, surface })
      .then((result) => {
        if (!result?.survey) return;
        setSurvey(result.survey);
        record("shown", result.survey.id);
      })
      .catch(() => {});
  }, []);

  if (!survey || phase === "closed") return null;

  if (phase === "thanks") {
    return (
      <div className="survey" role="status" data-testid={TEST_IDS.survey}>
        <p className="survey__question">{survey.thankYou!.header}</p>
        {survey.thankYou!.description && <p className="survey__description">{survey.thankYou!.description}</p>}
      </div>
    );
  }

  const q = survey.questions[step]!;
  const last = step === survey.questions.length - 1;
  const value = answers[q.id];
  const canGoOn = q.optional || q.type === "link" || answered(q, value);

  const next = async () => {
    if (!last) {
      setStep(step + 1);
      return;
    }
    setPhase("sending");
    const result = await record("sent", survey.id, answers);
    if (result?.ok) setPhase(survey.thankYou ? "thanks" : "closed");
    else setPhase("failed");
  };

  return (
    <form
      className="survey"
      data-testid={TEST_IDS.survey}
      aria-label="A question from Docamatic"
      onSubmit={(event) => {
        event.preventDefault();
        if (canGoOn) next();
      }}
    >
      <p className="survey__question">{q.question}</p>
      {q.description && <p className="survey__description">{q.description}</p>}
      <Question key={q.id} q={q} value={value} placeholder={survey.placeholder} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
      {phase === "failed" && <p className="error">Couldn't send it. Check your connection and try again.</p>}
      <div className="survey__buttons">
        <button type="submit" className="dm-btn dm-btn--primary dm-btn--sm" data-testid={TEST_IDS.surveyNext} disabled={!canGoOn || phase === "sending"}>
          {phase === "sending" ? "Sending…" : q.type !== "link" && q.buttonText ? q.buttonText : last ? "Send" : "Next"}
        </button>
        <button
          type="button"
          className="dm-btn dm-btn--ghost dm-btn--sm"
          data-testid={TEST_IDS.surveyDismiss}
          onClick={() => {
            setPhase("closed");
            record("dismissed", survey.id);
          }}
        >
          No thanks
        </button>
        {survey.questions.length > 1 && (
          <span className="survey__step">
            {step + 1} of {survey.questions.length}
          </span>
        )}
      </div>
    </form>
  );
};
