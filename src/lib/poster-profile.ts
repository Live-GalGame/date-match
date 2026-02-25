type Answers = Record<string, number | string | string[]>;

interface PosterBar {
  left: string;
  right: string;
  pct: number;
  label: string;
}

export interface PosterProfile {
  archetype: string;
  bars: PosterBar[];
}

function singleScore(
  answer: unknown,
  mapping: Record<string, number>,
): number | null {
  if (typeof answer !== "string") return null;
  return mapping[answer] ?? null;
}

function weightedAvg(
  items: Array<{ score: number | null; weight: number }>,
): number {
  let wSum = 0;
  let sSum = 0;
  for (const { score, weight } of items) {
    if (score == null) continue;
    sSum += score * weight;
    wSum += weight;
  }
  return wSum > 0 ? sSum / wSum : 50;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function stretch(raw: number): number {
  return clamp(Math.round(50 + (raw - 50) * 1.4), 10, 90);
}

// ═══════════════════════════════════════════
//  v3-lite dimension scorers
// ═══════════════════════════════════════════

function liteConnection(a: Answers): number {
  return weightedAvg([
    {
      score: singleScore(a.no_reply_reaction, {
        A: 88,
        B: 72,
        C: 22,
        D: 55,
      }),
      weight: 0.3,
    },
    {
      score: singleScore(a.love_recharge, { A: 78, B: 58, C: 48, D: 28 }),
      weight: 0.25,
    },
    {
      score: singleScore(a.opposite_sex_boundary, {
        A: 12,
        B: 38,
        C: 72,
        D: 88,
      }),
      weight: 0.25,
    },
    {
      score: singleScore(a.sns_attitude, { A: 85, B: 55, C: 22, D: 45 }),
      weight: 0.2,
    },
  ]);
}

function liteDecision(a: Answers): number {
  return weightedAvg([
    {
      score: singleScore(a.conflict_style, { A: 62, B: 82, C: 28, D: 55 }),
      weight: 0.35,
    },
    {
      score: singleScore(a.message_response, { A: 68, B: 22, C: 48, D: 78 }),
      weight: 0.35,
    },
    {
      score: singleScore(a.dealbreaker, { A: 58, B: 48, C: 38, D: 72 }),
      weight: 0.3,
    },
  ]);
}

function liteAction(a: Answers): number {
  return weightedAvg([
    {
      score: singleScore(a.crush_daily, { A: 28, B: 55, C: 18, D: 92 }),
      weight: 0.35,
    },
    {
      score: singleScore(a.first_date, { A: 35, B: 48, C: 42, D: 78 }),
      weight: 0.3,
    },
    {
      score: singleScore(a.ideal_relationship, {
        A: 82,
        B: 28,
        C: 88,
        D: 22,
      }),
      weight: 0.35,
    },
  ]);
}

// ═══════════════════════════════════════════
//  v2 (deep) dimension scorers
// ═══════════════════════════════════════════

function deepConnection(a: Answers): number {
  const replyAnxiety =
    typeof a.reply_anxiety === "number"
      ? clamp(((24 - a.reply_anxiety) / 24) * 100, 0, 100)
      : null;
  const warmth =
    typeof a.intimacy_warmth === "number"
      ? (a.intimacy_warmth / 10) * 100
      : null;
  const passion =
    typeof a.intimacy_passion === "number"
      ? (a.intimacy_passion / 10) * 100
      : null;

  return weightedAvg([
    { score: replyAnxiety, weight: 0.25 },
    { score: warmth, weight: 0.25 },
    { score: passion, weight: 0.15 },
    {
      score: singleScore(a.life_rhythm, { A: 88, B: 55, C: 18 }),
      weight: 0.15,
    },
    {
      score: singleScore(a.intimacy_low_response, {
        A: 65,
        B: 72,
        C: 50,
        D: 80,
        E: 28,
      }),
      weight: 0.2,
    },
  ]);
}

function deepDecision(a: Answers): number {
  return weightedAvg([
    {
      score: singleScore(a.safety_source, { A: 22, B: 72, C: 45, D: 88 }),
      weight: 0.3,
    },
    {
      score: singleScore(a.conflict_animal, {
        A: 42,
        B: 62,
        C: 78,
        D: 68,
        E: 55,
      }),
      weight: 0.2,
    },
    {
      score: singleScore(a.economic_role, { A: 82, B: 68, C: 48, D: 22 }),
      weight: 0.25,
    },
    {
      score: singleScore(a.family_resources, {
        A: 72,
        B: 55,
        C: 38,
        D: 62,
      }),
      weight: 0.25,
    },
  ]);
}

function deepAction(a: Answers): number {
  const adventure =
    typeof a.relationship_adventure === "number"
      ? (a.relationship_adventure / 10) * 100
      : null;

  return weightedAvg([
    { score: adventure, weight: 0.35 },
    {
      score: singleScore(a.growth_sync, { A: 28, B: 48, C: 82, D: 62 }),
      weight: 0.25,
    },
    {
      score: singleScore(a.stage_difference, {
        A: 22,
        B: 48,
        C: 68,
        D: 78,
      }),
      weight: 0.2,
    },
    {
      score: singleScore(a.city_trajectory, { A: 78, B: 68, C: 32, D: 42 }),
      weight: 0.2,
    },
  ]);
}

// ═══════════════════════════════════════════
//  Dynamic bar labels
// ═══════════════════════════════════════════

function connectionLabel(pct: number): string {
  if (pct >= 75) return "深度融合型选手";
  if (pct >= 60) return "渴望深层情感连接";
  if (pct >= 45) return "亲密与独处兼得";
  if (pct >= 30) return "注重个人边界";
  return "享受独立空间";
}

function decisionLabel(pct: number): string {
  if (pct >= 75) return "冷静分析型选手";
  if (pct >= 60) return "理性决策为主";
  if (pct >= 45) return "理性与感性并行";
  if (pct >= 30) return "偏向跟随直觉";
  return "感性直觉驱动";
}

function actionLabel(pct: number): string {
  if (pct >= 75) return "行动力爆表";
  if (pct >= 60) return "积极进取型";
  if (pct >= 45) return "张弛有度";
  if (pct >= 30) return "谨慎稳健前行";
  return "稳扎稳打";
}

// ═══════════════════════════════════════════
//  27 archetypes (3 dims × 3 levels)
// ═══════════════════════════════════════════

const ARCHETYPES: Record<string, string> = {
  // High connection (H)
  HHH: "理想建筑师",
  HHM: "深情策划家",
  HHL: "安全港湾",
  HMH: "热情探索者",
  HMM: "温暖共鸣者",
  HML: "温柔守望者",
  HLH: "浪漫先锋",
  HLM: "感性连接者",
  HLL: "心灵守护者",

  // Medium connection (M)
  MHH: "冷静开拓者",
  MHM: "平衡策略师",
  MHL: "稳健引航者",
  MMH: "灵活探索者",
  MMM: "全能适配者",
  MML: "从容观察者",
  MLH: "直觉冒险家",
  MLM: "自由感知者",
  MLL: "静水流深者",

  // Low connection (L)
  LHH: "独立征途者",
  LHM: "冷峻战略家",
  LHL: "远见守望者",
  LMH: "洒脱行者",
  LMM: "神秘探险家",
  LML: "超然旅行者",
  LLH: "自由灵魂",
  LLM: "率性生活家",
  LLL: "独行侠",
};

function bucket(v: number): "H" | "M" | "L" {
  if (v >= 60) return "H";
  if (v >= 40) return "M";
  return "L";
}

function pickArchetype(conn: number, dec: number, act: number): string {
  const key = `${bucket(conn)}${bucket(dec)}${bucket(act)}`;
  return ARCHETYPES[key] ?? "灵魂探索者";
}

// ═══════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════

export function computePosterProfile(
  answers: Answers,
  versionId: "v3-lite" | "v2",
  liteAnswers?: Answers,
): PosterProfile {
  let connRaw: number;
  let decRaw: number;
  let actRaw: number;

  if (liteAnswers && Object.keys(liteAnswers).length > 0) {
    connRaw = liteConnection(liteAnswers) * 0.4 + deepConnection(answers) * 0.6;
    decRaw = liteDecision(liteAnswers) * 0.4 + deepDecision(answers) * 0.6;
    actRaw = liteAction(liteAnswers) * 0.4 + deepAction(answers) * 0.6;
  } else if (versionId === "v3-lite") {
    connRaw = liteConnection(answers);
    decRaw = liteDecision(answers);
    actRaw = liteAction(answers);
  } else {
    connRaw = deepConnection(answers);
    decRaw = deepDecision(answers);
    actRaw = deepAction(answers);
  }

  const archetype = pickArchetype(connRaw, decRaw, actRaw);

  const conn = stretch(connRaw);
  const dec = stretch(decRaw);
  const act = stretch(actRaw);

  return {
    archetype,
    bars: [
      {
        left: "独立自主",
        right: "深度融合",
        pct: conn,
        label: connectionLabel(conn),
      },
      {
        left: "感性直觉",
        right: "理性稳健",
        pct: dec,
        label: decisionLabel(dec),
      },
      {
        left: "稳步平航",
        right: "战术激进",
        pct: act,
        label: actionLabel(act),
      },
    ],
  };
}
