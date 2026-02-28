# 匹配算法 vNext：GBT 监督学习 + 题目裁剪（Design Doc）

> 目标：在保留现有「硬过滤 + 可解释理由」能力的前提下，引入 **Gradient Boosted Trees (GBT)** 的监督学习来预测匹配质量，并用模型信号 **系统性裁剪低贡献题目**，降低问卷长度、提高转化率、提升匹配满意度。

## 0. 事实快照（2026-02-27 生产库审计）

以下结论来自对生产数据库的**只读聚合统计**（不含任何敏感明文）：

- **样本规模**：`User≈15151`，`SurveyResponse≈15019`，`optedIn≈14867 (≈99%)`，`emailVerified≈11035 (≈73%)`  
- **可触发匹配的人群**（`completed+optedIn+emailVerified`）：`≈10751 (≈72%)`
- **关键阻塞**：`Match=0`、`MatchFeedback=0` —— 目前**没有任何真实监督标签**可用于训练 GBT
- **问卷版本分布**（基于 `_surveyVersion`）：
  - `v3-lite ≈ 74%`
  - `v2 ≈ 17%`
  - `v3-lite+v2 ≈ 9%`（表示同一份答卷里包含多个版本的题）
- **matchStrategy 分布**：约 11k 用户填写了匹配策略偏好（`"1"` / `"2-3"` / `"4+"`）

**直接推论（会显著收敛下一步范围）**：
- 在训练 GBT 之前，必须先让匹配管线真实产出 `Match/MatchFeedback`（否则只能做 pseudo-label 或无监督分析）。
- ~~当前 `matchingConfig` 固定指向 v2~~ → **已修复**：匹配管线现已按 `_surveyVersion` 分池，每个池使用对应版本的 `matchingConfig`。
- ~~matchStrategy 未被匹配算法读取~~ → **已修复**：贪心匹配现已按用户选择的匹配策略控制每人的匹配上限，并通过 `strategyBonus` 优先撮合同策略用户。

## 0.1 已落地的工程改动

| 改动 | 文件 | 状态 |
|------|------|------|
| `MatchingContext` 版本感知 | `algorithm.ts` | ✅ 已合入 |
| 按 `_surveyVersion` 分池匹配 | `route.ts` (trigger) | ✅ 已合入 |
| `?dryRun=true` 只落库不发邮件 | `route.ts` (trigger) | ✅ 已合入 |
| `matchStrategy` 多匹配上限 + 策略加分 | `algorithm.ts` | ✅ 已合入 |
| 生产数据审计脚本 | `scripts/audit-production-data.ts` | ✅ 新增 |

## 1. 我们是否需要"从头训练"GBT？

需要"用你们自己的数据训练一个模型"，但**不需要从零实现算法**。

- **必须用自有数据训练/微调的原因**：你们的目标变量不是通用的"相似度"，而是非常具体的产品指标（例如 `MatchFeedback.initialScore`、中期 `status`、以及未来更长期的留存/转介绍/线下见面等）。这类标签具有强领域特性，公开数据集几乎不可用。
- **不需要从头实现 GBT**：训练端用成熟库（XGBoost / LightGBM / CatBoost / sklearn）即可。真正需要"从零做"的部分通常是：
  - **训练数据构造**（pair 样本怎么取、标签怎么定义）
  - **特征工程/缺失值处理**（问卷 JSON + profile）
  - **线上推理落地**（在 Vercel/Node 环境安全、可回滚、可灰度）

### 冷启动现实：数据不足怎么办？
你们当前 Prisma schema 的监督信号主要来自：
- `MatchFeedback.initialScore`（1-5 短期评分，可能缺失）
- `MatchFeedback.status`（中期进展状态，可能缺失）
- `MatchFeedback.issues`（低分原因标签）

在数据很少时（例如 < 500 对有反馈的 match），可以走分阶段策略：
- **Phase A（弱监督/蒸馏）**：用现有规则引擎的 `computeCompatibility()` 作为 *pseudo-label* 训练一个"近似模型"，主要为了打通特征、推理、部署管线（效果不一定更好，但工程闭环最重要）。
- **Phase B（真监督）**：当真实反馈积累到一定规模，切到以 `initialScore/status` 为主标签训练的 GBT；规则引擎退化为：硬过滤 + 生成 reasons + fallback。

## 2. vNext 总体结构：硬过滤保留，打分替换为模型

### 2.1 仍然保留（规则层）
- **硬过滤（Hard filters）**：继续由配置驱动 + deal-breaker 双向过滤完成。原因：
  - 这是**产品价值观/底线**，不应完全交给模型学习；
  - 训练数据里对"绝对不可接受"的覆盖往往不足，模型会"侥幸放行"。
- **matchStrategy 策略控制**：匹配上限和策略偏好加分独立于打分模型，属于产品规则层。

