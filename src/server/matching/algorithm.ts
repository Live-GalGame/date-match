import type { SurveyResponse } from "@/generated/prisma/client";
import {
  surveySections,
  matchingConfig,
  getQuestionById,
} from "@/lib/survey-questions";
import type {
  SliderQuestion,
  SingleQuestion,
  DimensionConfig,
} from "@/lib/survey-questions";

// ─── Parsed survey data ───

interface ParsedSurvey {
  userId: string;
  answers: Record<string, number | string | string[]>;
}

function parseSurvey(survey: SurveyResponse): ParsedSurvey {
  return {
    userId: survey.userId,
    answers: JSON.parse(survey.answers) as Record<string, number | string | string[]>,
  };
}

// ─── Hard filters (config-driven) ───

function shouldHardFilter(a: ParsedSurvey, b: ParsedSurvey): boolean {
  for (const config of matchingConfig.hardFilters) {
    const aVal = a.answers[config.questionId];
    const bVal = b.answers[config.questionId];
    if (typeof aVal === "string" && typeof bVal === "string") {
      for (const [x, y] of config.incompatiblePairs) {
        if (aVal === x && bVal === y) return true;
      }
    }
  }
  return false;
}

// ─── Scoring functions ───

function sliderSimilarity(a: ParsedSurvey, b: ParsedSurvey, questionId: string): number {
  const q = getQuestionById(questionId) as SliderQuestion | undefined;
  if (!q) return 0.5;
  const range = q.max - q.min;
  if (range === 0) return 1;
  const aVal = typeof a.answers[questionId] === "number" ? (a.answers[questionId] as number) : (q.min + q.max) / 2;
  const bVal = typeof b.answers[questionId] === "number" ? (b.answers[questionId] as number) : (q.min + q.max) / 2;
  return 1 - Math.abs(aVal - bVal) / range;
}

function singleMatchScore(a: ParsedSurvey, b: ParsedSurvey, questionId: string): number {
  const aVal = a.answers[questionId];
  const bVal = b.answers[questionId];
  if (typeof aVal !== "string" || typeof bVal !== "string") return 0.3;
  return aVal === bVal ? 1.0 : 0.2;
}

function tagsOverlap(a: ParsedSurvey, b: ParsedSurvey, questionId: string): number {
  const aVals = Array.isArray(a.answers[questionId]) ? (a.answers[questionId] as string[]) : [];
  const bVals = Array.isArray(b.answers[questionId]) ? (b.answers[questionId] as string[]) : [];
  if (aVals.length === 0 && bVals.length === 0) return 0.5;
  const setB = new Set(bVals);
  const intersection = aVals.filter((v) => setB.has(v)).length;
  const union = new Set([...aVals, ...bVals]).size;
  return union === 0 ? 0.5 : intersection / union;
}

function rankingCorrelation(a: ParsedSurvey, b: ParsedSurvey, questionId: string): number {
  const aRank = Array.isArray(a.answers[questionId]) ? (a.answers[questionId] as string[]) : [];
  const bRank = Array.isArray(b.answers[questionId]) ? (b.answers[questionId] as string[]) : [];
  if (aRank.length === 0 || bRank.length === 0) return 0.3;

  const shared = aRank.filter((item) => bRank.includes(item));
  if (shared.length === 0) return 0;

  let concordant = 0;
  let total = 0;
  for (let i = 0; i < shared.length; i++) {
    for (let j = i + 1; j < shared.length; j++) {
      const aI = aRank.indexOf(shared[i]);
      const aJ = aRank.indexOf(shared[j]);
      const bI = bRank.indexOf(shared[i]);
      const bJ = bRank.indexOf(shared[j]);
      if ((aI - aJ) * (bI - bJ) > 0) concordant++;
      total++;
    }
  }

  const overlapRatio = shared.length / Math.max(aRank.length, bRank.length);
  const orderScore = total > 0 ? concordant / total : 0.5;
  return overlapRatio * 0.6 + orderScore * 0.4;
}

const SCORER_MAP = {
  slider: sliderSimilarity,
  single: singleMatchScore,
  tags: tagsOverlap,
  ranking: rankingCorrelation,
} as const;

// ─── Dimension scoring (config-driven) ───

interface DimensionScore {
  name: string;
  weight: number;
  score: number;
}

function computeDimensions(a: ParsedSurvey, b: ParsedSurvey): DimensionScore[] {
  return matchingConfig.dimensions.map((dim: DimensionConfig) => ({
    name: dim.name,
    weight: dim.weight,
    score: dim.items.reduce((sum, item) => {
      const scorer = SCORER_MAP[item.scorer];
      return sum + scorer(a, b, item.questionId) * item.weight;
    }, 0),
  }));
}

