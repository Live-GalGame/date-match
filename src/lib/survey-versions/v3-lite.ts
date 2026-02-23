import type { SurveyVersion } from "./types";

const v3Lite: SurveyVersion = {
  id: "v3-lite",
  name: "关系基因匹配测试·快速版",

  sections: [
    {
      id: "attraction",
      title: "心动信号",
      description: "你的恋爱雷达是什么频率？",
      questions: [
        {
          id: "crush_daily",
          type: "single",
          question: "暗恋的时候，你的日常是？",
          options: [
            { value: "A", label: "社交考古到2019年", emoji: "🕵️" },
            { value: "B", label: "精心制造偶遇", emoji: "😎" },
            { value: "C", label: "打了又删，删了又打", emoji: "🫠" },
            { value: "D", label: "直球出击，不搞暧昧", emoji: "🔥" },
          ],
        },
        {
          id: "message_response",
          type: "single",
          question: "收到喜欢的人消息，你的第一反应？",
          options: [
            { value: "A", label: "强忍3分钟才回", emoji: "⏱️" },
            { value: "B", label: "秒回！手速超越打游戏", emoji: "⚡" },
            { value: "C", label: "截图发群，召唤智囊团", emoji: "📱" },
            { value: "D", label: "精心编辑一条完美回复", emoji: "✍️" },
          ],
        },
        {
          id: "first_date",
          type: "single",
          question: "第一次约会，你选？",
          options: [
            { value: "A", label: "看电影/展览", emoji: "🎬" },
            { value: "B", label: "找个好吃的约饭", emoji: "🍜" },
            { value: "C", label: "散步闲逛边走边聊", emoji: "🚶" },
            { value: "D", label: "一起打游戏/剧本杀", emoji: "🎮" },
          ],
        },
      ],
    },

    {
      id: "interaction",
      title: "相处模式",
      description: "谈恋爱的你是什么画风？",
      questions: [
        {
          id: "love_recharge",
          type: "single",
          question: "恋爱中，什么让你瞬间「满血复活」？",
          options: [
            { value: "A", label: "一个拥抱就够了", emoji: "🤗" },
            { value: "B", label: "聊天停不下来", emoji: "💬" },
            { value: "C", label: "收到用心小惊喜", emoji: "🎁" },
            { value: "D", label: "安静待在一起就好", emoji: "🛋️" },
          ],
        },
        {
          id: "no_reply_reaction",
          type: "single",
          question: "TA 一整天没回你消息，你的内心戏是？",
          options: [
            { value: "A", label: "分手文案已备好", emoji: "😤" },
            { value: "B", label: "翻记录看我说错了啥", emoji: "🥺" },
            { value: "C", label: "应该在忙吧", emoji: "🤷" },
            { value: "D", label: "直接打电话问", emoji: "📞" },
          ],
        },
        {
          id: "sns_attitude",
          type: "single",
          question: "恋爱后，朋友圈怎么安排？",
          options: [
            { value: "A", label: "即刻官宣！", emoji: "📢" },
            { value: "B", label: "偶尔晒，不刻意", emoji: "📸" },
            { value: "C", label: "低调才是浪漫", emoji: "🔐" },
            { value: "D", label: "看 TA 什么态度", emoji: "👀" },
          ],
        },
        {
          id: "conflict_style",
          type: "single",
          question: "吵架了，你大概率是？",
          options: [
            { value: "A", label: "当场说清楚！不过夜", emoji: "🌋" },
            { value: "B", label: "先冷静，我需要独处", emoji: "🧊" },
            { value: "C", label: "先道歉，不想冷战", emoji: "🏳️" },
            { value: "D", label: "编辑一大段话发过去", emoji: "📝" },
          ],
        },
      ],
    },

    {
      id: "boundaries",
      title: "底线与灵魂",
      description: "最深处的你，在意什么？",
      questions: [
        {
          id: "dealbreaker",
          type: "single",
          question: "最不能接受另一半做的事？",
          options: [
            { value: "A", label: "对我说谎或隐瞒", emoji: "🤥" },
            { value: "B", label: "和暧昧对象保持联系", emoji: "📱" },
            { value: "C", label: "在朋友面前让我丢脸", emoji: "🙄" },
            { value: "D", label: "需要时人间蒸发", emoji: "👻" },
          ],
        },
        {
          id: "opposite_sex_boundary",
          type: "single",
          question: "TA 和异性朋友单独吃饭，你？",
          options: [
            { value: "A", label: "完全OK，吃开心", emoji: "😊" },
            { value: "B", label: "行，但提前说一声", emoji: "🧐" },
            { value: "C", label: "看什么朋友…", emoji: "🤨" },
            { value: "D", label: "约我一起去啊！", emoji: "😤" },
          ],
        },
        {
          id: "ideal_relationship",
          type: "single",
          question: "你理想中的关系是什么「画风」？",
          options: [
            { value: "A", label: "每天都有心跳感", emoji: "🔥" },
            { value: "B", label: "细水长流的温暖", emoji: "☀️" },
            { value: "C", label: "一起探索世界", emoji: "🎢" },
            { value: "D", label: "像回家一样安心", emoji: "🏠" },
          ],
        },
      ],
    },
  ],

  matching: {
    dimensions: [
      {
        name: "表白与沟通",
        weight: 0.15,
        items: [
          { questionId: "crush_daily", scorer: "single", weight: 0.5 },
          { questionId: "message_response", scorer: "single", weight: 0.5 },
        ],
      },
      {
        name: "爱的语言",
        weight: 0.15,
        items: [
          { questionId: "first_date", scorer: "single", weight: 0.4 },
          { questionId: "love_recharge", scorer: "single", weight: 0.6 },
        ],
      },
      {
        name: "依恋安全感",
        weight: 0.25,
        items: [
          { questionId: "no_reply_reaction", scorer: "single", weight: 1.0 },
        ],
      },
      {
        name: "冲突处理",
        weight: 0.20,
        items: [
          { questionId: "conflict_style", scorer: "single", weight: 1.0 },
        ],
      },
      {
        name: "信任与底线",
        weight: 0.10,
        items: [
          { questionId: "dealbreaker", scorer: "single", weight: 0.4 },
          { questionId: "opposite_sex_boundary", scorer: "single", weight: 0.3 },
          { questionId: "sns_attitude", scorer: "single", weight: 0.3 },
        ],
      },
      {
        name: "关系期望",
        weight: 0.15,
        items: [
          { questionId: "ideal_relationship", scorer: "single", weight: 1.0 },
        ],
      },
    ],
    hardFilters: [],
  },
};

export default v3Lite;