### 2.2 用模型替换（打分层）
把现有 `computeCompatibility(a,b)` 的「加权求和」替换为：
1. `extractPairFeatures(a,b, profiles?) -> float[]`
2. `gbtModel.predict(features) -> y_hat`
3. `score = calibrate(y_hat) -> 55~99`（仍保持你们的分数区间与 UI 体验一致）

## 3. 训练数据设计（最关键的"从头训练"部分）

### 3.1 样本单位：一条样本 = 一对用户 (u1,u2,week)
数据来源建议以 `Match` 表为主键（因为 match 是你们真实送出的配对）。

Prisma schema（当前）：
- `Match(id, user1Id, user2Id, compatibility, reasons, week, ...)`
- `MatchFeedback(matchId, userId, initialScore?, status?, issues, ...)`，每个 match 理论上可有两条（u1、u2 各一条）

### 3.2 标签（y）怎么定义？
建议先做一个"可解释、可迭代"的 label 组合策略：

#### y₁：短期评分（首要）
- `initialScore` 取 1~5
- 如果两边都提交了，建议取 **均值** 或 **较小值**（更保守，减少一边很不爽但另一边满意的"错配"）

#### y₂：中期进展（次要）
把 `status` 映射成一个连续分值（可后续调参）：
- chatting_well → 1.0
- occasionally → 0.7
- added_no_chat → 0.4
- no_response → 0.2
- incompatible → 0.0

#### 组合 label（回归）
当两种都存在时：
\[
y = 0.7 \cdot \mathrm{norm}(initialScore) + 0.3 \cdot \mathrm{statusScore}
\]
其中 `norm(1..5) -> 0..1`。

> 实操建议：先只用 `initialScore` 做回归（更干净），再逐步把 `status` 加进去，避免早期噪声太大。

### 3.3 负样本与"选择偏差"问题
重要现实：你们的训练数据只来自"规则引擎挑出来并发送"的 match，因此会出现 **selection bias**（模型只在规则引擎的分布上学习）。

短期可接受；中长期建议补充：
- **候选集内对比（pairwise ranking）**：在发 match 时，记录"当周被考虑过但没选上"的 top-K 候选（仅记录匿名化特征或哈希），这样就可以训练"谁比谁更好"；
- **小流量探索（exploration）**：对一小部分用户进行 epsilon-greedy 探索，让训练数据覆盖更宽分布（需谨慎，避免伤害体验）。

## 4. 特征工程：从问卷 JSON + Profile 生成对称特征

### 4.1 关键原则
- **对称性**：`features(a,b) == features(b,a)`（否则匹配图会出现方向性噪声）
- **缺失鲁棒**：答案缺失/题目版本变化时也能稳定输出
- **可追溯到 questionId**：因为你们要做"题目裁剪"，必须能从特征反查问题贡献

### 4.2 针对题型的基础特征（建议起步集合）
基于你们当前算法的 scorer（`slider/single/tags/ranking`）：

- slider（数值题）
  - `abs_diff = |a-b|`
  - `norm_abs_diff = abs_diff / (max-min)`
  - `similarity = 1 - norm_abs_diff`（可复用你们现有逻辑）
- single（单选题）
  - `is_same`（0/1）
  - `pair_code`（可选：组合 one-hot，例如 A/B/C/D 的交叉；若担心维度爆炸，用 hashing trick）
  - `handcrafted_matrix_score`（把你们现有心理学互补矩阵得分当作一个输入特征，而不是最终答案）
- tags（多选标签）
  - `jaccard`
  - `intersection_size`
  - `union_size`
- ranking（排序题）
  - `overlap_ratio`
  - `kendall_concordance`
  - `hybrid_score`（你们当前的 0.6/0.4 组合）

### 4.3 结构化元特征
这些往往对预测很有帮助，同时能提高模型鲁棒性：
- `survey_version`（你们已在 answers 里写入 `_surveyVersion`）
- `matchStrategy`（用户选择的匹配策略偏好）
- `strategy_match`（两人策略是否一致——已通过 `strategyBonus` 在规则层体现，也可作为模型特征）
- profile 元信息：`gender/datingPreference/education/schoolTier` 等（注意隐私与偏见评估）
- "硬过滤命中计数"：例如 deal-breaker 交叉命中数（但一旦命中就过滤掉；此处用于解释/稳定性）

## 5. 线上推理落地（Node/Vercel 友好）

### 5.1 约束
你们是 Next.js App Router + Vercel Serverless。为了部署稳定，建议优先选择 **纯 TS/JS 推理**，避免引入体积大或平台相关的 native binding。

### 5.2 推荐方案：导出 GBT 为 JSON + TS 运行时执行树
- 训练端：用 XGBoost/LightGBM 训练后，把模型 dump 成 JSON（每棵树 = 节点结构）
- 线上：实现一个轻量的 `predict()`，遍历每棵树从 root 走到 leaf，累加叶子值

