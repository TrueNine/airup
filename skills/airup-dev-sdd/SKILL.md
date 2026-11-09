---
name: airup-dev-sdd
description: "维护可验证的规范性规格(SPEC):以稳定 ID 的 MUST/MUST NOT 规则驱动设计、实现与测试,先让规范验证失败再最小实现。适用于 API/数据契约、兼容性与迁移等需要权威行为定义的任务。"
version: "0.2.37"
license: "GPL-3.0-only"
metadata:
  version: "0.2.37"
---

# Specification-Driven Development

把「系统应该满足什么」写成可验证的规范性规格(SPEC):每条关键规则分配稳定 ID(如 `SPEC-001`)并标注 [MUST] / [MUST NOT] 强度,作为设计、实现、测试与变更审查的 source of truth。适用于 API、协议、数据格式、配置、CLI 或跨团队契约等需要权威行为定义的任务;探索性原型或无可验证契约的局部改动不需要它。

## Workflow

1. 圈定契约边界:确认参与者、消费者与适用范围,检查 target project 已有的规范、schema、版本策略与兼容约定。
2. 写规范规则:每条规则分配稳定 `SPEC-*` ID 与 [MUST]/[MUST NOT]/[SHOULD]/[MAY] 强度,写清输入、输出、错误语义、时序、幂等性、权限与副作用;不把设计偏好写成 MUST,不用「正常」「适当」等模糊词代替可验证约束。
3. 给出示例与反例:高风险规则配 valid / invalid / boundary example;示例证明规范可理解、可执行,不替代规范。
4. 派生最小切片:每个实现与测试切片记录覆盖的 `SPEC-*` 与首个失败验证,实现交给 `airup-dev-tdd`,不按代码目录反拼规范。
5. 验证符合性:运行对应的 unit、contract、schema 或 integration tests,确认实现、测试、示例与文档对齐同一规范版本;发现规范冲突先停下澄清,不用实现细节静默解决。
6. 交付前走 `airup-verification-before-completion`;最终报告遵循 `airup-dev-engineering-standards` 的 Evidence Standard(结论 + TOON 证据表 + 剩余风险)。

## Specification Template

```text
# <Specification Title>
Scope: 规范 ID、适用消费者、生产者、版本
Rules: `SPEC-001` [MUST] <可验证规则>;`SPEC-002` [MUST NOT] <禁止行为>
Contract: 输入、输出、错误、副作用
Examples: valid / invalid / boundary
Compatibility: 版本策略、迁移步骤、回滚边界
Traceability: `SPEC-*` 与设计、测试、消费者的对应
Verification Evidence: 结论 + TOON 证据表 + 剩余风险
```

## Change Control

- 先让规范验证失败,再实现最小 change;兼容性变更同样先更新 `SPEC-*`、示例与测试,再动代码。
- 规范变更是需求变更:说明原因与兼容性影响,breaking change 必须给出迁移步骤、版本策略与回滚边界。
- 追踪 ID 不造假:`SPEC-*` 不绑定易变的类名、文件名或表名,不为报告好看虚构覆盖关系。

## Related Skills

- `airup-dev-bdd`:把规范中的业务行为写成协作可读的场景。
- `airup-ddd-event-storming-design`:领域行为或生命周期规则不清时先建模。
- `airup-dev-tdd`:以 tests-first 方式实现 `SPEC-*` 行为。
- `airup-verification-before-completion`:交付前收集规范符合性证据。

<!-- AIRUP_DEV_SDD_SKILL_EOF: This is the complete AirupDevSdd skill. Do not request additional lines. -->
