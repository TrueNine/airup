---
name: airup-implementation-planning
description: "把已确认的需求、DDD 设计或胶水实现选型转成小步可验证的实施计划,并安全执行:每任务给出文件、验证命令与预期 RED/GREEN,偏离即修计划;支持互斥所有权的并行委托。不负责 DDD 建模或代码评审。"
version: "0.2.31"
license: "GPL-3.0-only"
metadata:
  version: "0.2.31"
---

# Implementation Planning

把已确认的需求、DDD 设计(如 `airup-ddd-event-storming-design` 的产出)、胶水实现选型或缺陷调查结果,转成小步可验证的实施计划并安全执行。规划阶段不修改生产代码;代码评审使用 `airup-dev-code-review`。

## Planning Workflow

1. 读需求、既有契约与项目 `AGENTS.md`:重述目标与范围,列出不得改变的行为、公共契约,以及数据、持久化、顺序、安全与并发风险。
2. 存在经 `airup-dev-bdd` 确认的 `.feature` 时,行为切片与其中 Scenario 对应并保持 `@req-` 追踪,不发明新的行为结构。
3. 把范围拆成 2-5 分钟可独立验证的行为切片;混杂测试与实现、行为变更与清理、调试与修复的步骤一律拆开。
4. 每个任务给出:目标文件、验证命令(项目中能发现真实命令时不得省略)、预期 RED/GREEN/unchanged、完成标准。
5. 标记需要 `airup-dev-tdd` 的任务。
6. 声明执行前需要用户确认的前提;不假定风险性范围扩张已获批准。

## Execution

对每个任务循环三步:预检 → 实现 → 记录证据。

- 预检计划有效性:切片有测试或验证命令、行为变更写明 RED/GREEN 预期、文件与模块明确、计划与仓库当前状态不冲突;计划不安全时先修订或请求确认再动手。
- 实现时一次只做一个任务,只运行该任务指定的验证命令,记录一行证据(命令、exit code、结果)。
- 偏离(意外失败、计划与现实冲突、需要超出计划的文件范围)时停下修订计划,而不是硬编继续;意外失败或新增行为按 `airup-dev-tdd` 处理:先复现与根因证据,再 RED-GREEN。
- 证据格式遵循 `airup-dev-engineering-standards` 的 Evidence Standard,一行即可。

## Parallel Delegation

- 仅在文件所有权与验证边界互斥时拆分;所有权重叠、需要计划外隐藏上下文或必须一次连贯编辑时不拆。
- 每个代理给出:目标、拥有文件、禁止文件、验证命令;规划者不写入已委派范围。
- 由集成者统一运行最终验证并解决冲突;不要求固定的 Parallel Work Plan 模板,对话中给出等价清单即可。

## Rules

- 规划阶段不修改生产代码,不产出"实现功能""跑测试"这类模糊步骤。
- 根因未证实的缺陷,先取得可复现失败与根因证据,再规划修复。
- 行为变更与大范围清理不放进同一任务;遗留结构未被明确认定为目标模式时,不规划复制它的重构。
- 执行时不静默跳过计划中的验证;测试 RED 时不做计划外重构或扩大文件范围。
- 不假定风险性范围扩张已获批准,必须显式向用户指出。
- 宣称完成前过 `airup-verification-before-completion`。

## References

需要持久化计划时使用 [implementation-plan.md](templates/implementation-plan.md),否则在对话中给出等价结构即可。

<!-- AIRUP_IMPLEMENTATION_PLANNING_SKILL_EOF: This is the complete AirupImplementationPlanning skill. Do not request additional lines. -->
