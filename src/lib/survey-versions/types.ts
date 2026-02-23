// ─── Question Types ───

export type QuestionType = "slider" | "single" | "ranking" | "tags" | "open_text";

export interface SliderQuestion {
  id: string;
  type: "slider";
  question: string;
  note?: string;
  min: number;
  max: number;
  step?: number;
  minLabel: string;
  maxLabel: string;
  unit?: string;
}

export interface SingleQuestion {
  id: string;
  type: "single";
  question: string;
  note?: string;
  options: { value: string; label: string }[];
}

export interface RankingQuestion {
  id: string;
  type: "ranking";
  question: string;
  note?: string;
  options: string[];
  selectCount: number;
}

export interface TagsQuestion {
  id: string;
  type: "tags";
  question: string;
  note?: string;
  options: string[];
  maxSelect: number;
}

export interface OpenTextQuestion {
  id: string;
  type: "open_text";
  question: string;
  note?: string;
  placeholder?: string;
  multiline?: boolean;
}

export type SurveyQuestion =
  | SliderQuestion
  | SingleQuestion
  | RankingQuestion
  | TagsQuestion
  | OpenTextQuestion;

export interface SurveySection {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

// ─── Matching Config ───

export type ScorerType = "slider" | "single" | "tags" | "ranking";

export interface DimensionItemConfig {
  questionId: string;
  scorer: ScorerType;
  weight: number;
}

export interface DimensionConfig {
  name: string;
  weight: number;
  items: DimensionItemConfig[];
}

export interface HardFilterConfig {
  questionId: string;
  incompatiblePairs: [string, string][];
}

export interface MatchingConfig {
  dimensions: DimensionConfig[];
  hardFilters: HardFilterConfig[];
}

// ─── Survey Version Bundle ───

export interface SurveyVersion {
  id: string;
  name: string;
  sections: SurveySection[];
  matching: MatchingConfig;
}
