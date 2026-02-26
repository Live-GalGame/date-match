import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 | 关系基因匹配测试",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-warm-light">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-sm text-warm-dark/50 hover:text-warm-dark transition-colors"
        >
          ← 返回首页
        </Link>

        <h1 className="text-4xl font-serif text-warm-dark mt-8 mb-12">
          隐私政策
        </h1>

        <div className="prose prose-warm max-w-none space-y-10 text-warm-dark/80">
          <section>
            <h2 className="text-xl font-serif text-warm-dark">简而言之</h2>
            <p>
              关系基因匹配测试致力于帮你找到真正合拍的人，而不是用无尽的滑动消耗你的时间。
              我们尊重你的隐私，对数据有着严格的精神洁癖——绝不贩卖数据，绝不恰烂钱。
              本政策说明我们收集哪些信息、如何使用、如何保护，以及你拥有的权利。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">
              我们收集哪些信息？
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>联系方式：</strong>你的昵称和邮箱地址（用于发送匹配结果）
              </li>
              <li>
                <strong>问卷回答：</strong>你在兼容性问卷中的作答，涵盖依恋风格、沟通方式、价值观等维度
              </li>
              <li>
                <strong>匹配参与状态：</strong>你是否选择参与每周匹配
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">
              我们如何使用这些信息？
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>每周匹配：</strong>
                当你选择参与匹配后，系统会基于你的问卷回答，在安全联结、互动模式、意义系统、动力发展、日常系统五个维度上计算兼容度，每周为你匹配一位对象
              </li>
              <li>
                <strong>结果通知：</strong>通过邮件向你发送匹配结果和兼容度报告
              </li>
              <li>
                <strong>算法优化：</strong>
                我们可能使用匿名化、聚合后的数据来改进匹配算法的准确性
              </li>
            </ul>
            <p className="mt-3">
              我们<strong>不会</strong>
              向任何第三方出售或共享你的个人信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">
              数据如何存储与保护？
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>传输加密：</strong>所有数据通过 TLS 加密传输
              </li>
              <li>
                <strong>存储隔离：</strong>
                问卷回答与个人身份信息分表存储，通过随机 ID 关联，最大程度降低隐私泄露风险
              </li>
              <li>
                <strong>访问控制：</strong>
                仅核心开发团队可接触原始数据，不会向任何外部人员开放
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">
              你的权利与选择
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>自愿参与：</strong>
                你可以随时选择不参与匹配，不填写问卷不会产生任何数据
              </li>
              <li>
                <strong>删除数据：</strong>
                你可以随时联系我们要求删除你的所有数据，我们将在合理时间内处理
              </li>
              <li>
                <strong>数据查询：</strong>
                你有权了解我们存储了你的哪些信息，可通过邮件联系我们获取
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">数据保留</h2>
            <p>
              在你的账户处于活跃状态期间，我们会保留你的数据以持续提供匹配服务。
              当你请求删除账户时，我们将从数据库中完全移除你的个人信息和问卷数据。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">关于我们</h2>
            <p>
              关系基因匹配测试由{" "}
              <a
                href="https://github.com/Live-GalGame"
                className="underline hover:text-warm-dark transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Live-GalGame
              </a>{" "}
              团队构建与维护。我们融合依恋理论、沟通分析、人生叙事与成长型思维，
              通过一份深度问卷，帮你找到真正合拍的人。
              项目完全开源，纯粹为高质量的相遇「为爱发电」。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">政策更新</h2>
            <p>
              本隐私政策可能会不时更新。如有重大变更，我们会通过邮件通知你。
              继续使用本服务即表示你同意更新后的政策。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-serif text-warm-dark">联系我们</h2>
            <p>
              如有任何隐私相关的问题或请求，请联系{" "}
              <a
                href="mailto:hzy2210@gmail.com"
                className="underline hover:text-warm-dark transition-colors"
              >
                hzy2210@gmail.com
              </a>
              。
            </p>
          </section>
        </div>

        <p className="mt-16 text-xs text-warm-dark/30">
          最后更新：2026 年 2 月
        </p>
      </div>
    </main>
  );
}
