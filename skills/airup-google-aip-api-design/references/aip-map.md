# AIP Selection Map

按主题选 AIP 号,再抓取 `https://google.aip.dev/{number}` 的官方当前页面;本文件只是选号索引,不是官方页面的替代品。

## Topics

- 总体设计:resource-oriented AIP-121;resource name AIP-122;resource type AIP-123;resource 关联 AIP-124。
- Standard methods:Get AIP-131、List AIP-132、Create AIP-133、Update AIP-134、Delete AIP-135;operation 非 CRUD 才用 custom method AIP-136。
- HTTP 与版本:HTTP/transcoding AIP-127;REST 版本前缀 AIP-185(强制项,详见 SKILL.md);LRO AIP-151。
- 查询行为:分页 AIP-158;过滤 AIP-160;field mask AIP-161;partial update AIP-157;ordering 见 AIP-132 与当前 AIP index。
- 一致性与错误:declarative-friendly AIP-128、AIP-148;错误 AIP-193;幂等与 request id 见各 method AIP 与当前 AIP index。
- protobuf schema:field behavior AIP-203;resource 注解 AIP-123、AIP-127;文档 AIP-192;field 指南 AIP-140+;兼容性规则查当前 AIP index。

## Review Checklist

1. 核心概念是否为带稳定 resource name 的 resource?
2. method 是否先考虑 standard method,而非 custom method?
3. REST path 是否通过 AIP-185 版本前缀核验,或已验证存在全局注入?
4. HTTP method 与 path 是否匹配 resource 与 operation?
5. request 与 response 命名是否可预测?
6. 分页、过滤、排序与 field mask 是否只在有用处出现且 shape 一致?
7. mutation 是否明确幂等、校验、partial update 与错误行为?
8. long-running operation 是否用预期的 operation shape 表示?
9. 错误是否映射到标准 status code 与结构化 detail?
10. protobuf 是否通过 `api-linter`,suppression 是否有充分理由?
