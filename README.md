# 关系基因匹配测试 · 深度版

> 不止于相遇，致力于相知。我们探索的，是爱何以科学，又何以神圣。

基于现代心理学的关系兼容性测试平台。融合依恋理论、沟通分析、人生叙事与成长型思维，将抽象的感觉转化为可供彼此勘探的地图。

**在线体验：https://date-match.vercel.app**

## 核心功能

- **深度问卷**：8 部分 31 道题，涵盖安全联结、互动模式、意义系统、动力发展、日常系统五大维度
- **多种题型**：滑动条、单选、多选、排序、开放文本
- **零门槛体验**：无需注册即可填写问卷，最后一步留下邮箱即可
- **五维度匹配算法**：加权相似度 + Jaccard 重叠 + Kendall 序相关
- **每周匹配轮次**：自动配对，邮件通知匹配结果
- **现实坐标自查**：经济、家庭、健康、发展全方位真实条件梳理

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 数据库 | Turso (LibSQL) + Prisma |
| 认证 | Better Auth (Magic Link) |
| API | tRPC + React Query |
| UI | React 19 + Tailwind CSS + Radix UI |
| 邮件 | Resend |
| 部署 | Vercel |
| 语言 | TypeScript + Zod |

## 快速开始（本地开发）

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 初始化本地 SQLite 数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

本地开发时 Magic Link 不会真正发邮件，会打印到终端控制台。

## 部署

项目部署在 **Vercel + Turso** 上：

| 服务 | 用途 | 费用 |
|------|------|------|
| [Vercel](https://vercel.com) | 前端 + Serverless Functions | Hobby 免费 |
| [Turso](https://turso.tech) | 托管 LibSQL 数据库 | 免费套餐 |
| [Resend](https://resend.com) | 邮件发送（Magic Link + 匹配通知） | 需验证域名 |

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | Turso 数据库 URL | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso 认证 token | `eyJ...` |
| `BETTER_AUTH_SECRET` | 认证签名密钥（随机字符串） | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | 生产环境 URL | `https://date-match.vercel.app` |
| `RESEND_API_KEY` | Resend API 密钥 | `re_xxx` |
| `EMAIL_FROM` | 发件人地址（需在 Resend 验证域名） | `noreply@yourdomain.com` |

### 部署步骤

```bash
# 1. 创建 Turso 数据库
turso db create date-match
turso db show date-match --url       # 获取 DATABASE_URL
turso db tokens create date-match    # 获取 TURSO_AUTH_TOKEN

# 2. 推送 Schema 到 Turso
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | turso db shell date-match

# 3. 部署到 Vercel（设置环境变量后）
vercel deploy --prod
```

## 项目结构

```
src/
├── app/                    # Next.js 页面
│   ├── api/                # API 路由 (auth, trpc, match)
│   ├── auth/signin/        # 登录页
│   ├── dashboard/          # 用户仪表板
│   └── onboarding/survey/  # 问卷页（主要用户入口）
├── components/
│   ├── survey/             # 问卷组件 (滑动条/单选/多选/排序/文本)
│   └── landing/            # 首页组件
├── lib/                    # 工具库 (认证、问卷定义、tRPC 客户端)
└── server/
    ├── api/routers/        # tRPC 路由 (profile, survey, match, qualification)
    ├── db/                 # Prisma 客户端 (LibSQL adapter)
    ├── email/              # 邮件发送
    └── matching/           # 匹配算法核心
```

## 用户流程

```
首页 → 开始测试（无需登录）→ 8 部分问卷 → 留下昵称+邮箱 → 提交 → 等待每周匹配邮件
```

## 问卷维度

| 维度 | 探测目标 | 匹配权重 |
|------|---------|---------|
| 安全联结 | 依恋焦虑、安全感来源、信任红线 | 20% |
| 互动模式 | 冲突风格、家庭沟通、亲密需求 | 25% |
| 意义系统 | 现实择偶因素、彩礼观、人生优先级 | 25% |
| 动力发展 | 压力支持偏好、成长同步性、探索欲 | 20% |
| 日常系统 | 生活节奏、数字边界 | 10% |

## 许可

MIT
