import type { SurveyVersion } from "./types";

const v1: SurveyVersion = {
  id: "v1",
  name: "关系基因匹配测试·基础版",

  sections: [
    // ── 第一部分：安全联结维度 ──
    {
      id: "attachment",
      title: "安全联结维度",
      description: "你的情感锚点在哪里？",
      questions: [
        {
          id: "reply_anxiety",
          type: "slider",
          question: "当对方超过多少小时未回复你的重要消息，你会开始感到不安？",
          note: "此题探测依恋焦虑倾向与对联结即时性的需求",
          min: 0,
          max: 24,
          step: 1,
          minLabel: "0小时",
          maxLabel: "24小时",
          unit: "小时",
        },
        {
          id: "safety_source",
          type: "single",
          question: "你最认同以下哪种「爱的安全感」来源？",
          options: [
            { value: "A", label: "「事事有回应，件件有着落」——需要明确的承诺和及时的行动证明" },
            { value: "B", label: "「我的后盾与港湾」——遇到困难时，知道对方一定会站在自己身后" },
            { value: "C", label: "「自由的牵挂」——即使各自忙碌，也深信彼此的感情不会变质" },
            { value: "D", label: "「共同进步的战友」——在朝着同一目标前进的路上，感觉最踏实" },
          ],
        },
        {
          id: "betrayal_redlines",
          type: "ranking",
          question: "你认为以下哪种行为最可能摧毁信任？请选择并排序最不能接受的3项",
          options: [
            "与前任保持定期聊天",
            "在社交软件上活跃「养鱼」",
            "重大决定（如考研、出国）先斩后奏",
            "在朋友面前频繁吐槽你的缺点",
            "经济困难时隐瞒实情",
            "与异性朋友单独旅行过夜",
          ],
          selectCount: 3,
        },
      ],
    },

    // ── 第二部分：互动模式维度 ──
    {
      id: "interaction",
      title: "互动模式维度",
      description: "我们如何「打架」与「和好」？",
      questions: [
        {
          id: "conflict_animal",
          type: "single",
          question: "发生争执时，你最像以下哪种动物？",
          options: [
            { value: "A", label: "🦔 刺猬——先防御，言语带刺，但内心柔软" },
            { value: "B", label: "🐦 鸵鸟——暂时回避，需要冷静期，不想在气头上沟通" },
            { value: "C", label: "🐬 海豚——主动沟通，试图用理性或幽默化解" },
            { value: "D", label: "🐙 章鱼——会翻旧账，把相关问题都牵扯出来" },
            { value: "E", label: "🦥 树懒——反应慢半拍，等想清楚怎么表达时对方已经气消了" },
          ],
        },
        {
          id: "family_communication",
          type: "single",
          question: "当你父母对伴侣提出不合理要求（如要求对方毕业后必须回家乡考公），而伴侣向你抱怨时，你会？",
          options: [
            { value: "A", label: "传话筒：如实转达双方意见，努力客观中立" },
            { value: "B", label: "防火墙：告诉父母「这是我们俩的事」，同时安抚伴侣" },
            { value: "C", label: "调和剂：分别劝说，向父母美化伴侣，向伴侣解释父母苦心" },
            { value: "D", label: "压力转移：告诉伴侣「忍一忍」，以后会好的" },
            { value: "E", label: "共同面对：和伴侣一起制定应对策略，统一立场后与父母沟通" },
          ],
        },
        {
          id: "intimacy_importance",
          type: "slider",
          question: "你理想中的亲密关系中，肢体亲密（如拥抱、亲吻等）的重要性如何？",
          min: 0,
          max: 10,
          step: 1,
          minLabel: "完全不重要",
          maxLabel: "至关重要",
        },
        {
          id: "intimacy_low_response",
          type: "single",
          question: "如果亲密度低于你的期待，你更倾向于？",
          options: [
            { value: "A", label: "主动沟通，坦诚表达自己的需求和感受" },
            { value: "B", label: "创造氛围，通过增加相处情趣来自然提升" },
            { value: "C", label: "观察反思，先检查关系其他方面是否出了问题" },
            { value: "D", label: "难以启齿，但可能会在其他方面表现出不满" },
            { value: "E", label: "顺其自然，相信感情到了自然会亲密" },
          ],
        },
      ],
    },

    // ── 第三部分：意义系统维度 ──
    {
      id: "meaning",
      title: "意义系统维度",
      description: "我们的「人生剧本」一致吗？",
      questions: [
        {
          id: "realistic_factors",
          type: "tags",
          question: "在选择长期伴侣时，除感情外，你最看重的现实因素是？",
          note: "限选3项",
          options: [
            "经济能力与职业前景",
            "学历背景与认知层次",
            "原生家庭条件与氛围",
            "身体健康与遗传因素",
            "相貌外形与审美品位",
            "生活技能与家务能力",
            "社交圈层与人脉资源",
            "未来发展城市与地域",
            "情绪价值提供与共情能力",
            "个人成长意愿与学习能力",
          ],
          maxSelect: 3,
        },
        {
          id: "bride_price_attitude",
          type: "single",
          question: "你认为彩礼/嫁妆的本质是？",
          options: [
            { value: "A", label: "传统礼仪——必要的流程，金额可商量但最好有" },
            { value: "B", label: "诚意测试——检验男方家庭重视程度的方式" },
            { value: "C", label: "新家启动金——双方家庭共同资助小家庭的资金" },
            { value: "D", label: "过时陋习——应被淘汰的观念，爱情不应明码标价" },
            { value: "E", label: "复杂博弈——涉及面子、家庭地位的综合社会行为" },
          ],
        },
        {
          id: "future_priorities",
          type: "ranking",
          question: "请按重要性排列你未来3-5年的人生重点",
          options: [
            "在一线城市扎根立足",
            "获得高含金量学历（考研/留学）",
            "积累工作经验，职位晋升",
            "经营一段稳定婚姻关系",
            "探索自我，发展兴趣",
            "陪伴父母，照顾家庭",
          ],
          selectCount: 6,
        },
      ],
    },

    // ── 第四部分：动力发展维度 ──
    {
      id: "growth",
      title: "动力发展维度",
      description: "我们能一起「升级」吗？",
      questions: [
        {
          id: "stress_partner_type",
          type: "single",
          question: "当你面临重大压力（如考研失败、失业）时，最希望伴侣：",
          options: [
            { value: "A", label: "解决方案提供者——帮我分析问题，给出实际建议" },
            { value: "B", label: "无条件支持者——无论成败都站在我这边，告诉我「没事」" },
            { value: "C", label: "榜样激励者——分享自己如何度过类似困境，激励我振作" },
            { value: "D", label: "空间给予者——让我独处消化，需要时再出现" },
            { value: "E", label: "共同分担者——帮我处理部分实际事务，减轻负担" },
          ],
        },
        {
          id: "growth_sync",
          type: "single",
          question: "如果伴侣获得一个极好的海外发展机会（2年），而你国内的事业也正处上升期，你会？",
          options: [
            { value: "A", label: "全力支持——接受异地，规划定期见面，视之为共同投资" },
            { value: "B", label: "协商妥协——探讨折中方案（如缩短时间、你后续跟进）" },
            { value: "C", label: "要求放弃——认为长期异地必然影响关系，希望对方以关系为重" },
            { value: "D", label: "借此契机提升自己——利用这段时间专注自身发展，约定共同成长" },
            { value: "E", label: "重新评估关系——思考彼此人生方向是否已出现根本分歧" },
          ],
        },
        {
          id: "growth_rate_diff",
          type: "single",
          question: "如果你感觉自己在思想或事业上成长速度明显快于/慢于伴侣，你的第一反应会是？",
          options: [
            { value: "A", label: "焦虑——担心不同步会导致关系疏远" },
            { value: "B", label: "积极——希望主动帮助或带动对方一起成长" },
            { value: "C", label: "接纳——认为关系中可以容纳不同的成长节奏" },
            { value: "D", label: "观察——视对方对此差异的态度和行动而定" },
          ],
        },
        {
          id: "relationship_adventure",
          type: "slider",
          question: "你对在长期关系中共同探索和尝试新鲜事物的态度是？",
          note: "包括但不限于新的亲密方式、旅行地、爱好等",
          min: 0,
          max: 10,
          step: 1,
          minLabel: "保守派，稳定至上",
          maxLabel: "探险家，渴望新鲜",
        },
      ],
    },

    // ── 第五部分：日常系统维度 ──
    {
      id: "daily",
      title: "日常系统维度",
      description: "我们能在生活里「落地」吗？",
      questions: [
        {
          id: "life_rhythm",
          type: "single",
          question: "你对「共同生活」中日常节拍的想象更接近哪一种？",
          options: [
            { value: "A", label: "高度同步：希望作息、用餐、休闲时间尽量保持一致，享受共同节奏" },
            { value: "B", label: "有机交织：尊重彼此独立的节奏，但在某些固定时段确保高质量交集" },
            { value: "C", label: "各自精彩：生活空间和时间有较大独立性，更注重在一起的深度而非时长" },
          ],
        },
        {
          id: "digital_boundaries",
          type: "tags",
          question: "你如何看待社交媒体与伴侣关系之间的边界？",
          note: "可多选",
          options: [
            "伴侣间应保持绝对透明，密码/设备可互看",
            "可以互看，但非必需，信任建立在尊重隐私之上",
            "在意对方在社交平台上的互动状态",
            "线上社交是个人空间，伴侣不应过度关注",
            "乐于在社交平台分享关系，视其为记录和宣告",
          ],
          maxSelect: 5,
        },
      ],
    },

    // ── 终极大题：灵魂共振测试 ──
    {
      id: "soul",
      title: "灵魂共振测试",
      description: "最深处的你，渴望怎样的连接？",
      questions: [
        {
          id: "relationship_food",
          type: "open_text",
          question: "如果你们的关系是一种食物，你希望它最像什么？为什么？",
          placeholder: "例如：火锅——热气腾腾，各取所需，但总在一口锅里…",
          multiline: true,
        },
        {
          id: "core_principle",
          type: "open_text",
          question: "写下你认为在长期关系中，最不可妥协的一个核心原则。",
          placeholder: "一句话即可",
          multiline: false,
        },
      ],
    },

    // ── 现实坐标自查（经济与家庭）──
    {
      id: "reality_1",
      title: "现实坐标·经济与家庭",
      description: "客观梳理自身的现实条件，有助于讨论双方期待的合理性与匹配度。请诚实作答。",
      questions: [
        {
          id: "career_stability",
          type: "open_text",
          question: "你的当前职业与稳定性",
          placeholder: "例如：互联网程序员/稳定；博士生/收入低但前景可期；事业单位/非常稳定",
          multiline: false,
        },
        {
          id: "annual_income",
          type: "open_text",
          question: "你的年收入大致范围",
          placeholder: "例如：20-30万；低于10万；50万以上",
          multiline: false,
        },
        {
          id: "income_growth",
          type: "open_text",
          question: "你对未来3-5年收入增长的预期是",
          placeholder: "例如：稳步增长；可能有跳跃式增长；不确定性高",
          multiline: false,
        },
        {
          id: "material_foundation",
          type: "tags",
          question: "你现有的物质基础",
          options: [
            "无房无车",
            "有车",
            "在工作地有房（有贷）",
            "在工作地有房（无贷）",
            "在家乡有房",
            "有一定数额的投资/存款",
          ],
          maxSelect: 6,
        },
        {
          id: "family_economics",
          type: "open_text",
          question: "你原生家庭的经济状况大致属于",
          placeholder: "例如：可提供有力支持；普通，无需我负担；需要我一定程度反哺",
          multiline: false,
        },
        {
          id: "parent_intervention",
          type: "open_text",
          question: "你父母对你在婚恋问题上的干预程度",
          placeholder: "例如：非常尊重我的选择；有期望但可沟通；有较强传统要求",
          multiline: false,
        },
        {
          id: "family_responsibilities",
          type: "open_text",
          question: "你未来需要承担的家庭责任主要包括",
          placeholder: "例如：抚养子女；赡养父母；资助兄弟姐妹等",
          multiline: false,
        },
      ],
    },

    // ── 现实坐标自查（生活与发展）──
    {
      id: "reality_2",
      title: "现实坐标·生活与发展",
      description: "了解你的身体状况、生活方式与发展规划。",
      questions: [
        {
          id: "health_status",
          type: "open_text",
          question: "你的健康状况总体评估",
          placeholder: "例如：良好，无重大疾病史；有需要长期管理的慢性病",
          multiline: false,
        },
        {
          id: "lifestyle_habits",
          type: "open_text",
          question: "你的核心生活作息与习惯",
          placeholder: "例如：规律早睡早起；习惯性熬夜；热爱运动；居家安静型",
          multiline: false,
        },
        {
          id: "life_shortcoming",
          type: "open_text",
          question: "你的一项自认为需要对方包容的「生活短板」是",
          placeholder: "例如：完全不会做饭；整理收纳能力极差；消费比较大手大脚",
          multiline: false,
        },
        {
          id: "city_settlement",
          type: "open_text",
          question: "你目前所在城市及未来3年定居意愿",
          placeholder: "例如：坚定留在一线城市；计划回老家省会；可随伴侣迁徙",
          multiline: false,
        },
        {
          id: "career_certainty",
          type: "open_text",
          question: "你的职业发展路径的确定性",
          placeholder: "例如：路径清晰，按部就班；处于转型探索期；自由职业，地点灵活",
          multiline: false,
        },
        {
          id: "personal_development_focus",
          type: "open_text",
          question: "你目前最大的个人发展投入是",
          placeholder: "例如：攻读学位；创业；考取重要职业资格",
          multiline: false,
        },
      ],
    },
  ],

  matching: {
    dimensions: [
      {
        name: "安全联结",
        weight: 0.20,
        items: [
          { questionId: "reply_anxiety", scorer: "slider", weight: 0.30 },
          { questionId: "safety_source", scorer: "single", weight: 0.35 },
          { questionId: "betrayal_redlines", scorer: "ranking", weight: 0.35 },
        ],
      },
      {
        name: "互动模式",
        weight: 0.25,
        items: [
          { questionId: "conflict_animal", scorer: "single", weight: 0.25 },
          { questionId: "family_communication", scorer: "single", weight: 0.30 },
          { questionId: "intimacy_importance", scorer: "slider", weight: 0.25 },
          { questionId: "intimacy_low_response", scorer: "single", weight: 0.20 },
        ],
      },
      {
        name: "意义系统",
        weight: 0.25,
        items: [
          { questionId: "realistic_factors", scorer: "tags", weight: 0.30 },
          { questionId: "bride_price_attitude", scorer: "single", weight: 0.30 },
          { questionId: "future_priorities", scorer: "ranking", weight: 0.40 },
        ],
      },
      {
        name: "动力发展",
        weight: 0.20,
        items: [
          { questionId: "stress_partner_type", scorer: "single", weight: 0.25 },
          { questionId: "growth_sync", scorer: "single", weight: 0.30 },
          { questionId: "growth_rate_diff", scorer: "single", weight: 0.20 },
          { questionId: "relationship_adventure", scorer: "slider", weight: 0.25 },
        ],
      },
      {
        name: "日常系统",
        weight: 0.10,
        items: [
          { questionId: "life_rhythm", scorer: "single", weight: 0.50 },
          { questionId: "digital_boundaries", scorer: "tags", weight: 0.50 },
        ],
      },
    ],
    hardFilters: [
      {
        questionId: "bride_price_attitude",
        incompatiblePairs: [["B", "D"], ["D", "B"]],
      },
    ],
  },
};

export default v1;
