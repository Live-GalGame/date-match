export const DEAL_BREAKER_TRAITS = [
  { id: "smoking", label: "吸烟", category: "lifestyle" },
  { id: "heavy_drinking", label: "经常饮酒", category: "lifestyle" },
  { id: "night_owl", label: "夜猫子（经常凌晨后睡）", category: "lifestyle" },
  { id: "gaming", label: "重度游戏玩家", category: "lifestyle" },
  { id: "vegetarian", label: "素食主义", category: "lifestyle" },
  { id: "has_pets", label: "养宠物", category: "lifestyle" },
  { id: "no_kids", label: "不想要孩子", category: "relationship" },
  { id: "open_long_distance", label: "可接受异地恋", category: "relationship" },
  { id: "divorced", label: "有过婚史", category: "relationship" },
  { id: "religious", label: "有宗教信仰", category: "values" },
  { id: "only_child", label: "独生子女", category: "family" },
  { id: "live_with_parents", label: "婚后与父母同住", category: "family" },
] as const;

export type TraitId = (typeof DEAL_BREAKER_TRAITS)[number]["id"];

export function getTraitLabel(id: string): string | undefined {
  return DEAL_BREAKER_TRAITS.find((t) => t.id === id)?.label;
}
