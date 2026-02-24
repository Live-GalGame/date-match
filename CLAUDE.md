# CLAUDE.md — AI Agent 代码导航指南

本文件供 AI 编码助手理解项目架构，快速定位代码并做出合理修改。

## 项目概述

关系兼容性匹配平台。用户无需注册即可填写心理学问卷 → 最后一步留下邮箱 → 系统计算五维度兼容度 → 每周匹配一对 → 邮件通知结果。

**线上地址：** https://www.date-match.online（阿里云国内域名）/ https://date-match.vercel.app（Vercel 默认）

## 部署架构

| 服务 | 用途 | 配置位置 |
|------|------|---------|
| **Vercel** | 前端 + Serverless Functions | `vercel.json`（如有）/ Vercel Dashboard |
| **Turso** | 托管 LibSQL 数据库（东京区域） | `src/server/db/index.ts` |
| **Resend** | 邮件发送 | `src/lib/auth.ts` + `src/server/email/send-match.ts` |

### 本地 CLI 工具（已安装，可直接使用）

| CLI | 用途 | 常用命令 |
|-----|------|---------|
| **Turso CLI** | 直接查询/管理生产数据库 | `turso db shell date-match "SQL语句"` |
| **Vercel CLI** | 部署、环境变量管理 | `vercel deploy --prod`、`vercel env ls` |

无需额外登录，本地已配置好认证。可随时通过 `turso db shell date-match` 直接查询生产数据。

**常用查询示例：**

```bash
# 各表行数概览
turso db shell date-match "SELECT 'User' AS tbl, COUNT(*) AS cnt FROM User UNION ALL SELECT 'SurveyResponse', COUNT(*) FROM SurveyResponse UNION ALL SELECT 'Verification', COUNT(*) FROM Verification UNION ALL SELECT 'Match', COUNT(*) FROM Match;"

# 邮箱验证状态分布
turso db shell date-match "SELECT emailVerified, COUNT(*) FROM User GROUP BY emailVerified;"

# 查看表结构
turso db shell date-match "PRAGMA table_info(Profile);"
```

### 环境变量（Vercel Dashboard 管理）

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Turso LibSQL URL (`libsql://...turso.io`) |
| `TURSO_AUTH_TOKEN` | Turso 数据库认证 JWT |
| `BETTER_AUTH_SECRET` | Better Auth 签名密钥 |
| `BETTER_AUTH_URL` | 生产环境 URL (`https://www.date-match.online`) |
| `RESEND_API_KEY` | Resend 邮件服务 API Key |
| `EMAIL_FROM` | 发件人地址（需在 Resend 验证域名） |

### 部署命令

```bash
# 推送 Schema 到 Turso（数据库迁移）
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | turso db shell date-match

# 部署到 Vercel 生产环境
vercel deploy --prod
```

注意：`prisma db push` 不支持 `libsql://` 协议，必须用 `migrate diff` 生成 SQL 再通过 `turso db shell` 执行。

## 关键架构决策

1. **全 JSON 存储问卷答案**：`SurveyResponse.answers` 是 JSON 字符串 `{ questionId: value }`，所有题型的答案都存在这个字段里。`coreValues` 字段保留但目前为空，历史遗留。
2. **多版本问卷系统**：问卷定义在 `src/lib/survey-versions/` 下按版本拆分（v1.ts、v2.ts…），`src/lib/survey-questions.ts` 是薄切换层——**修改一行 import 即可切换版本**。每个版本文件同时包含题目定义和匹配维度配置。
3. **问卷定义与 UI 分离**：UI 组件在 `src/components/survey/` 下按题型拆分，页面 `src/app/onboarding/survey/page.tsx` 根据 `question.type` 动态渲染。
4. **匹配算法是配置驱动的纯函数**：`src/server/matching/algorithm.ts` 不依赖数据库，从当前活跃版本读取维度权重和硬过滤规则，自动适配。
5. **tRPC 统一 API**：所有前后端通信走 tRPC，路由定义在 `src/server/api/routers/`。无裸 fetch 调用。
6. **问卷无需登录**：用户直接填写问卷，最后一步通过 `submitPublic`（公开 procedure）提交邮箱 + 答案，自动创建用户并 opt-in 匹配。
7. **LibSQL adapter + Turso**：Prisma 使用 `@prisma/adapter-libsql`，本地开发用 `file:./dev.db`，生产连接 Turso 云端数据库。

