---
name: airup-iam-access-control-design
description: "设计或审计 IAM 式访问控制:`service.resource.verb` 权限目录、角色与绑定模型、REST/GraphQL/gRPC 映射与 fail-closed 迁移;配套行级验证脚本检查权限与角色标识符合法性。"
version: "0.2.31"
license: "GPL-3.0-only"
metadata:
  version: "0.2.31"
---

# IAM Access Control Design

为 REST、GraphQL、gRPC 等所有 API surface 设计或审计一套统一的 Google Cloud IAM 式授权词汇。permission 描述动作而非分配,role 是权限集合,attribute 通过 binding 上的 CEL 细化——保持这些分离,目录便能随 role 演进而不漂移成 `admin:user:read` 式的多套命名;因此本模型禁止 alias、wildcard 与旧式冒号语法,并在授权边界 fail closed。

## Core Rules

1. permission 一律命名为 `service.resource.verb`,role 一律命名为 `roles/service.role`;恰好三个 segment,不得混入 tenant、environment、region、protocol、API version 或 role segment。
2. 将 role 绑定到 principal;绝不直接授予独立 permission,role 名也不得出现在 permission 中。
3. resource scope 与 ABAC attribute 保持在 identifier 之外,CEL condition 只出现在 binding 上。
4. REST operation、GraphQL resolver 与 gRPC RPC 映射到同一个 permission catalog,不得按 transport 建 namespace。
5. permission 缺失、格式错误、未映射或采用旧格式(冒号分隔、wildcard、alias、dual-read)时一律拒绝访问。

## Workflow

1. 盘点 resource 与 operation,选择由授权目录拥有的稳定 service namespace,与 transport、租户、region 和环境无关。
2. 创建原子 permission 并组成 least-privilege role,在实际可行的最窄 scope 上绑定 principal,必要时为 binding 添加 CEL condition。
3. 将每个受保护 API operation 显式映射到 catalog permission;发现旧式 identifier 时提出唯一 canonical replacement 并要求全部 producer/consumer 切换,不做静默转换,也不虚构 fallback DSL 或 permission 语法。
4. 用随附脚本验证 permission 与 role identifier,非零 exit code 视为阻断项。

## Source Discipline

声称某条规则来自 Google Cloud IAM 或 AIP 前,先读取 6 个官方来源的当前页面(清单见 [authorization-model.md](references/authorization-model.md))。segment casing、role 语法、CEL 用法、迁移行为与跨协议映射属于本 skill 的 project policy,不得表述为 Google 的要求。

## Required Design Output

1. 权限目录:identifier、resource、action 语义与受保护 operation。
2. 角色目录:role identifier、用途与精确 permission 集合。
3. 绑定模型:principal、role、resource scope 与可选 CEL condition。
4. API 映射表:protocol operation、permission、resource extraction 与 deny 行为。
5. 合规发现:旧式名称、alias、wildcard、condition 泄漏与缺失映射。
6. 验证证据:按 `airup-dev-engineering-standards` 的 Evidence Standard 记录命令、exit code 与结论。

## Validation

identifier 存放在 line-oriented catalog 文件中,`#` 开头的行被忽略:

```bash
bun "<SKILL_INSTALL_ROOT>/scripts/validate-authorization-identifiers.ts" --kind permission --input permissions.txt
bun "<SKILL_INSTALL_ROOT>/scripts/validate-authorization-identifiers.ts" --kind role --input roles.txt
```

identifier 语法、binding 示例与迁移/fail-closed 细则见 [authorization-model.md](references/authorization-model.md);REST、GraphQL、gRPC 映射规则见 [api-surface-mapping.md](references/api-surface-mapping.md)。

<!-- AIRUP_IAM_ACCESS_CONTROL_DESIGN_SKILL_EOF: This is the complete AirupIamAccessControlDesign skill. Do not request additional lines. -->
