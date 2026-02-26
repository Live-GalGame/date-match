import type { SurveyVersion } from "./types";

const v2: SurveyVersion = {
  id: "v2",
  name: "关系基因匹配测试·深度版",

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
          question: "你最想锁定哪种「安全感」？（请注意：这同时意味着你要接纳关系中的某种局限性）",
          options: [
            { value: "A", label: "事事有回应——情绪上被时刻呵护，但对方可能缺乏事业野心，难以应对现实风浪" },
            { value: "B", label: "绝对的后盾——现实中有靠山，但对方可能不懂细腻呵护，日常相处显得乏味、无趣" },
            { value: "C", label: "自由的牵挂——相处轻松没压力，但当你需要高浓度陪伴时，对方可能显得冷漠疏离" },
            { value: "D", label: "进步的战友——能带你或共同成长，但关系更现实，一旦步调不一致或失去价值，容易走散" },
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
            { value: "A", label: "🦔 刺猬——保护自我边界，第一时间回应。可能会因为激动带刺，但内心柔软" },
            { value: "B", label: "🐦 鸵鸟——为回避激烈冲突需要独处或冷静，之后再沟通或顺其自然" },
            { value: "C", label: "🐬 海豚——即时主动沟通，试图用理性或幽默化解当前问题" },
            { value: "D", label: "🐙 章鱼——将当前问题与过往类似情境联系，倾向于探讨整体模式而非单一事件" },
            { value: "E", label: "🦥 树懒——需要较长时间处理情绪，回应较慢，但通常经过深思熟虑" },
          ],
        },
        {
          id: "family_communication",
          type: "single",
          question: "你父母要求伴侣毕业后回老家考公，伴侣不满地向你抱怨，你会？",
          options: [
            { value: "A", label: "划界限——直接告诉父母「请不要干涉我们的决定」" },
            { value: "B", label: "组队——先跟伴侣商量好对策，统一立场后一起跟父母谈" },
            { value: "C", label: "调解——两头做工作，帮双方互相理解" },
            { value: "D", label: "劝和——帮伴侣分析父母的出发点，劝 TA 试着配合" },
            { value: "E", label: "冷处理——先不表态，等大家冷静下来再说" },
          ],
        },
        {
          id: "intimacy_warmth",
          type: "slider",
          question: "对于非性接触的亲昵（如出门前的拥抱、沙发上的依偎、牵手散步），你的需求度是？",
          note: "温存需求",
          min: 0,
          max: 10,
          step: 1,
          minLabel: "可以各玩各的",
          maxLabel: "必须有大量肢体接触「充电」",
        },
        {
          id: "intimacy_passion",
          type: "slider",
          question: "对于性亲密行为（性生活），你的需求度是？",
          note: "激情需求",
          min: 0,
          max: 10,
          step: 1,
          minLabel: "无性婚姻也可",
          maxLabel: "这是关系的核心粘合剂",
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

    // ── 第三部分：现实坐标与资源 ──
    {
      id: "reality",
      title: "现实坐标与资源",
      description: "我们的「人生剧本」兼容吗？真正的匹配，不仅看是否能并肩看星辰，更看能否共同履平地。",
      questions: [
        {
          id: "attraction_points",
          type: "open_text",
          question: "你的「吸引力说明书」——请写出你最想让伴侣知道的3个核心优势",
          note: "可以是任何引以为傲的方面：品质，性格，外貌，能力，经济条件，家庭情况，学历，生活习惯等",
          placeholder: "优势1：______\n优势2：______\n优势3：______",
          multiline: true,
        },
        {
          id: "growth_invitation",
          type: "open_text",
          question: "你的「成长邀请函」——请诚实写下你目前最希望伴侣包容或与你共同面对的1-2个现实短板",
          note: "这不代表你不好，而是为了让关系落地。如：目前经济尚无积蓄、科研压力大陪伴时间少、不擅长家务、原生家庭关系复杂等",
          placeholder: "短板1：______\n短板2：______",
          multiline: true,
        },
        {
          id: "city_trajectory",
          type: "single",
          question: "关于未来的「城市与舞台」，你目前的图景是？",
          options: [
            { value: "A", label: "坚定派：目标明确，必须在特定城市/领域深耕，伴侣最好同行" },
            { value: "B", label: "探索派：目前还在尝试期，愿意为了更好的机会或伴侣调整地点" },
            { value: "C", label: "随缘派：在哪里都可以，更看重当地的生活质量或人际氛围" },
            { value: "D", label: "归属派：计划回到家乡或伴侣所在的城市发展" },
          ],
        },
        {
          id: "city_trajectory_detail",
          type: "open_text",
          question: "如果你选择了「坚定派」，请写下你的目标城市/领域",
          note: "若上题未选 A 可跳过",
          placeholder: "例如：北京·金融行业、上海·互联网、深圳·硬件",
          multiline: false,
        },
        {
          id: "economic_role",
          type: "single",
          question: "关于「面包与爱情」，你对自己及伴侣未来经济角色的期待是？",
          options: [
            { value: "A", label: "强强联合型：希望双方都有极强的事业心，共同创造优渥物质条件" },
            { value: "B", label: "主副分担型：一人主攻事业，一人侧重家庭/生活管理，角色不论性别" },
            { value: "C", label: "稳健温饱型：不追求大富大贵，希望双方工作稳定，有更多时间相处" },
            { value: "D", label: "精神契合型：物质只要过得去即可，更看重精神交流与兴趣匹配" },
          ],
        },
        {
          id: "family_resources",
          type: "single",
          question: "在走向长期关系时，你如何看待原生家庭的资源与责任？",
          options: [
            { value: "A", label: "独立自主型：习惯靠自己打拼，尽量不依赖双方父母，也不希望长辈过度干预" },
            { value: "B", label: "资源整合型：认可家庭作为后盾的支持（如购房首付），愿意接受长辈合理的建议" },
            { value: "C", label: "责任反哺型：家庭需要我未来承担较多照顾责任，希望伴侣能理解并共同分担" },
            { value: "D", label: "情感疏离型：与原生家庭联系较少，未来希望建立完全独立于原生家庭的小家庭" },
          ],
        },
        {
          id: "bride_price_attitude",
          type: "single",
          question: "你认为彩礼/嫁妆的本质是？",
          options: [
            { value: "A", label: "传统礼仪——必要的流程，金额可商量但最好有" },
            { value: "B", label: "诚意测试——检验对方家庭重视程度的方式" },
            { value: "C", label: "新家启动金——双方家庭共同资助小家庭的资金" },
            { value: "D", label: "过时陋习——应被淘汰的观念，爱情不应明码标价" },
            { value: "E", label: "复杂博弈——涉及面子、家庭地位的综合社会行为" },
          ],
        },
      ],
    },

    // ── 第四部分：意义系统维度 ──
    {
      id: "meaning",
      title: "意义系统维度",
      description: "我们的「核心驱动」一致吗？",
      questions: [
        {
          id: "realistic_factors",
          type: "tags",
          question: "在选择长期伴侣时，除感情外，你最看重的现实因素是？",
          note: "限选3项，可在下方备注中补充具体看重的层面",
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
          id: "realistic_factors_note",
          type: "open_text",
          question: "如有需要，可以补充你具体看重的层面",
          note: "选填",
          placeholder: "例如：希望对方至少硕士学历、看重情绪稳定超过外表…",
          multiline: false,
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

    // ── 第五部分：动力发展维度 ──
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
          question: "伴侣获得一个极好的海外发展机会（需异地2年），而你国内的事业也正处上升期。此时你内心的声音更接近于？",
          options: [
            { value: "A", label: "「如果不能在一起，那发展再好有什么意义？」" },
            { value: "B", label: "「没有完美的选择，我们必须商量出一个折中方案。」" },
            { value: "C", label: "「两情若是久长时，又岂在朝朝暮暮，各自奋斗挺好。」" },
            { value: "D", label: "「异地太考验人性了，我觉得我们要做好分手的心理准备。」" },
          ],
        },
        {
          id: "stage_difference",
          type: "single",
          question: "如果在读研/博或职场晋升的关键期，你们由于所处阶段不同导致眼界或话题暂时出现「步调差」，你的第一反应是？",
          options: [
            { value: "A", label: "焦虑：担心共同语言减少，努力制造话题" },
            { value: "B", label: "理解：认为这是阶段性的常态，支持对方先忙完当下的重点" },
            { value: "C", label: "分享：主动分享自己的生活，同时倾听对方的压力，保持低频但高质量的连接" },
            { value: "D", label: "调整：建议增加共同学习/阅读的时间，强行拉齐认知步伐" },
          ],
        },
        {
          id: "relationship_adventure",
          type: "slider",
          question: "你对在长期关系中，共同探索和尝试新鲜事物的态度是？",
          note: "包括但不限于新的亲密方式、旅行地、爱好等",
          min: 0,
          max: 10,
          step: 1,
          minLabel: "保守派，稳定至上",
          maxLabel: "探险家，渴望新鲜",
        },
      ],
    },

    // ── 第六部分：日常系统维度 ──
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
            { value: "B", label: "有机交织：尊重彼此独立的节奏，但在某些固定时段（如晚餐、睡前）确保高质量交集" },
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
            "在意对方在社交平台上的互动状态（如是否公开关系、与异性互动方式）",
            "认为线上社交是个人空间，伴侣不应过度关注",
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
          question: "如果你们的关系是一种食物，你希望它最像什么？因为______。",
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
  ],

  matching: {
    dimensions: [
      {
        name: "安全联结",
        weight: 0.18,
        items: [
          { questionId: "reply_anxiety", scorer: "slider", weight: 0.30 },
          { questionId: "safety_source", scorer: "single", weight: 0.35 },
          { questionId: "betrayal_redlines", scorer: "ranking", weight: 0.35 },
        ],
      },
      {
        name: "互动模式",
        weight: 0.20,
        items: [
          { questionId: "conflict_animal", scorer: "single", weight: 0.20 },
          { questionId: "family_communication", scorer: "single", weight: 0.25 },
          { questionId: "intimacy_warmth", scorer: "slider", weight: 0.15 },
          { questionId: "intimacy_passion", scorer: "slider", weight: 0.15 },
          { questionId: "intimacy_low_response", scorer: "single", weight: 0.25 },
        ],
      },
      {
        name: "现实坐标",
        weight: 0.15,
        items: [
          { questionId: "city_trajectory", scorer: "single", weight: 0.25 },
          { questionId: "economic_role", scorer: "single", weight: 0.25 },
          { questionId: "family_resources", scorer: "single", weight: 0.25 },
          { questionId: "bride_price_attitude", scorer: "single", weight: 0.25 },
        ],
      },
      {
        name: "意义系统",
        weight: 0.20,
        items: [
          { questionId: "realistic_factors", scorer: "tags", weight: 0.45 },
          { questionId: "future_priorities", scorer: "ranking", weight: 0.55 },
        ],
      },
      {
        name: "动力发展",
        weight: 0.17,
        items: [
          { questionId: "stress_partner_type", scorer: "single", weight: 0.25 },
          { questionId: "growth_sync", scorer: "single", weight: 0.30 },
          { questionId: "stage_difference", scorer: "single", weight: 0.20 },
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

export default v2;