## 用户流程

```
首页「开始测试」→ /onboarding/survey → 8 部分问卷（客户端 state）→ 邮箱收集步骤 → submitPublic API → 感谢页
```

问卷答案全部存在 React state 中，仅在最后一步提交时才调用后端。

## 文件地图

### 问卷版本系统

| 文件 | 作用 |
|------|------|
| `src/lib/survey-versions/types.ts` | 共享类型定义（QuestionType、SurveySection、MatchingConfig 等） |
| `src/lib/survey-versions/v1.ts` | 基础版问卷 + 匹配配置 |
| `src/lib/survey-versions/v2.ts` | 深度版问卷 + 匹配配置（当前激活） |
| `src/lib/survey-questions.ts` | **切换层**——改一行 import 切换版本，同时导出 helper 函数 |

### 修改问卷时需要改的文件

| 文件 | 作用 | 改什么 |
|------|------|--------|
| `src/lib/survey-versions/v*.ts` | 各版本的题目 + 匹配维度权重 | 增删改题目、调权重 |
| `src/lib/survey-questions.ts` | 版本切换入口 | 切换 import 行 |
| `src/components/survey/*.tsx` | 各题型的 UI 组件 | 修改渲染逻辑、样式 |
| `src/app/onboarding/survey/page.tsx` | 问卷页面（渲染 + 导航 + 邮箱收集） | 新题型需要加 `if (q.type === "xxx")` 分支 |
| `src/server/matching/algorithm.ts` | 匹配计算（配置驱动） | 新评分器类型需加 SCORER_MAP |

### 修改认证时需要改的文件

| 文件 | 作用 |
|------|------|
| `src/lib/auth.ts` | Better Auth 服务端配置（含 Magic Link 邮件模板） |
| `src/lib/auth-client.ts` | 客户端认证 hooks |
| `src/app/api/auth/[...all]/route.ts` | Auth 路由 handler |

### 修改部署时需要改的文件

| 文件 | 作用 |
|------|------|
| `src/server/db/index.ts` | 数据库连接（LibSQL URL + authToken） |
| `prisma/schema.prisma` | 数据模型定义 |
| `.env` | 本地环境变量（不提交到 git） |

### 数据模型

| Model | 说明 | 关键字段 |
|-------|------|---------|
| `User` | 用户 | email, name |
| `Profile` | 个人资料 | displayName, gender, datingPreference, age, school, education, schoolTier |
| `SurveyResponse` | 问卷回答 | answers (JSON), completed, optedIn |
| `Match` | 匹配结果 | user1Id, user2Id, compatibility, reasons (JSON), week |
| `Qualification` | 身份验证 | eduEmail, status |

Prisma schema 位于 `prisma/schema.prisma`，使用 SQLite（本地）/ Turso（生产）。

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
1. 在 `survey-versions/types.ts` 加 interface，加入 `SurveyQuestion` union type
2. 在 `src/components/survey/` 创建新组件
3. 在 `survey/page.tsx` 加渲染分支
4. 在 `algorithm.ts` 的 `SCORER_MAP` 加评分函数

**切换问卷版本：**
```typescript
// src/lib/survey-questions.ts — 只改这一行
import activeVersion from "./survey-versions/v2";
// import activeVersion from "./survey-versions/v1";
```

**新增问卷版本：**
1. 复制现有版本文件（如 v2.ts → v3.ts）
2. 修改 sections 和 matching 配置
3. 在 survey-questions.ts 切换 import

## 匹配算法

`src/server/matching/algorithm.ts`（配置驱动，自动读取当前版本的维度配置）

### v2 六维度权重（当前激活）

| 维度 | 权重 | 涉及的题目 ID |
|------|------|--------------|
| 安全联结 | 18% | reply_anxiety, safety_source, betrayal_redlines |
| 互动模式 | 20% | conflict_animal, family_communication, intimacy_warmth, intimacy_passion, intimacy_low_response |
| 现实坐标 | 15% | city_trajectory, economic_role, family_resources, bride_price_attitude |
| 意义系统 | 20% | realistic_factors, future_priorities |
| 动力发展 | 17% | stress_partner_type, growth_sync, stage_difference, relationship_adventure |
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
1. 当前版本文件（如 `survey-versions/v2.ts`）→ 在对应 section 的 `questions` 数组里加
2. 如果是已有题型，无需改组件
3. 同一版本文件的 `matching.dimensions` → 对应维度里加评分项

