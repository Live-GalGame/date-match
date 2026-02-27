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

// ─── Deal-breaker profile data ───

export interface ProfileData {
  traits: string[];
  dealBreakers: string[];
}

// ─── Hard filters (config-driven + deal-breakers) ───

function shouldHardFilter(
  a: ParsedSurvey,
  b: ParsedSurvey,
  profiles?: Map<string, ProfileData>,
): boolean {
  for (const config of matchingConfig.hardFilters) {
    const aVal = a.answers[config.questionId];
    const bVal = b.answers[config.questionId];
    if (typeof aVal === "string" && typeof bVal === "string") {
      for (const [x, y] of config.incompatiblePairs) {
        if (aVal === x && bVal === y) return true;
      }
    }
  }

  if (profiles) {
    const ap = profiles.get(a.userId);
    const bp = profiles.get(b.userId);
    if (ap && bp) {
      for (const trait of bp.traits) {
        if (ap.dealBreakers.includes(trait)) return true;
      }
      for (const trait of ap.traits) {
        if (bp.dealBreakers.includes(trait)) return true;
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

const CONFLICT_ANIMAL_MATRIX: Record<string, Record<string, number>> = {
  A: { A: 0.6, B: 0.1, C: 0.8, D: 0.6, E: 0.5 },
  B: { A: 0.1, B: 0.4, C: 0.8, D: 0.4, E: 0.5 },
  C: { A: 0.8, B: 0.8, C: 1.0, D: 0.9, E: 0.8 },
  D: { A: 0.6, B: 0.4, C: 0.9, D: 0.8, E: 0.7 },
  E: { A: 0.5, B: 0.5, C: 0.8, D: 0.7, E: 0.8 },
};

const SAFETY_SOURCE_MATRIX: Record<string, Record<string, number>> = {
  A: { A: 0.5, B: 0.6, C: 0.1, D: 0.8 },
  B: { A: 0.6, B: 0.8, C: 0.7, D: 0.9 },
  C: { A: 0.1, B: 0.7, C: 0.4, D: 0.7 },
  D: { A: 0.8, B: 0.9, C: 0.7, D: 1.0 },
};

const ECONOMIC_ROLE_MATRIX: Record<string, Record<string, number>> = {
  A: { A: 1.0, B: 0.6, C: 0.4, D: 0.5 },
  B: { A: 0.6, B: 0.2, C: 0.6, D: 0.6 },
  C: { A: 0.4, B: 0.6, C: 1.0, D: 0.8 },
  D: { A: 0.5, B: 0.6, C: 0.8, D: 1.0 },
};

function singleMatchScore(a: ParsedSurvey, b: ParsedSurvey, questionId: string): number {
  const aVal = a.answers[questionId];
  const bVal = b.answers[questionId];
  if (typeof aVal !== "string" || typeof bVal !== "string") return 0.3;

  if (questionId === "conflict_animal" && CONFLICT_ANIMAL_MATRIX[aVal]?.[bVal] !== undefined) {
    return CONFLICT_ANIMAL_MATRIX[aVal][bVal];
  }
  if (questionId === "safety_source" && SAFETY_SOURCE_MATRIX[aVal]?.[bVal] !== undefined) {
    return SAFETY_SOURCE_MATRIX[aVal][bVal];
  }
  if (questionId === "economic_role" && ECONOMIC_ROLE_MATRIX[aVal]?.[bVal] !== undefined) {
    return ECONOMIC_ROLE_MATRIX[aVal][bVal];
  }

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

  const aSafety = a.answers["safety_source"] as string;
  const bSafety = b.answers["safety_source"] as string;
  if (aSafety === bSafety) {
    const q = getQuestionById("safety_source") as SingleQuestion | undefined;
    if (q) {
      const opt = q.options.find((o) => o.value === aSafety);
      if (opt) reasons.push(`你们的安全感来源一致：${opt.label.split("——")[0]}`);
    }
  } else if (SAFETY_SOURCE_MATRIX[aSafety]?.[bSafety] >= 0.8) {
    reasons.push(`你们的安全感需求形成完美的心理学互补`);
  }

  const aAnimal = a.answers["conflict_animal"] as string;
  const bAnimal = b.answers["conflict_animal"] as string;
  if (aAnimal === bAnimal) {
    const q = getQuestionById("conflict_animal") as SingleQuestion | undefined;
    if (q) {
      const opt = q.options.find((o) => o.value === aAnimal);
      if (opt) {
        const animal = opt.label.split("——")[0];
        reasons.push(`面对冲突时，你们都是${animal}型`);
      }
    }
  } else if (CONFLICT_ANIMAL_MATRIX[aAnimal]?.[bAnimal] >= 0.8) {
    reasons.push(`面对冲突时，你们的处理模式能很好地互相缓冲`);
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
  candidates: SurveyResponse[],
  profiles?: Map<string, ProfileData>,
): MatchResult | null {
  const parsedTarget = parseSurvey(target);
  let bestMatch: MatchResult | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    if (candidate.userId === target.userId) continue;

    const parsedCandidate = parseSurvey(candidate);

    if (shouldHardFilter(parsedTarget, parsedCandidate, profiles)) continue;

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

const MAX_FULL_GRAPH = 2000;
const SAMPLE_SIZE = 200;

function sampleIndices(total: number, exclude: number, count: number): number[] {
  if (total - 1 <= count) {
    return Array.from({ length: total }, (_, i) => i).filter((i) => i !== exclude);
  }
  const indices = new Set<number>();
  while (indices.size < count) {
    const r = Math.floor(Math.random() * total);
    if (r !== exclude) indices.add(r);
  }
  return [...indices];
}

export function runMatchingRound(
  surveys: SurveyResponse[],
  profiles?: Map<string, ProfileData>,
): MatchResult[] {
  const opted = surveys.filter((s) => s.completed && s.optedIn);
  const matched = new Set<string>();
  const results: MatchResult[] = [];

  interface Edge {
    i: number;
    j: number;
    score: number;
  }

  const parsedMap = new Map<string, ParsedSurvey>();
  for (const s of opted) {
    parsedMap.set(s.userId, parseSurvey(s));
  }

  const edges: Edge[] = [];
  const useFull = opted.length <= MAX_FULL_GRAPH;

  if (useFull) {
    for (let i = 0; i < opted.length; i++) {
      for (let j = i + 1; j < opted.length; j++) {
        const p1 = parsedMap.get(opted[i].userId)!;
        const p2 = parsedMap.get(opted[j].userId)!;
        if (shouldHardFilter(p1, p2, profiles)) continue;
        edges.push({ i, j, score: computeCompatibility(p1, p2) });
      }
    }
  } else {
    // Large pool: each user evaluates a random sample of candidates
    const seen = new Set<string>();
    for (let i = 0; i < opted.length; i++) {
      const candidates = sampleIndices(opted.length, i, SAMPLE_SIZE);
      const p1 = parsedMap.get(opted[i].userId)!;
      for (const j of candidates) {
        const key = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const p2 = parsedMap.get(opted[j].userId)!;
        if (shouldHardFilter(p1, p2, profiles)) continue;
        edges.push({ i: Math.min(i, j), j: Math.max(i, j), score: computeCompatibility(p1, p2) });
      }
    }
  }

  edges.sort((a, b) => b.score - a.score);

  for (const edge of edges) {
    const u1 = opted[edge.i].userId;
    const u2 = opted[edge.j].userId;
    if (matched.has(u1) || matched.has(u2)) continue;

    matched.add(u1);
    matched.add(u2);

    const p1 = parsedMap.get(u1)!;
    const p2 = parsedMap.get(u2)!;

    results.push({
      user1Id: u1,
      user2Id: u2,
      compatibility: edge.score,
      reasons: generateReasons(p1, p2),
    });
  }

  return results;
}
