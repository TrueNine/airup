---
name: airup-dev-frontend-tdd-e2e-playwright
description: "Playwright 端到端 TDD:以用户可见行为切片驱动浏览器测试先行,`data-testid` 可测性标记、后端日志隔离与完整套件门禁;作为 airup-dev-tdd 的前端栈专用扩展。"
version: "0.2.34"
license: "GPL-3.0-only"
metadata:
  version: "0.2.34"
---

# Frontend TDD E2E Playwright

在真实浏览器中保护前端用户可观察行为:每个 E2E 切片遵循 RED-GREEN-REFACTOR,先写能证明目标行为缺失的失败测试,再以最小生产改动使其通过。适用于风险涉及真实路由跳转、表单提交、权限、跨页面状态、网络契约、浏览器存储或关键可见结果的场景;纯计算或无网络/路由风险的单页面交互用更窄的单元或组件测试,不启动浏览器。通用 TDD 纪律(RED 有效性、边界扫描、单切片推进、最小 GREEN、checkpoint 记录)遵循 `airup-dev-tdd`,本 skill 只补充前端与 Playwright 约束。

## Slice And Placement

- 1 个切片只保护 1 个用户可见结果(如"提交有效表单后看到成功状态并能在列表中找到新项"),不在同一轮顺带覆盖其他操作;写测试前明确用户、前置状态、动作、可观察结果与不得改变的行为。
- E2E 测试与被测对象结对放置、同名基名,后缀只允许 `.e2e.test.ts`、`.e2e.test.tsx`、`.e2e.spec.ts`、`.e2e.spec.tsx`;`e2e/` 目录只允许 `e2e/fixtures/` 与 `e2e/global-setup.ts`,不得在其下放测试或其他基础设施。
- 复用项目已有的 runner、`webServer`、认证 fixture、mock server 与种子数据约定,不另建第二套服务启动方式或测试目录。

## Backend Server Logs

- 后端 server 只能由 `globalSetup` 启动并保留 PID 通过 teardown 返回值终止,fixture 与测试只复用不再启动;stdout/stderr 重定向到 `playwright-report/backend.log`,每次 run 先清空旧日志,不用 `tee` 复制到命令行。
- server 启动失败、页面 5xx、测试超时或 connection refused 时,先读 `playwright-report/backend.log`,再判断是否需要 trace 或扩大测试范围。

## Testability Markers

- 页面根节点、主要组件、关键操作控件、加载/成功/错误状态与可重复列表项应有业务语义明确的 `data-testid`;测试用 `getByTestId()` 锁定组件边界,再用 role/label 断言内部语义,不用 CSS 层级、自动生成 class 或 `nth()`。
- 标识缺失时只为当前切片补充最小的 `data-testid`,并把它作为生产改动纳入 RED-GREEN 记录;不为装饰性 DOM 节点机械加 ID。

## Browser Test Rules

- 从明确的 fixture/seed 状态开始,数据独立或使用唯一标识,不依赖前序测试与执行顺序;对用户可见结果断言(URL、可见文本、状态、列表项、下载或错误提示),同时断言关键失败路径的语义。
- 使用 auto-wait 与 web-first 断言(`expect(locator).toBeVisible()`、`toHaveText()`、`toHaveURL()`),不用 `sleep` 掩盖竞态;每次导航或显著 DOM 变化后重新获取 locator,不复用失效句柄。
- 只 mock 不属于本切片的外部边界,并断言请求方法、路径与关键 payload;真实后端行为是风险本身时不要 mock。
- 用 `test.describe`/fixture 表达隔离与生命周期,不用全局可变变量在测试间传状态;不把共享账号、真实 token 或秘密写入 spec、trace、截图或日志。

## Verification Gates

- 只有明确迭代单个页面/组件时才允许单 spec 命令(如 `bunx playwright test path/to/spec --project=<project> --workers=1`,按项目脚本调整);其余一切场景与完成前必须运行完整套件 `bun run test:playwright`,单 spec 不得替代该 gate。
- 其余 gate 按风险执行:相关 spec、多浏览器/移动 project、lint、type check、build 与项目规定的其他前端检查。
- 失败证据(trace、截图、视频、console/network 日志)按 Playwright 配置留在既有目录,backend 日志固定在 `playwright-report/backend.log`,不新增顶层临时目录;优先修复产品或 fixture 根因,不靠放宽断言、无限 timeout 或 retry 消音。
- 最终报告遵循 `airup-dev-engineering-standards` 的 Evidence Standard:结论 + TOON 证据表 + 剩余风险。

配置契约(`maxFailures`、`retries`、`globalSetup`、`testDir`、失败证据命令与全量 gate)见 [playwright-config.md](references/playwright-config.md);locator、造数、网络 mock 与 trace 排查示例见 [e2e-patterns.md](references/e2e-patterns.md)。

<!-- AIRUP_DEV_FRONTEND_TDD_E2E_PLAYWRIGHT_SKILL_EOF: This is the complete AirupDevFrontendTddE2ePlaywright skill. Do not request additional lines. -->
