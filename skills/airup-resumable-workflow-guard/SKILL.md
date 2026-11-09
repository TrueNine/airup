---
name: airup-resumable-workflow-guard
description: "让长任务、多阶段或跨会话工作可恢复:在 `.airup/checkpoints/<task-slug>.md` 维护轻量检查点,计划变化、高风险操作与暂停前更新,结束后留下续作交接,避免重做或丢失进度。"
version: "0.2.30"
license: "GPL-3.0-only"
metadata:
  version: "0.2.30"
---

# Resumable Workflow Guard

长任务、多阶段或跨会话的工程工作使用本 skill 保持可恢复:开始前先找已有 checkpoint,执行中按节奏更新,中断后据此续跑,结束时留下交接。它只负责可恢复性,不替代规划、TDD、调试或验证类 skill。

## Checkpoint Format

每个任务一个 checkpoint,存放在 `.airup/checkpoints/<task-slug>.md`;用户指定了位置或已有 plan/spec 产物时,放在其旁并链接。文件 = TOON 头块 + 简短正文:

```text
checkpoint{task,status,phase,next,done,total}:
  migrate-auth,active,execute,run bun test auth,7,9
```

头块之后只写两段短文:第一段记录当前进展与已完成内容,第二段记录风险与阻塞;不再维护更长的分节模板。

## Lifecycle

- 任务开始先查对应 checkpoint,存在则与 `git status` 核对后从下一步继续,不重做。
- 计划变化、高风险操作前后、每完成一项、暂停或交接前更新 checkpoint。
- checkpoint 与仓库状态矛盾时,先与 `git status` 对账;无法安全推断时标记 `blocked`,只向用户请求必需的决策。
- 任务完成后标记 `completed`,并保留最终验证证据。

## Handoff

以未完成任务结束 turn 前,在 checkpoint 中写明:从哪里继续、下一步是什么、不要重做什么、剩余风险。

## Rules

- 不信任过期的 checkpoint,与实际状态矛盾时以仓库为准。
- 不擅自创建 `.airup/` 目录;项目未启用时改用用户指定的位置。
- 并行子任务各有自己的 checkpoint,不共享文件。
- 一次性小任务不建 checkpoint,除非用户要求。

## References

- TOON 书写规则见 `airup-dev-engineering-standards` 的 Structured Data Format。
- 任务规划产物见 `airup-implementation-planning`。

<!-- AIRUP_RESUMABLE_WORKFLOW_GUARD_SKILL_EOF: This is the complete AirupResumableWorkflowGuard skill. Do not request additional lines. -->