优点：
- 部署简单、可控、可审计、无 native 依赖
- 易于灰度（同一套 features，可以同时跑 heuristic 与 gbt）

缺点：
- 需要你们定义一套**稳定的 feature schema**（特征顺序/名称/缺失值策略）

## 6. 代码重构草案（目标：可插拔模型、可回滚）

### 6.1 建议目录结构
- `src/server/matching/`
  - `algorithm.ts`（保留：构图 + 贪心/采样 + reasons；把打分委托给 model）
  - `hard-filters.ts`（抽出 shouldHardFilter）
  - `parse.ts`（抽出 parseSurvey）
  - `features/`
    - `feature-schema.ts`（特征定义：name, questionId?, type, default）
    - `extract.ts`（extractPairFeatures）
  - `models/`
    - `types.ts`（CompatibilityModel 接口）
    - `heuristic.ts`（现有 computeCompatibility 的封装实现）
    - `gbt.ts`（加载 `model.json` + predict）
  - `reasons/`（可选：基于 SHAP/top features 生成 reasons；或继续沿用现有 reasons 逻辑）

### 6.2 关键接口（伪代码）
（这里只定义形状，后续实现落到 TypeScript）

```ts
export interface CompatibilityModel {
  name: "heuristic" | "gbt";
  predictScore01(features: Float32Array): number; // 0..1
}

export function scoreToCompatibility(score01: number): number {
  // 保持现有 55..99 的 UI 分数范围
  return clamp(Math.round(score01 * 45 + 55), 55, 99);
}
```

`runMatchingRound()`/`findBestMatch()` 的改动点将非常小：把 `computeCompatibility()` 替换为 `model.predictScore01(extractPairFeatures())`。

## 7. "题目裁剪"如何做成一个可复用流程（而不是拍脑袋）

### 7.1 裁剪目标
- **减少问卷长度**（提高完成率）
- **保持/提升匹配质量**（反馈分不下降）
- **保留关键维度覆盖**（例如安全联结、互动模式等不能被裁没）

### 7.2 指标与方法
训练完成后，在验证集上计算：
- **特征重要性**：gain / split count（粗略）
- **Permutation importance**：更可信，计算更慢
- **SHAP（可选）**：可解释性最好，可用于 reasons，但工程量更大

然后把特征映射回 `questionId`，做"按题聚合"的贡献度：
- `question_importance[qid] = sum(importance(feature where feature.questionId==qid))`

### 7.3 裁剪策略（建议约束式）
不要简单按 importance 从小到大删，建议加约束：
- **每个维度至少保留 N 题**（例如 N=2）
- **关键题白名单**（例如你们的三张心理学互补矩阵题：`conflict_animal/safety_source/economic_role`）
- **版本兼容**：若存在 v2/v3-lite 等版本，裁剪要落在对应 `survey-versions/v*.ts`

### 7.4 评估闭环
裁剪后必须重新训练/重新验证，并上线 A/B：
- A：旧问卷 + heuristic/旧模型
- B：新问卷 + gbt（或新问卷 + heuristic 作为隔离变量）

## 8. 上线策略（避免一次性"梭哈"）

建议分 3 步走：
- **Shadow mode**：线上仍用 heuristic 产出结果，同时后台计算 gbt 分数并记录（不影响用户）
- **Small rollout**：对小比例用户启用 gbt 打分（硬过滤不变），监控反馈分/投诉率/退订
- **Question pruning experiment**：在匹配质量稳定后，再做问卷裁剪的 A/B（这是对漏斗影响最大的部分）

## 9. 下一步落地清单（按依赖顺序）

- [x] ~~按 `_surveyVersion` 分池匹配~~ (已落地)
- [x] ~~`?dryRun=true` 只落库模式~~ (已落地)
- [x] ~~`matchStrategy` 多匹配上限 + 策略偏好加分~~ (已落地)
- [x] ~~生产数据审计脚本~~ (`scripts/audit-production-data.ts`)
- [ ] **部署到生产 + 首次 dryRun 触发匹配**，验证分池/策略是否符合预期
- [ ] 正式触发匹配（发邮件），开始积累 `MatchFeedback`
- [ ] 实现 `extractPairFeatures()` + `feature-schema`（不改线上匹配结果）
- [ ] 写数据导出脚本：从 `Match + MatchFeedback + SurveyResponse + Profile` 导出训练样本
- [ ] 训练 GBT（先回归 `initialScore`），导出 `model.json` + `schema.json`
- [ ] 加 `gbt` 推理运行时（纯 TS/JS），并接入 `runMatchingRound()`（shadow mode）
- [ ] 做题目重要性分析 → 输出"建议裁剪清单" → 修改 `survey-versions/v*.ts` → A/B 验证