function computeCompatibility(a: ParsedSurvey, b: ParsedSurvey): number {
  const dims = computeDimensions(a, b);
  const raw = dims.reduce((sum, d) => sum + d.score * d.weight, 0);
  return Math.min(99, Math.max(55, Math.round(raw * 45 + 55)));
}

// ─── Reason generation ───

const QUESTION_LABELS: Record<string, string> = {};
for (const section of surveySections) {
  for (const q of section.questions) {
    QUESTION_LABELS[q.id] = q.question;
  }
}

function generateReasons(a: ParsedSurvey, b: ParsedSurvey): string[] {
  const reasons: string[] = [];
  const dims = computeDimensions(a, b);
  const sorted = [...dims].sort((x, y) => y.score - x.score);

  const topDim = sorted[0];
  if (topDim) {
    reasons.push(`你们在「${topDim.name}」维度上高度契合`);
  }

  if (a.answers["safety_source"] === b.answers["safety_source"]) {
    const q = getQuestionById("safety_source") as SingleQuestion | undefined;
    if (q) {
      const opt = q.options.find((o) => o.value === a.answers["safety_source"]);
      if (opt) reasons.push(`你们的安全感来源一致：${opt.label.split("——")[0]}`);
    }
  }

  if (a.answers["conflict_animal"] === b.answers["conflict_animal"]) {
    const q = getQuestionById("conflict_animal") as SingleQuestion | undefined;
    if (q) {
      const opt = q.options.find((o) => o.value === a.answers["conflict_animal"]);
      if (opt) {
        const animal = opt.label.split("——")[0];
        reasons.push(`面对冲突时，你们都是${animal}型`);
      }
    }
  }

  const aFactors = Array.isArray(a.answers["realistic_factors"]) ? (a.answers["realistic_factors"] as string[]) : [];
  const bFactors = Array.isArray(b.answers["realistic_factors"]) ? (b.answers["realistic_factors"] as string[]) : [];
  const sharedFactors = aFactors.filter((f) => bFactors.includes(f));
  if (sharedFactors.length > 0 && reasons.length < 4) {
    reasons.push(`你们都看重：${sharedFactors.slice(0, 2).join("、")}`);
  }

  const sliderIds = matchingConfig.dimensions
    .flatMap((d) => d.items)
    .filter((item) => item.scorer === "slider")
    .map((item) => item.questionId);

  for (const id of sliderIds) {
    if (reasons.length >= 4) break;
    const sim = sliderSimilarity(a, b, id);
    if (sim >= 0.8) {
      reasons.push(`你们在「${QUESTION_LABELS[id]?.slice(0, 15) ?? id}」上看法接近`);
    }
  }

  if (reasons.length < 2) {
    if (sorted.length >= 2) {
      reasons.push(`你们在「${sorted[1].name}」维度上也比较匹配`);
    }
  }

  return reasons.slice(0, 4);
}

// ─── Matching ───

export interface MatchResult {
  user1Id: string;
  user2Id: string;
  compatibility: number;
  reasons: string[];
}

export function findBestMatch(
  target: SurveyResponse,
  candidates: SurveyResponse[]
): MatchResult | null {
  const parsedTarget = parseSurvey(target);
  let bestMatch: MatchResult | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    if (candidate.userId === target.userId) continue;

    const parsedCandidate = parseSurvey(candidate);

    if (shouldHardFilter(parsedTarget, parsedCandidate)) continue;

    const score = computeCompatibility(parsedTarget, parsedCandidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        user1Id: target.userId,
        user2Id: candidate.userId,
        compatibility: score,
        reasons: generateReasons(parsedTarget, parsedCandidate),
      };
    }
  }

  return bestMatch;
}

export function runMatchingRound(surveys: SurveyResponse[]): MatchResult[] {
  const opted = surveys.filter((s) => s.completed && s.optedIn);
  const matched = new Set<string>();
  const results: MatchResult[] = [];

  const shuffled = [...opted].sort(() => Math.random() - 0.5);

  for (const survey of shuffled) {
    if (matched.has(survey.userId)) continue;

    const available = shuffled.filter(
      (s) => s.userId !== survey.userId && !matched.has(s.userId)
    );

    const match = findBestMatch(survey, available);
    if (match) {
      matched.add(match.user1Id);
      matched.add(match.user2Id);
      results.push(match);
    }
  }

  return results;
}
