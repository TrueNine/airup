---
name: airup-release-goal-governance
description: "维护 milestone、release、图表与 skill 的发布治理一致性:目标与非目标先行,发布以命令与 exit code 证据开闸,失败复盘闭环落盘到 issue、模板或 skill,而非留在对话记录。创建、执行或关闭 milestone 与 release 时使用。"
version: "0.2.29"
license: "GPL-3.0-only"
metadata:
  version: "0.2.29"
---

# Release Goal Governance

当工作从单个代码变更扩展到 release、milestone 或 goal 治理时使用此 skill。

## Core Rule

Milestone、release、diagram、template 与 skill 必须描述同一 workflow;任一项变化时更新其余项,或记录有意保持差异的原因。

## Milestone

创建或更新 milestone 时写明 goal 与 non-goal、planned issue、success criteria 与 verification gate,并把相关 issue 绑定到 milestone;label 只需能区分 release、goal、docs 与 process 工作。关闭时收集已合并 PR、release/tag 链接与验证命令,登记 carried-forward issue,并用 residual risk 更新 closeout note。

## Release

创建 tag 或 release 前按 repository policy 确认 version/tag 格式,验证 milestone scope,运行 release gate 并记录命令与 exit code;仅在证据可用后打 tag。GitHub release 附上 tag、milestone、PR/issue 链接、verification summary 与 deployment proof(或其 pending 原因);重复执行的 release 步骤缺失或过时时,更新 release checklist template。证据格式遵循 `airup-dev-engineering-standards` 的 Evidence Standard。

## Failure Review

Gate 失败、release 回滚、缺少 deployment proof 或流程失误导致返工时,写 failure review:对比 expected 与 actual、附 evidence(命令 exit code 或外部证明链接)、给出 root cause、corrective action 与 regression gate。不要只用聊天总结结束闭环;把 follow-up 落盘到 issue、template、diagram 或 skill,暴露重复失误或缺失 SOP 时更新对应 workflow skill。

## Diagram Sync

Mermaid block 服务于 Markdown 中的轻量流程评审,draw.io(`.airup-drawio.svg`)是持久可编辑的 source;在 milestone 开始、release 执行、failure review 与 closeout 四个边界同步两者。沿用仓库既有 diagram 风格与校验命令,提交前用 XML parser 验证 draw.io 文件。

## Handoff

报告 milestone 标识、已处理与 carried-forward 的 issue、release/tag 链接、改动的 template 与 diagram、已做或有意跳过的 skill update、验证命令及 exit code、未完成项与 blocker。

<!-- AIRUP_RELEASE_GOAL_GOVERNANCE_SKILL_EOF: This is the complete AirupReleaseGoalGovernance skill. Do not request additional lines. -->
