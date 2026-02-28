import type { SurveyVersion, SurveyQuestion } from "./types";
import v2 from "./v2";
import v3Lite from "./v3-lite";

function findQuestion(version: SurveyVersion, id: string): SurveyQuestion {
  for (const section of version.sections) {
    for (const q of section.questions) {
      if (q.id === id) return q;
    }
  }
  throw new Error(`Question "${id}" not found in version "${version.id}"`);
}

const vNeptune: SurveyVersion = {
  id: "neptune",
  name: "海王星挑战",

  sections: [
    {
      id: "neptune_challenge",
      title: "海王星挑战",
      description: "猜猜大多数人会怎么选？",
      questions: [
        findQuestion(v3Lite, "crush_daily"),
        findQuestion(v3Lite, "message_response"),
        findQuestion(v3Lite, "love_recharge"),
        findQuestion(v2, "reply_anxiety"),
        findQuestion(v2, "betrayal_redlines"),
        findQuestion(v2, "intimacy_low_response"),
        findQuestion(v2, "realistic_factors"),
        findQuestion(v2, "stress_partner_type"),
        findQuestion(v2, "economic_role"),
      ],
    },
  ],

  matching: {
    dimensions: [],
    hardFilters: [],
  },
};

export default vNeptune;
