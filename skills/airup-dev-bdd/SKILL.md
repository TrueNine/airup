---
name: airup-dev-bdd
description: "把业务需求成文为 Gherkin `.feature` 行为契约:稳定 `@req-<id>` 需求 ID、三方对齐、可执行验收;新需求先于实现固定行为,配合 airup-dev-tdd 的 RED-GREEN 切片。适用于需求对齐、验收标准定义与业务行为回归保护。"
version: "0.2.40"
license: "GPL-3.0-only"
metadata:
  version: "0.2.40"
---

# Behavior-Driven Development

把新需求先行成文为 Gherkin `.feature` 行为契约:产品、项目与开发三方对照同一份纯文本确认「做什么、做多少、怎么验收」,同一份文件又能被 Cucumber 家族、SpecFlow、pytest-bdd、Jest-Cucumber 等测试框架直接执行。新需求在评审、规划与实现之前先写 `.feature`,而不是先写代码再补测试。

## Contract Rules

- `.feature` 是需求契约与唯一权威来源:三方逐场景确认后才冻结,任何一方有分歧先澄清,不各自默记一个版本。
- 每条需求分配稳定 ID,用 `@req-<id>` 标签标注在 `Feature` 或 `Scenario` 上,供实现切片与验收追踪;一个 `Feature` 只承载一个业务能力。
- 场景表达一个独立行为和一个主要结果:`Given` 是已成立的业务前置事实,`When` 是恰好一个业务动作,`Then` 是可观察结果,按该顺序书写。
- 只断言 observable behavior(结果、状态变化、业务事件、错误语义、权限结果、外部副作用),不把数据库结构、类名、mock 或调用顺序写进契约。
- 冲突、重复、取消、过期、外部失败、权限拒绝等重要规则必须有场景,不能只写 happy path;术语歧义先澄清,不用技术名词掩盖业务决策。
- 业务边界、participant 或生命周期不清时,先问 `airup-ddd-event-storming-design`,再回来补全场景,不直接写完整 `.feature`。

## Scenario Format

```gherkin
Feature: <业务能力>
  作为 <participant>
  我希望 <业务意图>
  以便 <业务价值>

  @req-<id>
  Scenario: <可观察行为>
    Given <已成立的业务事实>
    When <participant 执行一个业务动作>
    Then <可观察结果>
```

「未实现的 step definition」或「行为尚不存在导致的断言失败」是目标行为的 RED 证据,可交给 `airup-dev-tdd` 按切片实现;实现时只做让当前场景通过的最小变更,不在场景中预绑定表、Controller 或第三方工具。

## Validator

skill 自带轻量校验器,在 Cucumber 执行前检查 `.feature` 是否满足最小行为契约,不替代 step execution。在已安装的 Airup skill 根目录中执行：

```bash
bun scripts/bdd.ts --input path/to/behavior.feature
```

校验要求:每个 Feature 或 Scenario 能通过 `@req-<id>` 追踪到需求;Feature 含 `As a`、`I want`、`So that` 叙述;每个 Scenario 含 Given、恰好一个 When 和 Then,并按该顺序表达一个主要行为。校验通过返回退出码 `0`,否则把具体错误写入标准错误并返回 `1`。可执行契约与测试位于 [bdd.ts](scripts/bdd.ts)、[bdd.test.ts](scripts/bdd.test.ts)、[bdd.feature](scripts/bdd.feature)、[bdd.steps.ts](scripts/bdd.steps.ts) 和 [bdd.feature.test.ts](scripts/bdd.feature.test.ts),以实际 skill 安装根目录为准。

## Related Skills

- `airup-ddd-event-storming-design`:业务边界、participant 或领域事件不清时先建模。
- `airup-dev-tdd`:把场景作为 RED 证据,以 tests-first 切片实现行为。
- `airup-verification-before-completion`:交付前验证场景覆盖、测试结果与剩余风险;最终报告遵循 `airup-dev-engineering-standards` 的 Evidence Standard(结论 + TOON 证据表 + 剩余风险)。

## References

- [feature-authoring.md](references/feature-authoring.md):三方对齐、写作规则与常见误区。
- [typescript-project.md](references/typescript-project.md):TypeScript 项目布局与 runner 选择。
- [java-project.md](references/java-project.md):Java/Kotlin 项目布局与 runner 选择。

<!-- AIRUP_DEV_BDD_SKILL_EOF: This is the complete AirupDevBdd skill. Do not request additional lines. -->
