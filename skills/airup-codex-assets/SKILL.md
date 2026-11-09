---
name: airup-codex-assets
description: "内部 skill:在其余 hook 运行前,把 Airup 托管的 Codex hook runtime 资产引导到已安装的插件镜像,并提供显式信任 hook 的命令。"
version: "0.2.43"
license: "GPL-3.0-only"
metadata:
  version: "0.2.43"
---

# Airup Codex Asset Bootstrap

此内部 skill 携带 Airup 托管的 Codex runtime 资产引导脚本及预期哈希值,不面向任务工作流。

SessionStart hook 会先于 runtime hook 脚本运行 `scripts/airup-codex-assets.ts hydrate`:校验托管资产的哈希值,已安装的插件镜像缺失资产时从匹配的 GitHub tag 下载对应版本文件。

另一个 SessionStart hook 会运行 `scripts/airup-codex-assets.ts sync-project-gitignore`,把 `assets/.gitignore` 中 Airup 托管区块同步到 payload `cwd` 下的 `.airup/.gitignore`:保留区块之外的项目自定义规则,内容一致时不写入;标记缺失、逆序或重复时保持 fail-open,仅输出警告且不修改目标文件。

## Explicit Hook Trust

仅当用户明确要求信任 Airup hooks 时运行:

```bash
bun "<PLUGIN_ROOT>/skills/airup-codex-assets/scripts/trust-codex-hooks.ts"
```

`<PLUGIN_ROOT>` 替换为本 skill 所属的已安装插件根目录。该命令读取插件 manifest 声明的 hook 文件,复算受支持 command hooks 的 Codex 信任指纹,把缺失或过期的 `trusted_hash` 原子写入 `~/.codex/config.toml`;已匹配的 hook 保持不变,全部匹配时不写配置。

不要从 `SessionStart` hydration 或其他隐式路径运行此命令:用户主动调用才是允许脚本跳过 Codex 交互式 hook 审核的授权边界。

<!-- AIRUP_CODEX_ASSETS_SKILL_EOF: This is the complete AirupCodexAssets skill. Do not request additional lines. -->
