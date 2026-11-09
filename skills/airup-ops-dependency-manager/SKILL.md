---
name: airup-ops-dependency-manager
description: "审计并安全清理 JavaScript、Gradle、Maven 与 GitHub 依赖:识别无效、传递、重复、作用域错误、漂移或滥用的声明,并审查 Dependabot 配置;在仓库新增、升级、删除或审计依赖,以及检查依赖卫生时使用。"
version: "0.2.31"
license: "GPL-3.0-only"
metadata:
  version: "0.2.31"
---

# Ops Dependency Manager

在仓库新增、删除、升级或审计依赖,以及检查依赖卫生时使用此 skill。它组合 Knip、Gradle/Maven 依赖分析与 GitHub 配置检查,基于证据给出清理方案,不猜测架构意图。

## Workflow

1. 扫描前确认仓库边界:包管理器与 lockfile、Gradle/Maven 模块、source sets、生成代码、CI 文件与既有依赖政策;将每项发现归类为直接或传递、runtime 或 development、production 或 test、optional/peer/workspace 或平台专用。
2. 以 scan 模式运行匹配生态的 checker,优先使用仓库 wrapper(`pnpm`、`bun`、`gradlew.bat`、`mvnw.cmd`)与既有验证 task;同时区分确定发现与建议:生成代码、反射、插件、注解处理、service loading 或平台打包可能在无文本 import 时使用依赖,此时不得删除,而未声明的传递路径属于边界违规,不能作为新增便利依赖的理由。
3. 只有得到用户明确授权才使用 `--fix`:编辑前记录 diff 并创建临时备份,编辑后运行最小且有意义的 build/test/lockfile 验证,验证失败时恢复备份。
4. 记录新依赖理由:用途、拒绝的替代方案、scope 与 license/安全影响,需要列表时用 TOON。行为变更搭配 `airup-dev-tdd`,最终验证遵循 `airup-verification-before-completion`。

## Script Contract

每个 checker 接受 `--path`、`--fix`、`--dry-run` 与 `--format text|json|toon`,findings 字段为 `ecosystem`、`file`、`dependency`、`type`、`evidence`、`risk`、`action`、`autoFixable`;exit code `0` 表示无阻断发现,`1` 表示存在阻断发现,`2` 表示所需工具或构建入口不可用,`3` 表示 fix 或验证出错。`--format toon` 按下例输出:

```toon
findings[1]{ecosystem,file,dependency,type,evidence,risk,action,autoFixable}:
  javascript,package.json,left-pad,unused-direct,"evidence text, with comma",blocking,confirm with Knip first,true
```

### JavaScript

运行 `bun <SKILL_INSTALL_ROOT>/scripts/check-js-dependencies.ts --path .`,按 lockfile 检测 npm/pnpm/Bun,并在可用时调用 Knip;`--fix` 仅限 Knip 确认的直接 unused/unlisted 依赖,保留 peer、optional、workspace 与 runtime entry 声明。

### Gradle and Maven

在仓库根目录运行匹配 checker,检查依赖树、`dependencyInsight` 或 `dependency:analyze`、直接声明、source sets、profiles 与多模块边界;仅当候选明确、存在本地声明且编辑后验证成功才允许 JVM `--fix`,否则输出 patch 建议。

### GitHub

运行 `bun <SKILL_INSTALL_ROOT>/scripts/check-github-dependencies.ts --path .`,检查 Dependabot、Actions、容器镜像与固定工具版本;更新政策见 [dependabot-policy.md](references/dependabot-policy.md),不要虚构 labels、assignees 或 ignore rules。

## References

选择生态工具时加载 [dependency-tool-matrix.md](references/dependency-tool-matrix.md),审查架构或新依赖时加载 [dependency-policy.md](references/dependency-policy.md);只有调整命令与可用生态后,才能将 [dependency-governance.yml](assets/dependency-governance.yml) 复制到宿主 repository。

<!-- AIRUP_OPS_DEPENDENCY_MANAGER_SKILL_EOF: This is the complete AirupOpsDependencyManager skill. Do not request additional lines. -->
