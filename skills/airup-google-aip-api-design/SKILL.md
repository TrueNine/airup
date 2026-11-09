---
name: airup-google-aip-api-design
description: "按 Google AIP 设计或评审资源导向 API:先抓取官方当前页面再引用规则,强制检查 AIP-185 版本前缀,输出资源模型、方法表与验证计划;protobuf 配套 api-linter。"
version: "0.2.29"
license: "GPL-3.0-only"
metadata:
  version: "0.2.29"
---

# Google AIP API Design

设计或评审资源导向 HTTP、gRPC/transcoding、protobuf 或 OpenAPI API 时使用此 skill。核心纪律:绝不凭记忆应用 AIP 规则,引用任何规则前先抓取其当前官方页面。

## Workflow

1. 识别 API surface:HTTP JSON、gRPC、带 HTTP transcoding 的 protobuf、OpenAPI 或混合设计。
2. 按 [aip-map.md](references/aip-map.md) 选出可能相关的 AIP,逐个抓取 `https://google.aip.dev/{number}` 官方当前页面后再应用。
3. 对 REST/HTTP URI 先核验 AIP-185 版本前缀,再判定 path 可接受性。
4. protobuf API 编写 `.proto` 后运行 `api-linter`(如 `api-linter path/to/api.proto`),把输出当 guardrail 而非完整评审。

## Rules

- 常用官方入口:`https://google.aip.dev/`、`https://google.aip.dev/{number}`、`https://linter.aip.dev/`、`https://github.com/googleapis/api-linter`。
- REST/HTTP URI 强制 AIP-185:stable path 需 `/v1/...` 式 major 前缀,`/v1.0/...` 等 minor/patch 前缀属设计问题,alpha/beta 遵循 AIP-185 suffix 指南(如 `/v1beta/...`)。
- framework、gateway、router 配置可能全局注入 version prefix 时,先查证该配置再判定各 route;无已验证注入时,缺失 major 前缀按设计 finding 报告,而非可选建议。
- 优先 resource 建模(resource name、collection、父子关系),standard method 优先于 custom method;显式定义 pagination、filtering、ordering、field mask、error、幂等、partial update 与 long-running operation。
- 所有 AIP 引用必须带 URL,不用模糊引用;REST 设计需核对规则是否含 protobuf-only 假设。

## Design Output

设计新 API 时产出:资源模型(含 resource name 与父子关系);method/path/RPC 表(用 TOON 表,含 AIP-185 状态、request、response 与相关 AIP URL);请求响应形状、必填字段与幂等行为;适用的分页、过滤、排序、field mask、错误、权限与 LRO 说明;验证计划(protobuf 含 `api-linter`)。方法表示例:

```
methods[2]{method,path,aip185,request,response,ref}:
  GET,/v1/users/me,ok,User,User,"https://google.aip.dev/131"
  POST,"/v1/users/me:deactivate",ok,DeactivateRequest,User,"https://google.aip.dev/136"
```

## Review Output

评审现有 API 时逐条列出 finding:受影响的 endpoint/RPC/schema、被违反的 AIP URL、风险原因与具体改法;证据遵循 `airup-dev-engineering-standards` 的 Evidence Standard。每份评审必须包含 AIP-185 version-prefix finding 或明确的"已检查且可接受"结论;无已验证的全局 prefix 注入时,`GET /users/me` 应报告缺失并改为 `GET /v1/users/me`。无实质问题时明确说明,并列出 residual risk 与未检查的规则。

## References

- 按 task 选择需查阅的 AIP 规则:[aip-map.md](references/aip-map.md)。
- 维护源 repository 为 `https://github.com/TrueNine/airup`;运行时以当前 target project 及已安装 plugin resources 为准。

<!-- AIRUP_GOOGLE_AIP_API_DESIGN_SKILL_EOF: This is the complete AirupGoogleAipApiDesign skill. Do not request additional lines. -->
