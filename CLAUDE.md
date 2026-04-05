# CLAUDE.md — Family Meal Planner 开发规范

## 项目背景
双职工四口家庭的饮食管理 Web App。两个用户（Michelle + 老公）共享同一份 Postgres 数据库。

## 技术栈
- Next.js 14 App Router + TypeScript（严格模式）
- Tailwind CSS（移动优先，max-width: 480px）
- Neon Postgres（通过 @neondatabase/serverless）
- Anthropic Claude API（claude-sonnet-4-20250514）
- Vitest（单元测试）+ Playwright（E2E Smoke Test）

## 核心原则

### 1. 测试先行（TDD）
- 每个功能先写测试，再写实现
- Smoke Test 必须在任何功能开发前通过
- 单元测试覆盖所有 API route handler
- 禁止在测试未通过的情况下 commit

### 2. TypeScript 严格模式
- tsconfig 中 strict: true，不允许 any
- 所有类型定义在 src/lib/types.ts 集中管理
- API response 必须有明确的返回类型

### 3. API 规范
- 所有 API routes 在 src/app/api/ 下
- 统一错误格式：{ error: string, code: string }
- 成功格式：{ data: T }
- 所有 Claude API 调用必须在服务端（route.ts），绝不暴露给前端

### 4. 数据库规范
- 使用 Neon Postgres，通过 @neondatabase/serverless
- 所有 DB 操作在 src/lib/db.ts 封装
- 表名：pantry_items, recipes
- 禁止在组件里直接调用 DB

### 5. 环境变量
必须的环境变量（见 .env.local.example）：
- DATABASE_URL         # Neon Postgres connection string
- ANTHROPIC_API_KEY    # Anthropic API key

### 6. 组件规范
- 每个 Tab 是独立组件，通过 props 接收数据
- 数据获取在父组件（page.tsx）统一管理
- 使用 React Server Components 能用就用
- Client Components 加 'use client' 指令

### 7. 错误处理
- 所有 fetch 必须有 try/catch
- AI API 调用失败显示用户友好的中文错误信息
- 图片识别失败不影响主流程

### 8. 移动优先
- 所有样式 mobile-first
- 触摸目标最小 44px
- 不使用 hover-only 交互

## 数据结构

### PantryItem
```typescript
interface PantryItem {
  id: number
  name: string
  category: string
  qty: number
  unit: string
  location: 'freezer' | 'fridge' | 'pantry'  // 冰柜/冰箱/常温
  icon: string
  created_at: string
  updated_at: string
}
```

### ScanResult
```typescript
interface ScanResult {
  name: string
  qty: number
  unit: string
  location: 'freezer' | 'fridge' | 'pantry'
}
```

### RestockSuggestion
```typescript
interface RestockSuggestion {
  name: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}

interface RestockResponse {
  analysis: string
  suggestions: RestockSuggestion[]
}
```

## Claude API System Prompt（用于 restock API）
```
你是这个家庭的饮食顾问。
家庭成员：Michelle（健身习惯，高蛋白需求），老公，
Mia 11岁（游泳运动员，爱韭菜饺子/葱油面），
Marcus 6岁（爱肉/披萨/日式，不吃鸡蛋）。
饮食风格：中日意混合，快手为主，冰柜储存充足。
根据当前库存给出补货建议，返回纯 JSON，不加任何说明。
```

## Git 规范
- feat: 新功能
- fix: bug 修复
- test: 测试相关
- chore: 配置/依赖
- 每个 commit 必须测试通过

---

## 工程哲学：实事求是

> "没有调查就没有发言权。" —— 编码之前，先读懂代码库。

### 一、实事求是
- 编码前必须调查现有代码库（grep、glob、文件树），摸清家底再动手
- 不凭主观想象写代码，不照搬模板，从项目的**实际需求**出发设计方案
- **惩戒**：不看现有代码就开写，等同于闭门造车，严禁

### 二、抓主要矛盾
- 接到任务先分析：**核心问题是什么？** 主要矛盾抓住了，次要矛盾迎刃而解
- 不要眉毛胡子一把抓，先解决关键路径，再处理边缘 case
- 接到任务 → 分析主要矛盾 → 制定方案 → 集中力量解决 → 次要问题依次处理
- **反面教材**：一上来就重构整个系统、同时开三个分支、改了 A 破了 B —— 必败

### 三、从实践中来，到实践中去
- 先写能用的版本，再迭代优化，**不追求一步到位的完美方案**
- 代码写了就要跑，跑了就要测，测了就要改，螺旋上升
- 抽象的时机：用了一次别急着抽象 / 用了两次可以考虑 / 用了三次必须抽象

### 四、可读性即政治觉悟
- 变量名、函数名、注释 —— 让后续维护者能看懂是基本要求
- 优先复用已有组件和工具函数，不浪费已有劳动成果

### 五、战略藐视，战术重视
- 任何复杂需求拆解开来不过是一堆 CRUD 和条件判断，不要被需求文档吓倒
- 改动前必须**评估影响范围**，牵一发而动全身
- 关键操作必须有**回滚方案**，边界条件和异常情况逐一消灭

### 六、反对形式主义
- **反对过度设计**：一个计数器不需要工厂模式 + 观察者模式 + 依赖注入
- **反对空洞注释**：`// TODO: 优化性能` 留了三年没动，不如不写
- **反对虚荣指标**：覆盖率 100% 但全是无意义测试，不如关键路径 80%
- **反对文件膨胀**：单文件超过 500 行必须拆分
- **判断标准**：删掉这段代码系统照常运行 → 它就是形式主义，删掉

### 七、快速迭代，灵活应变
- 需求频繁变动 → 小步快跑，每次提交可用的增量
- 接口还没定义 → 先 Mock 数据开发，接口好了直接对接
- 第三方服务挂了 → 降级方案、缓存兜底、优雅降级
- 发现更优方案 → 果断切换，不恋战，不沉没成本谬误

### 三大纪律
1. **一切行动听指挥**：需求理解偏差率必须为 0%，不确定就先问
2. **不动无关代码**：不随意引入新依赖，不修改不相关的文件，不留无用注释
3. **每次任务以 To-do List 开始**：明确步骤，确认逻辑闭环，再动手