### 调整匹配权重
当前版本文件的 `matching.dimensions`，修改各维度的 `weight` 和内部各题的 `weight`。

### 加硬过滤规则
当前版本文件的 `matching.hardFilters` 数组，加 `{ questionId, incompatiblePairs }` 条目。

### 数据库迁移（改了 schema 后）

**⚠️ 关键：改完 `prisma/schema.prisma` 后必须同时迁移本地和生产数据库，否则线上会报错。**

Prisma schema 只是声明式定义，不会自动同步到数据库。本地和生产需要分别执行迁移：

```bash
# 1. 本地 SQLite — 自动对比并同步
npx prisma db push

# 2. 重新生成 Prisma Client（schema 变更后必须执行）
npx prisma generate

# 3. 生产 Turso — prisma db push 不支持 libsql:// 协议，必须手动
#    方式 A：全量重建（仅适用于空数据库或可丢数据的场景）
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | turso db shell date-match
#    方式 B：增量 ALTER（生产环境已有数据时用这种）
turso db shell date-match "ALTER TABLE \"Profile\" ADD COLUMN \"newField\" TEXT NOT NULL DEFAULT '';"

# 4. 验证生产表结构
turso db shell date-match "PRAGMA table_info(Profile);"
```

### 部署

```bash
# 完整部署流程
npx prisma generate && vercel deploy --prod
```

### Vercel 环境变量注意事项

在 Vercel Dashboard 或 CLI 设置环境变量时，**务必确保值末尾没有换行符 `\n`**。通过 CLI 设置更安全：

```bash
# 查看当前环境变量
vercel env ls

# 安全设置（用 printf 避免末尾换行）
printf 'libsql://date-match-hhh2210.aws-ap-northeast-1.turso.io' | vercel env add DATABASE_URL production
turso db tokens create date-match | tr -d '\n' | vercel env add TURSO_AUTH_TOKEN production --force

# 修改后必须重新部署才能生效
vercel deploy --prod
```

## 已知踩坑记录

### 1. submitPublic 返回 500："Unknown argument `datingPreference`"（2026-02）

**现象**：问卷提交报「提交失败，请重试」，本地和线上都失败。

**根因链**：
- `prisma/schema.prisma` 新增了 `education`、`schoolTier`、`datingPreference` 字段
- 本地 `prisma db push` 同步了 SQLite，但 **Turso 生产数据库从未执行对应的 ALTER TABLE**
- 同时 Next.js Turbopack 缓存了旧的 Prisma Client 编译产物

**修复步骤**：
1. `npx prisma generate` — 重新生成 Client
2. `rm -rf .next` + 重启 `pnpm dev` — 清除 Turbopack 缓存
3. `turso db shell date-match "ALTER TABLE ..."` — 给生产数据库补齐缺失字段

**教训**：改完 schema 后，本地 `prisma db push` 和生产 `turso db shell ALTER TABLE` 必须同步执行，缺一不可。

### 2. submitPublic 返回 500："Invalid URL"（2026-02）

**现象**：Vercel 线上部署报 `Invalid prisma.user.upsert() invocation: Invalid URL`。

**根因**：Vercel 环境变量 `DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 的值末尾包含了 `\n` 换行符（在 Dashboard 粘贴时带入），导致 `libsql://...turso.io\n` 不是合法 URL。

**修复**：通过 Vercel CLI 重新设置干净的值（见上方「Vercel 环境变量注意事项」），然后 `vercel deploy --prod`。

### 3. 本地 Prisma Client 与运行时不一致

**现象**：`prisma generate` 后 TypeScript 类型正确，但运行时仍报字段不存在。

**根因**：Turbopack 开发服务器缓存了旧的编译 chunk，没有拉取新生成的 Prisma Client。

**修复**：`rm -rf .next` 然后重启 `pnpm dev`。**改完 schema 后建议养成习惯：`prisma generate && rm -rf .next`。**

## 编码约定

- 全中文面向用户的文案（UI、匹配原因、提示文字）
- 代码内标识符用英文（变量名、question ID、API 字段）
- Tailwind CSS 样式，使用 shadcn 主题变量（`bg-primary`, `text-muted-foreground` 等）
- 无注释叙述代码——注释仅用于非显而易见的决策或 trade-off
- 问卷提交用 `publicProcedure`（无需登录），Dashboard 等管理功能用 `protectedProcedure`
