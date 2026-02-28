import v2Deep from "./survey-versions/v2";
import v3Lite from "./survey-versions/v3-lite";
import vNeptune from "./survey-versions/v-neptune";
import type { SurveyVersion, SurveyQuestion, QuestionType } from "./survey-versions/types";

// ─── Re-export types ───

export type {
  QuestionType,
  SliderQuestion,
  SingleQuestion,
  SingleQuestionOption,
  RankingQuestion,
  TagsQuestion,
  OpenTextQuestion,
  SurveyQuestion,
  SurveySection,
  MatchingConfig,
  DimensionConfig,
  HardFilterConfig,
  SurveyVersion,
} from "./survey-versions/types";

// ─── Multi-version registry ───

const versions: Record<string, SurveyVersion> = {
  "v2": v2Deep,
  "v3-lite": v3Lite,
  "neptune": vNeptune,
};

export function getSurveyVersion(id: string): SurveyVersion | undefined {
  return versions[id];
}

export { v3Lite, v2Deep, vNeptune };

// ─── Default active version (backward compat for matching algorithm) ───

export const surveyVersionId = v2Deep.id;
export const surveyVersionName = v2Deep.name;
export const surveySections = v2Deep.sections;
export const matchingConfig = v2Deep.matching;

// ─── Helpers ───

export function getQuestionsByType(type: QuestionType): string[] {
  const ids: string[] = [];
  for (const section of surveySections) {
    for (const q of section.questions) {
      if (q.type === type) ids.push(q.id);
    }
  }
  return ids;
}

export function getQuestionById(id: string): SurveyQuestion | undefined {
  for (const v of Object.values(versions)) {
    for (const section of v.sections) {
      for (const q of section.questions) {
        if (q.id === id) return q;
      }
    }
  }
  return undefined;
}
