export type Answers = Record<string, number | string | string[]>;
export type VersionId = "v3-lite" | "v2";

export type Gender = "" | "男" | "女" | "其他";
export type OtherGenderOption = "" | "不愿意透露" | "武装直升机";
export type DatingPref = "" | "男" | "女" | "不愿意透露";

export interface PersistedSurveyState {
  answers: Answers;
  liteAnswers: Answers;
  selectedVersion: VersionId | null;
  currentIndex: number;
  gender: Gender;
  otherGender: OtherGenderOption;
  datingPreference: DatingPref;
  genderDone: boolean;
  email: string;
  displayName: string;
  education: string;
  schoolTier: string;
  matchStrategy?: string;
}

export function loadPersistedSurveyState(): Partial<PersistedSurveyState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("surveyState");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch (e) {
    console.error("Failed to load survey state:", e);
    return {};
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export const GENDER_OPTIONS: { value: Gender; emoji: string; label: string }[] = [
  { value: "男", emoji: "👨", label: "男" },
  { value: "女", emoji: "👩", label: "女" },
  { value: "其他", emoji: "🌈", label: "其他" },
];

export const OTHER_GENDER_OPTIONS: { value: OtherGenderOption; label: string }[] = [
  { value: "不愿意透露", label: "不愿意透露" },
  { value: "武装直升机", label: "武装直升机" },
];

export const DATING_OPTIONS: { value: DatingPref; emoji: string; label: string }[] = [
  { value: "男", emoji: "👨", label: "男" },
  { value: "女", emoji: "👩", label: "女" },
  { value: "不愿意透露", emoji: "🤷", label: "不愿意透露" },
];

export const HELICOPTER_QUESTIONS = [
  {
    id: "heli_hunt",
    question: "锁定目标（暗恋）时，你的日常机动是？",
    subtitle: "索敌/开火主动性",
    options: [
      { value: "A", emoji: "📡", label: "开启雷达超视距扫描，偷偷收集对方的红外特征。" },
      { value: "B", emoji: "✈️", label: "精心伪装成民航客机，在 TA 的日常航线上来回盘旋制造「偶遇」。" },
      { value: "C", emoji: "🎯", label: "火控系统锁定了又取消，取消了又锁定，不敢按下发射键。" },
      { value: "D", emoji: "🚀", label: "直接挂满地狱火导弹，低空通场硬核表白！" },
    ],
  },
  {
    id: "heli_comms",
    question: "接收到心上机（僚机）的无线电信号，你的第一反应？",
    subtitle: "通讯坦诚度 / 战术策略性",
    options: [
      { value: "A", emoji: "📻", label: "保持无线电静默 3 分钟——不能显得太上头，要有主战装备的矜持。" },
      { value: "B", emoji: "🔥", label: "旋翼转速拉满！最高优先权！秒回塔台！" },
      { value: "C", emoji: "🛰️", label: "截获频段发给指挥部，召唤预警机智囊团分析信号情报。" },
      { value: "D", emoji: "🕶️", label: "开启加密频段，精调发射功率，发送一段毫无破绽的摩斯密码。" },
    ],
  },
  {
    id: "heli_date",
    question: "第一次联合编队飞行（约会），你选？",
    subtitle: "巡航舒适区 / 任务风格",
    options: [
      { value: "A", emoji: "🍿", label: "去低空看防空火力网交织——不用找话题，还有超棒的视觉特效。" },
      { value: "B", emoji: "⛽", label: "一起去找空中加油机——边「吨吨吨」滋燃油边聊最放松。" },
      { value: "C", emoji: "🌅", label: "沿海岸线超低空巡逻，边飞边聊最自然。" },
      { value: "D", emoji: "💥", label: "联合实弹演习——一起端掉一个敌方的雷达站。" },
    ],
  },
] as const;

export const HELICOPTER_PHOTOS = [
  "/helicopter1.png",
  "/helicopter2.png",
  "/helicopter3.png",
];
