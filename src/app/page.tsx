import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FoodResponses } from "@/components/landing/food-responses";
import { Footer } from "@/components/landing/footer";
import { db } from "@/server/db";

// DB 不可用时的降级 mock 数据（仅本地调试用）
const MOCK_FOOD_RESPONSES: string[] = [
  "火锅——热烈、包容，什么食材都能往里放，最后煮出来的味道总是出人意料的好",
  "白米饭——看似平淡，但每天都离不开，越嚼越香",
  "提拉米苏——一层一层的，有苦有甜，需要慢慢品味",
  "麻辣烫——各取所需，丰俭由人，关键是得找到口味一致的人一起吃",
  "饺子——需要两个人一起包，过程很重要，结果可能歪歪扭扭但充满温暖",
  "咖啡——有人喜欢美式的直接，有人喜欢拿铁的温润，关键是找到那个适合你的浓度",
  "糖醋排骨——酸酸甜甜的，有时候吵吵闹闹，但骨子里是甜的",
  "冰淇淋——让人开心、上瘾，但融化得太快，需要用心呵护",
  "番茄炒蛋——家常到极致就是最好的，简单的配料也能做出经典",
  "螺蛳粉——闻着臭吃着香，外人不理解但当事人乐在其中",
  "红烧肉——越炖越入味，需要时间和耐心",
  "小笼包——薄薄的皮包着滚烫的心，一不小心就会被烫到",
  "老火靓汤——需要文火慢炖，急不来，好的关系也是如此",
  "芝士蛋糕——外表看起来简单，但做起来每一步都不能出错",
  "烤红薯——冬天里最温暖的存在，不用多华丽，暖和就够了",
  "寿司——讲究新鲜和搭配，简约而不简单",
  "煎饼果子——加什么料自己选，我全都要",
  "酸奶——发酵需要时间和合适的温度，催不得",
  "巧克力——甜蜜是表象，可可的微苦才是底色",
  "臭豆腐——外表其貌不扬，但真香定律永远不会骗人",
  "奶茶——甜度可选、加料随意，每个人喝法不同但都能获得快乐",
  "西瓜——夏天的快乐源泉，和对的人分享才最甜",
  "蛋炒饭——看似简单，但火候和配料的比例决定了一切",
  "豆浆油条——天生一对的搭配，缺了谁都不完整",
  "腊八粥——各种食材混在一起，慢慢熬才好喝",
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ code }] = await Promise.all([searchParams]);
  let participantCount = 0;
  let foodResponses: string[] = [];
  try {
    const [count, surveys] = await Promise.all([
      db.surveyResponse.count({ where: { completed: true } }),
      db.surveyResponse.findMany({
        where: { completed: true },
        select: { answers: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    participantCount = count;

    // 提取 relationship_food 回答，过滤空值和太短的回答
    foodResponses = surveys
      .map((s) => {
        try {
          const a = JSON.parse(s.answers) as Record<string, unknown>;
          return typeof a.relationship_food === "string"
            ? a.relationship_food.trim()
            : "";
        } catch {
          return "";
        }
      })
      .filter((t) => t.length >= 4);
  } catch {
    // 本地无 DB 或网络不可达时降级，使用 mock 数据
    participantCount = MOCK_FOOD_RESPONSES.length;
    foodResponses = MOCK_FOOD_RESPONSES;
  }

  return (
    <main>
      <Hero code={code} participantCount={participantCount} />
      <FoodResponses responses={foodResponses} />
      <HowItWorks />
      <Footer />
    </main>
  );
}
