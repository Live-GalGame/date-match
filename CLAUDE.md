# CLAUDE.md — AI Agent 代码导航指南

本文件供 AI 编码助手理解项目架构，快速定位代码并做出合理修改。

## 项目概述

关系兼容性匹配平台。用户完成心理学问卷 → 系统计算五维度兼容度 → 每周匹配一对。

## 关键架构决策

1. **全 JSON 存储问卷答案**：`SurveyResponse.answers` 是 JSON 字符串 `{ questionId: value }`，所有题型的答案都存在这个字段里。`coreValues` 字段保留但目前为空，历史遗留。
2. **问卷定义与 UI 分离**：所有题目定义在 `src/lib/survey-questions.ts`，UI 组件在 `src/components/survey/` 下按题型拆分，页面 `src/app/onboarding/survey/page.tsx` 根据 `question.type` 动态渲染。
3. **匹配算法是纯函数**：`src/server/matching/algorithm.ts` 不依赖数据库，接收 `SurveyResponse[]` 返回 `MatchResult[]`，方便单元测试。
4. **tRPC 统一 API**：所有前后端通信走 tRPC，路由定义在 `src/server/api/routers/`。无裸 fetch 调用。

## 文件地图

### 修改问卷时需要改的文件

| 文件 | 作用 | 改什么 |
|------|------|--------|
| `src/lib/survey-questions.ts` | 题型定义 + 所有题目内容 | 增删改题目、新增题型 |
| `src/components/survey/*.tsx` | 各题型的 UI 组件 | 修改渲染逻辑、样式 |
| `src/app/onboarding/survey/page.tsx` | 问卷页面（渲染 + 导航） | 新题型需要加 `if (q.type === "xxx")` 分支 |
| `src/server/matching/algorithm.ts` | 匹配计算 | 新题目需要加入维度评分 |

### 修改认证时需要改的文件

| 文件 | 作用 |
|------|------|
| `src/lib/auth.ts` | Better Auth 服务端配置 |
| `src/lib/auth-client.ts` | 客户端认证 hooks |
| `src/app/api/auth/[...all]/route.ts` | Auth 路由 handler |

### 数据模型

| Model | 说明 | 关键字段 |
|-------|------|---------|
| `User` | 用户 | email, name |
| `Profile` | 个人资料 | displayName, gender, age, school |
| `SurveyResponse` | 问卷回答 | answers (JSON), completed, optedIn |
| `Match` | 匹配结果 | user1Id, user2Id, compatibility, reasons (JSON), week |
| `Qualification` | 身份验证 | eduEmail, status |

Prisma schema 位于 `prisma/schema.prisma`，使用 SQLite。

## 题型系统

5 种题型，均定义在 `survey-questions.ts`：

| 题型 | TypeScript 类型 | 存储格式 | 对应 UI 组件 |
|------|----------------|---------|-------------|
| `slider` | `SliderQuestion` | `number` | `slider-input.tsx` |
| `single` | `SingleQuestion` | `string` (选项 value 如 "A") | `single-select.tsx` |
| `tags` | `TagsQuestion` | `string[]` (选项文本) | `tag-selector.tsx` |
| `ranking` | `RankingQuestion` | `string[]` (按排名顺序) | `ranking-selector.tsx` |
| `open_text` | `OpenTextQuestion` | `string` | `text-input.tsx` |

**新增题型的步骤：**
1. 在 `survey-questions.ts` 加 interface，加入 `SurveyQuestion` union type
2. 在 `src/components/survey/` 创建新组件
3. 在 `survey/page.tsx` 加渲染分支
4. 在 `algorithm.ts` 加评分函数和维度配置

## 匹配算法

`src/server/matching/algorithm.ts`

### 五维度权重

| 维度 | 权重 | 涉及的题目 ID |
|------|------|--------------|
| 安全联结 | 20% | reply_anxiety, safety_source, betrayal_redlines |
| 互动模式 | 25% | conflict_animal, family_communication, intimacy_importance, intimacy_low_response |
| 意义系统 | 25% | realistic_factors, bride_price_attitude, future_priorities |
| 动力发展 | 20% | stress_partner_type, growth_sync, growth_rate_diff, relationship_adventure |
| 日常系统 | 10% | life_rhythm, digital_boundaries |

### 各题型的相似度计算

- **slider**：`1 - |a - b| / range`
- **single**：完全匹配 = 1.0，不匹配 = 0.2
- **tags**：Jaccard = `|A ∩ B| / |A ∪ B|`
- **ranking**：共有元素比例 × 0.6 + Kendall 一致性 × 0.4

### 硬过滤

目前仅一条：`bride_price_attitude` 中 B（诚意测试）与 D（过时陋习）互相排斥。

### 分数映射

原始加权分 (0~1) → `raw * 45 + 55` → 钳制到 55~99。

### 匹配流程

`runMatchingRound()` → 随机打乱已 opt-in 用户 → 贪心逐一配对 → 返回 `MatchResult[]`。
触发入口：`POST /api/match/trigger`（需 Bearer token = BETTER_AUTH_SECRET）。

## 常见操作速查

### 加一道新题
1. `survey-questions.ts` → 在对应 section 的 `questions` 数组里加
2. 如果是已有题型，无需改组件
3. `algorithm.ts` → 在 `computeDimensions()` 对应维度里加评分项

### 调整匹配权重
`algorithm.ts` → `computeDimensions()` 函数，修改各维度的 `weight` 和内部各题的系数。

### 加硬过滤规则
`algorithm.ts` → `HARD_FILTER_CONFIGS` 数组，加 `{ questionId, incompatiblePairs }` 条目。

## 编码约定

- 全中文面向用户的文案（UI、匹配原因、提示文字）
- 代码内标识符用英文（变量名、question ID、API 字段）
- Tailwind CSS 样式，使用 shadcn 主题变量（`bg-primary`, `text-muted-foreground` 等）
- 无注释叙述代码——注释仅用于非显而易见的决策或 trade-off
- tRPC 路由用 `protectedProcedure`，需登录才能访问
