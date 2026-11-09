---
name: airup-dev-tdd
description: "纯 TDD 工作流:适用于新功能、缺陷修复、行为保持重构、特征测试与先刻画后修复,含系统化调试与变异测试纪律。需要以测试优先构建或修改可观察行为时使用;不适用于纯文档修改或无行为产出的原型。"
version: "0.2.35"
license: "GPL-3.0-only"
metadata:
  version: "0.2.35"
---

# Dev TDD

以测试优先的节奏构建或修改行为:先定义可观察行为,使其失败,再使其通过,仅在通过后重构。适用于任意语言与架构。

任务类型四选一:`greenfield_feature`(全新行为)、`bug_fix`(复现后修复)、`pure_refactor`(行为保持)、`characterize_then_fix`(先用特征测试冻结错误契约,再修复)。

## Protocol

编辑生产代码前,在 `.airup/.tdd_checkpoints/<task-slug>.toon` 建立检查点(TOON 格式,定义见 `airup-dev-engineering-standards` 的 Structured Data Format;完整示例见 [tdd-checkpoint.toon](templates/tdd-checkpoint.toon)):

- `phase` 取值 `start|red|scan|green|finish`:`start` 声明范围(首行,恰好一次);`red` 记录目标测试因目标风险失败(exit 非 0);`green` 记录最小实现后同一测试通过(exit 为 0);`scan` 可选,记录下一个切片或推迟的反例;`finish` 收尾(恰好一次且为末行)。
- `slice` 为行为切片短名;`cmd` 为真实命令,`start`/`scan` 用 `none`;`note` 一句话证据,含逗号或冒号时加双引号。禁止"测试失败了"这类含糊描述。
- 每个 slice 先 `red` 后 `green`;`finish` 前最后一个 slice 必须已 `green`。历史行不得修改或删除;表头行数由工具维护。
- 仅需两个动作,均在安装后的 skill 目录执行:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/tdd-checkpoint.ts" append --checkpoint .airup/.tdd_checkpoints/<task-slug>.toon --phase red --slice login-rate-limit --cmd "bun test login.test.ts" --exit 1 --note "429 未生效"
bun "<SKILL_INSTALL_ROOT>/scripts/tdd-checkpoint.ts" validate --checkpoint .airup/.tdd_checkpoints/<task-slug>.toon
```

- 时机:编辑生产代码前 `append start` 并 `validate`;每次 RED、GREEN 后 `append`;收尾前 `append finish` 并 `validate`。校验失败时补齐证据后再继续。
- 目标项目未启用 `.airup/` 目录时,不要擅自创建 Airup 专属结构;改用项目已有的日志位置并在交付说明中注明。用宿主 todo 工具跟踪当前切片即可,不要求协议与 todo 双向同步。

## Core Loop

1. 定义一个最小行为切片,说明稳定边界(公共契约、传输、编排、核心逻辑、持久化或副作用)与任务类型。
2. 先写测试:全新行为用期望行为测试,缺陷用复现测试,重构用特征测试。
3. 观察 RED:测试必须因目标风险失败。因测试自身报错则修测试;立即通过则先证明它能失败(临时变异后立即恢复)。
4. 反例脑暴(2-5 分钟,维度:输入分区、状态序列、外部失败、时间/并发、不变量、表示):发现值得处理的候选时,收紧当前 RED 或记入 `scan` 行;每次只实现一个切片。
5. 实现使当前测试通过的最小生产变更;GREEN 后才重构,重构后同组测试仍须通过。
6. 将 `scan` 中的后续切片逐个转为新 RED,直至完成。

## Bug Fix And Debugging

根因未证实时,先调试再 RED:运行最小复现命令并记录命令、exit code 与失败断言;对比最后一个已知正确点与首个错误点;一次只验证一个假设,用证据解释因果链;不在复现前修改生产代码(无法复现时说明原因),不为转绿删除失败测试,不止于压制症状。难以复现的策略见 [debugging-tactics.md](references/debugging-tactics.md)。

## Situation Guides

- 测试层:按风险选最窄有效层,核心规则与纯函数用单元测试,编排与协作顺序用组件测试,传输契约与授权用边界测试,持久化与事务敏感行为用集成测试,跨层协作用少量端到端测试,依赖方向用架构测试;详见 [test-slices.md](references/test-slices.md)。
- 特征测试:修改保持行为的代码前先冻结现状,覆盖正常路径与棘手边界,断言返回值、错误语义、持久化变更与副作用;详见 [characterization-tests.md](references/characterization-tests.md)。
- 变异测试:切片 GREEN 后可选,用幸存变异补最窄层的可观察断言,不得为分数削弱断言或扩大排除;详见 [mutation-testing.md](references/mutation-testing.md)。
- Feature 驱动:存在 `airup-dev-bdd` 产出的 Gherkin `.feature` 时,每个 `Scenario` 对应一个行为切片并保留 `@req-<id>` 追踪,`.feature` 变更即需求变更;详见 [feature-driven-tdd.md](references/feature-driven-tdd.md)。

## Rules

- 没有支持期望行为的失败测试时,不添加或修改生产行为;不以"太小""稍后补""手工验证已足够"为由跳过 RED。
- 当前行为错误时,明确选择"仅刻画兼容"或"先刻画再修复",不把错误契约命名为期望契约。
- 纯重构不改公共契约、错误语义、排序、分页、事务、安全规则与副作用;断言可观察行为,不断言实现细节。
- 在失败测试前添加了生产代码时,回退该修改,先产生 RED;实现之后才补的测试不视为 TDD 证据。
- 广泛发现候选后,每次仍只允许一个切片进入实现;deferred 的候选说明理由,不静默丢弃。
- 面向用户的最终报告遵循 `airup-dev-engineering-standards` 的 Evidence Standard,并列出受保护行为、测试层与剩余风险。

## References

- [anti-patterns.md](references/anti-patterns.md):常见 TDD 失败模式。
- [test-slices.md](references/test-slices.md):按风险选择测试层。
- [characterization-tests.md](references/characterization-tests.md):为复杂现有行为写特征测试。
- [mutation-testing.md](references/mutation-testing.md):变异测试的前置条件、分诊与门槛政策。
- [feature-driven-tdd.md](references/feature-driven-tdd.md):与 Gherkin `.feature` 的对齐规则。
- [debugging-tactics.md](references/debugging-tactics.md):难以复现问题的取证策略。
- [eval-cases.md](references/eval-cases.md):迭代本 skill 用的失败样例。
- [tdd-checkpoint.toon](templates/tdd-checkpoint.toon):协议检查点示例。

<!-- AIRUP_DEV_TDD_SKILL_EOF: This is the complete AirupDevTdd skill. Do not request additional lines. -->
