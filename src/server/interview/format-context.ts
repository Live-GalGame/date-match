/**
 * 将用户的问卷 JSON 答案转为 AI 可读的自然语言摘要。
 * 供 Interview System Prompt 使用，让 AI 知道用户已经回答了哪些内容。
 */

import { getSurveyVersion } from "@/lib/survey-questions";
import type {
  SurveyQuestion,
  SliderQuestion,
  SingleQuestion,
  RankingQuestion,
  TagsQuestion,
} from "@/lib/survey-questions";

type Answers = Record<string, string | number | string[]>;

function formatAnswer(q: SurveyQuestion, value: string | number | string[]): string {
  switch (q.type) {
    case "slider": {
      const sq = q as SliderQuestion;
      return `${value}${sq.unit ?? ""}（范围 ${sq.minLabel} ${sq.min} ~ ${sq.maxLabel} ${sq.max}）`;
    }
    case "single": {
      const singleQ = q as SingleQuestion;
      const opt = singleQ.options.find((o) => o.value === value);
      return opt ? opt.label : String(value);
    }
    case "ranking": {
      if (!Array.isArray(value)) return String(value);
      return value.map((item, i) => `${i + 1}. ${item}`).join("  →  ");
    }
    case "tags": {
      if (!Array.isArray(value)) return String(value);
      return value.join("、");
    }
    case "open_text": {
      return String(value);
    }
    default:
      return String(value);
  }
}

export function formatSurveyContext(answers: Answers): string {
  const versionId =
    typeof answers._surveyVersion === "string" ? answers._surveyVersion : "v2";

  const version = getSurveyVersion(versionId);
  if (!version) return "(问卷版本未找到)";

  const lines: string[] = [`问卷版本：${version.name}（${versionId}）`, ""];

  for (const section of version.sections) {
    const sectionAnswers: string[] = [];

    for (const q of section.questions) {
      const val = answers[q.id];
      if (val === undefined || val === null || val === "") continue;

      const formatted = formatAnswer(q, val);
      sectionAnswers.push(`- ${q.question}\n  → ${formatted}`);
    }

    if (sectionAnswers.length > 0) {
      lines.push(`【${section.title}】${section.description}`);
      lines.push(...sectionAnswers);
      lines.push("");
    }
  }

  // Include matchStrategy if present
  if (answers.matchStrategy) {
    const stratLabels: Record<string, string> = {
      "1": "专注模式（每周只匹配 1 位）",
      "2-3": "标准模式（每周 2-3 位）",
      "4+": "广撒网模式（每周 4+ 位）",
    };
    lines.push(`【匹配策略偏好】${stratLabels[String(answers.matchStrategy)] ?? answers.matchStrategy}`);
  }

  return lines.join("\n");
}
