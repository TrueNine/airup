---
name: airup-verification-before-completion
description: "完成声明前的最后一道闸门:核对用户需求、变更范围、命令证据、跳过项与工作区状态,并在准备 commit/PR 时分离用户专属修改、组织分支收尾。未过清单不得宣称完成。"
version: "0.2.30"
license: "GPL-3.0-only"
metadata:
  version: "0.2.30"
---

# Verification Before Completion

在宣称开发、重构、修复、审查、文档或配置任务完成前使用本 skill:它是交付前的最后一道闸门,准备 commit 或 PR 时也从这里开始。本 skill 只做核验,不定义测试策略。

## Checklist

逐项回答,每项给出具体证据:

1. 最终结果是否满足用户的每一项要求?
2. 变更文件是否与任务意图一致,没有夹带无关修改?
3. 每条已执行的命令是否都有命令行与 exit code 证据?
4. 每个跳过的检查是否都有明确理由?
5. 工作区是否只包含本次任务相关的变更?
6. 要求 TDD 时,`airup-dev-tdd` 的检查点是否已到达 finish?
7. 存在 Gherkin `.feature` 时,是否完成 `airup-dev-bdd` 的场景验收追踪?
8. 工作区中用户专属的修改是否完好、未被还原?

## Branch Finish

- 用 `git status --short` 把工作区分为三类:本次任务变更、用户专属变更、不应提交的生成物。
- 只暂存任务变更,不提交用户未确认的文件;必要检查未通过时先回到 Checklist 补齐,不带病提交。
- PR 描述写清目的、关键变更、验证证据、风险与后续,不套固定模板,不编造证据。

## Report

最终报告遵循 `airup-dev-engineering-standards` 的 Evidence Standard:结论 + TOON 证据表 + 剩余风险。清单未全部通过前,不得宣称完成或使用同等表述。

## Rules

- 不隐瞒跳过的检查,也不暗示验证范围超出实际执行的范围。
- 缺少必要证据时不宣称完成、不提交,除非用户明确接受该风险。
- 不忽略工作区中的无关变更与用户专属变更,先分离再收尾。
- 不重写分支历史,除非用户明确要求。

## References

- 证据表与 TOON 格式见 `airup-dev-engineering-standards` 的 Evidence Standard。
- TDD 检查点协议见 `airup-dev-tdd`。
- 场景验收追踪见 `airup-dev-bdd`。

<!-- AIRUP_VERIFICATION_BEFORE_COMPLETION_SKILL_EOF: This is the complete AirupVerificationBeforeCompletion skill. Do not request additional lines. -->
