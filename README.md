# 关系基因匹配测试 · 深度版

> 不止于相遇，致力于相知。我们探索的，是爱何以科学，又何以神圣。

基于现代心理学的关系兼容性测试平台。融合依恋理论、沟通分析、人生叙事与成长型思维，将抽象的感觉转化为可供彼此勘探的地图。

## 核心功能

- **深度问卷**：8 部分 31 道题，涵盖安全联结、互动模式、意义系统、动力发展、日常系统五大维度
- **多种题型**：滑动条、单选、多选、排序、开放文本
- **五维度匹配算法**：加权余弦相似度 + Jaccard 重叠 + Kendall 序相关
- **每周匹配轮次**：Opt-in 机制，贪心配对，自动邮件通知
- **现实坐标自查**：经济、家庭、健康、发展全方位真实条件梳理

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 数据库 | SQLite + Prisma + LibSQL |
| 认证 | Better Auth (Magic Link) |
| API | tRPC + React Query |
| UI | React 19 + Tailwind CSS + Radix UI |
| 邮件 | Resend |
| 语言 | TypeScript + Zod |

## 快速开始

```bash
# 安装依赖
npm install

# 初始化数据库
npx prisma db push

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## 项目结构

```
src/
├── app/                    # Next.js 页面
│   ├── api/                # API 路由 (auth, trpc, match)
│   ├── auth/signin/        # 登录页
│   ├── dashboard/          # 用户仪表板
│   └── onboarding/         # 引导流程 (资料 → 验证 → 问卷)
├── components/
│   ├── survey/             # 问卷组件 (滑动条/单选/多选/排序/文本)
│   └── landing/            # 首页组件
├── lib/                    # 工具库 (认证、问卷定义、tRPC 客户端)
└── server/
    ├── api/routers/        # tRPC 路由 (profile, survey, match, qualification)
    ├── db/                 # Prisma 客户端
    ├── email/              # 邮件发送
    └── matching/           # 匹配算法核心
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
