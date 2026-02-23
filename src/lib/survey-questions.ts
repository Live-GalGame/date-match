// ╔══════════════════════════════════════════════════════════════╗
// ║  切换问卷版本只需修改下面这一行 import                        ║
// ╚══════════════════════════════════════════════════════════════╝
import activeVersion from "./survey-versions/v2";
// import activeVersion from "./survey-versions/v1";

// ─── Re-export types (backward compatible) ───

export type {
  QuestionType,
  SliderQuestion,
  SingleQuestion,
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

// ─── Active survey data ───

export const surveyVersionId = activeVersion.id;
export const surveyVersionName = activeVersion.name;
export const surveySections = activeVersion.sections;
export const matchingConfig = activeVersion.matching;

// ─── Helper: get all question IDs by type ───

export function getQuestionsByType(type: import("./survey-versions/types").QuestionType): string[] {
  const ids: string[] = [];
  for (const section of surveySections) {
    for (const q of section.questions) {
      if (q.type === type) ids.push(q.id);
    }
  }
  return ids;
}

export function getQuestionById(id: string): import("./survey-versions/types").SurveyQuestion | undefined {
  for (const section of surveySections) {
    for (const q of section.questions) {
      if (q.id === id) return q;
    }
  }
  return undefined;
}
