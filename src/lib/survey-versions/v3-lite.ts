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
            { value: "A", label: "社交考古到2019年", image: "/数据标注/Q1A.png" },
            { value: "B", label: "精心制造偶遇", image: "/数据标注/Q1B.png" },
            { value: "C", label: "打了又删，删了又打", image: "/数据标注/Q1C.png" },
            { value: "D", label: "直球出击，不搞暧昧", image: "/数据标注/Q1D.png" },
          ],
        },
        {
          id: "message_response",
          type: "single",
          question: "收到喜欢的人消息，你的第一反应？",
          options: [
            { value: "A", label: "强忍3分钟才回", image: "/数据标注/Q2A.png" },
            { value: "B", label: "秒回！手速超越打游戏", image: "/数据标注/Q2B.png" },
            { value: "C", label: "截图发群，召唤智囊团", image: "/数据标注/Q2C.png" },
            { value: "D", label: "精心编辑一条完美回复", image: "/数据标注/Q2D.png" },
          ],
        },
        {
          id: "first_date",
          type: "single",
          question: "第一次约会，你选？",
          options: [
            { value: "A", label: "看电影/展览", image: "/数据标注/Q3A.png" },
            { value: "B", label: "找个好吃的约饭", image: "/数据标注/Q3B.png" },
            { value: "C", label: "散步闲逛边走边聊", image: "/数据标注/Q3C.png" },
            { value: "D", label: "一起打游戏/剧本杀", image: "/数据标注/Q3D.png" },
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
            { value: "A", label: "一个拥抱就够了", image: "/数据标注/Q4A.png" },
            { value: "B", label: "聊天停不下来", image: "/数据标注/Q4B.png" },
            { value: "C", label: "收到用心小惊喜", image: "/数据标注/Q4C.png" },
            { value: "D", label: "安静待在一起就好", image: "/数据标注/Q4D.png" },
          ],
        },
        {
          id: "no_reply_reaction",
          type: "single",
          question: "TA 一整天没回你消息，你的内心戏是？",
          options: [
            { value: "A", label: "分手文案已备好", image: "/数据标注/Q5A.png" },
            { value: "B", label: "翻记录看我说错了啥", image: "/数据标注/Q5B.png" },
            { value: "C", label: "应该在忙吧", image: "/数据标注/Q5C.png" },
            { value: "D", label: "直接打电话问", image: "/数据标注/Q5D.png" },
          ],
        },
        {
          id: "sns_attitude",
          type: "single",
          question: "恋爱后，朋友圈怎么安排？",
          options: [
            { value: "A", label: "即刻官宣！", image: "/数据标注/Q6A.png" },
            { value: "B", label: "偶尔晒，不刻意", image: "/数据标注/Q6B.png" },
            { value: "C", label: "低调才是浪漫", image: "/数据标注/Q6C.jpeg" },
            { value: "D", label: "看 TA 什么态度", image: "/数据标注/Q6D.png" },
          ],
        },
        {
          id: "conflict_style",
          type: "single",
          question: "吵架了，你大概率是？",
          options: [
            { value: "A", label: "当场说清楚！不过夜", image: "/数据标注/Q7A.png" },
            { value: "B", label: "先冷静，我需要独处", image: "/数据标注/Q7B.jpeg" },
            { value: "C", label: "先道歉，不想冷战", image: "/数据标注/Q7C.png" },
            { value: "D", label: "编辑一大段话发过去", image: "/数据标注/Q7D.jpeg" },
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
            { value: "A", label: "对我说谎或隐瞒", image: "/数据标注/Q8A.png" },
            { value: "B", label: "和暧昧对象保持联系", image: "/数据标注/Q8B.png" },
            { value: "C", label: "在朋友面前让我丢脸", image: "/数据标注/Q8C.png" },
            { value: "D", label: "需要时人间蒸发", image: "/数据标注/Q8D.png" },
          ],
        },
        {
          id: "opposite_sex_boundary",
          type: "single",
          question: "TA 和异性朋友单独吃饭，你？",
          options: [
            { value: "A", label: "完全OK，吃开心", image: "/数据标注/Q9A.png" },
            { value: "B", label: "行，但提前说一声", image: "/数据标注/Q9B.png" },
            { value: "C", label: "看什么朋友…", image: "/数据标注/Q9C.png" },
            { value: "D", label: "约我一起去啊！", image: "/数据标注/Q9D.png" },
          ],
        },
        {
          id: "ideal_relationship",
          type: "single",
          question: "你理想中的关系是什么「画风」？",
          options: [
            { value: "A", label: "每天都有心跳感", image: "/数据标注/Q10A.png" },
            { value: "B", label: "细水长流的温暖", image: "/数据标注/Q10B.png" },
            { value: "C", label: "一起探索世界", image: "/数据标注/Q10C.png" },
            { value: "D", label: "像回家一样安心", image: "/数据标注/Q10D.png" },
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
