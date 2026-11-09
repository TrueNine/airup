# Feature Authoring Notes

`airup-dev-bdd` 的落地细节:何时写 `.feature`、三方如何对齐、写作规则与常见误区。

## When To Write

- 新需求一到先写 `.feature` 草案,再进需求评审、迭代规划、技术设计与 TDD;一次只让一个 `Feature` 进入落地,之后一切以冻结后的契约为基准。

## Three-Party Alignment

- 产品经理定「做什么」:`Feature` 标题、`As a / I want / So that` 叙述、业务规则与例外,决定「做完」的标准。
- 项目经理定「做多少」:按场景与 `@req-`、`@priority`、`@scope` 标签评估工作量、拆分迭代。
- 开发者定「怎么验收」:把 `Given / When / Then` 翻译成稳定的测试与实现切片边界;三方逐场景确认后才冻结,有分歧先澄清。

## Writing Rules

- 一个场景一个独立行为、一个主要可观察结果;Given 是业务前置事实,When 是一个业务动作,Then 是可观察结果。
- 同一规则同时覆盖成功与拒绝:冲突、重复、取消、过期、外部失败、权限拒绝都要有场景。
- 用业务语言与统一术语;先草拟核心 happy path,再逐轮补边界与失败路径。
- 用 `@req-<id>`、`@priority`、`@smoke`、`@e2e` 等标签区分用途,让同一契约在不同测试层复用。

## Common Pitfalls

- 写成第二份产品说明书、一个场景塞多条规则、先写实现再补契约、三方各维护一份需求、只写 happy path。
