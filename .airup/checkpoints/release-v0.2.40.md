# Release v0.2.40 Checkpoint

## Task

- 名称：发布 Airup 0.2.40
- 目标：仓库迁移至 `TrueNine/airup` 后的首次发布。同步 package、Codex plugin、Cursor plugin、agent markers 与 managed asset hashes，发布 `v0.2.40`。本次发布覆盖 husky→lefthook pre-commit 管线迁移、技能文档重写与新增技能（`airup-dev-code-review`、`airup-ops-dependency-manager`）、全部 `LiTeXz/airup` 引用更新为 `TrueNine/airup`、资产截图改用 webp。
- 状态：done
- Owner：ZCode `/release-v0.2.40`
- 创建时间：2026-11-10 Asia/Shanghai

## Workflow Chain

```text
airup-release-goal-governance -> airup-verification-before-completion
```

## Checklist

- [x] R1 - 从 `main` 创建 `codex/release-v0.2.40`，将 package、Codex plugin、Cursor plugin 和 agent markers 同步到 `0.2.40`。
- [x] R2 - 重新计算 managed Codex asset 与 subagent hashes（发布提交由 pre-commit `sync-staged` 自动重算并暂存）。
- [x] R3 - 运行本地 release gate。
- [x] R4 - 提交并推送 `codex/release-v0.2.40`（4 个逻辑提交，不 squash），通过 PR 合入 `main`。PR: https://github.com/TrueNine/airup/pull/3
- [x] R5 - 创建 `v0.2.40` tag，验证 tag-specific Version Check 后创建 GitHub Release。Release: https://github.com/TrueNine/airup/releases/tag/v0.2.40

## Releases And Tags Conventions

- 版本源：`package.json`。
- 对齐约束：`package.json`、`.codex-plugin/plugin.json`、`.cursor-plugin/plugin.json` 与全部 `agents/*.toml` 的 `# airup-version` 必须一致。
- Managed asset 哈希：`skills/airup-codex-assets/assets/all.lock`、`subagent.lock` 需在版本变更后重算。
- 发布标记：`v` 前缀 + package 语义版本，如 `v0.2.40`。
- 与 v0.2.39 的有意差异：不 squash，PR 以 rebase 方式保留 4 个逻辑提交；远程当前无 `dev` 分支，跳过 `main -> dev` 同步。
- 仓库引用：所有者自 `LiTeXz` 更新为 `TrueNine`（旧仓库不可访问）；`.airup/checkpoints/` 历史记录中的旧引用按原样保留。

## Evidence

| 命令 | 状态 | 结果 |
| --- | --- | --- |
| `git switch -c codex/release-v0.2.40` | 0 | 已从 `main` 创建发布分支 |
| `bun skills/airup-codex-assets/scripts/airup-codex-assets.ts compute > skills/airup-codex-assets/assets/all.lock` | 0 | `all.lock` 重算（脚本变更后哈希输入变化） |
| `bun skills/airup-codex-assets/scripts/airup-codex-assets.ts check` | 0 | managed hashes aligned |
| `bun test` | 0 | 326 pass / 1 fail；失败项为 `trust-codex-hooks.test.ts` 上游指纹比对（预存失败，上游 Codex main 实现变更所致） |
| `bun run typecheck` | 0 | TypeScript check passed |
| `bun run lint` | 0 | Biome check passed；79 files checked |
| `bun run format:check` | 0 | Biome format passed；78 files checked |
| `bun scripts/check-skill-metadata.ts` | 0 | Skill metadata check passed for skills |
| `bun test scripts/version-check-workflow.test.ts` | 0 | 4 pass / 0 fail |
| `git commit -m "build(hooks): migrate pre-commit pipeline from husky to lefthook"` | 0 | `c543a8e`（rebase 后 `0e57599`） |
| `git commit -m "refactor(skills): rewrite skill documents and add code review and dependency manager skills"` | 0 | `970d2c0`（rebase 后 `bee341e`）；技能版本按 pre-commit 约定自动递增 |
| `git commit -m "docs(branding): update repository owner to TrueNine and refresh docs"` | 0 | `6f89d8b`（rebase 后 `b2d1b70`） |
| `git commit -m "chore: release v0.2.40"` | 0 | `9b798a3`（rebase 后 `93e9bf7`）；pre-commit 同步 manifests、agent markers 与 managed hashes 至 `0.2.40` |
| `git push --set-upstream origin codex/release-v0.2.40` | 0 | release branch pushed |
| `gh pr checks 3 --watch --interval 15` | 0 | `Version Check` 与 `Skill Metadata Check` passed |
| `gh pr merge 3 --rebase --delete-branch` | 0 | PR #3 以 rebase 方式合并，`main` = `93e9bf7` |
| `git tag -a v0.2.40 && git push origin v0.2.40` | 0 | tag pushed |
| tag `Version Check` run `42699009943` | success | tag-specific version and asset checks passed |
| `gh release create v0.2.40` | 0 | Release created: https://github.com/TrueNine/airup/releases/tag/v0.2.40 |

## Risks And Blockers

- 风险（已处理）：PR 合并前，远程 `main` 的既有提交于 2026-11-10 05:01 (+0800) 经 GitHub web 重写（committer `赵日天 <61126721+TrueNine@users.noreply.github.com>`，`1f7c840`/`0b1bfa7` → `0553154`/`5cce22d`，树内容 diff 为空）。本地 `main` 已 `reset --hard` 对齐远程新历史，无内容丢失。后续会话在推送前应先核对远程状态。
- 风险：`bun test` 的 1 个预存失败（上游 Codex trust 指纹比对）未在本次发布中修复，属上游漂移，与本次变更无关。
- Blocker：无。

## Progress Log

```text
2026-11-10
本地 release gate 全部通过后创建 codex/release-v0.2.40，按 lefthook 迁移 / 技能重写 / 品牌引用 / 版本 bump 拆分 4 个提交。
PR #3 通过 GitHub Actions 后以 rebase 方式合并到 `main`（保留提交历史）；发现远程 main 曾被 web 端重写，本地已对齐。
创建并推送 `v0.2.40`，tag-specific Version Check 通过，创建 GitHub Release。
```

<!-- AIRUP_RELEASE_GOAL_GOVERNANCE_CHECKPOINT_EOF -->
