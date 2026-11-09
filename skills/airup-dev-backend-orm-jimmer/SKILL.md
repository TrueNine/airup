---
name: airup-dev-backend-orm-jimmer
description: "Jimmer ORM 后端实现纪律:修改 Jimmer 实体、DSL 查询、fetcher、保存语义或 Spring Boot 集成时使用;覆盖注解处理器生成源码的刷新与编译验证、DSL 与 fetcher 的最小测试要求,以及 Spring Web 边界职责护栏(可选配套 airup-dev-tdd 的栈专用扩展)。"
version: "0.2.30"
license: "GPL-3.0-only"
metadata:
  version: "0.2.30"
---

# Dev Backend ORM Jimmer

将 Jimmer 视为围绕不可变实体、编译期生成代码、类型安全 SQL DSL、DTO language、graph query 与 graph save 构建的 JVM ORM,而不是使用可变 POJO、`EntityManager`、lazy proxy 与 JPA cascade 规则的 JPA 实现。本 skill 是 `airup-dev-tdd` 在 Jimmer 技术栈上的可选扩展,适用于 Java、Kotlin 与混合 source set。

## Workflow

1. 检查构建配置:Jimmer 版本、APT/KSP wiring、生成源码布局与 Spring Boot 集成方式;沿用既有版本与目录,任务未要求时不升级。
2. 搜索现有实体、DTO、repository、SQL client、fetcher 与测试,沿用本地命名、分层与生成类型用法;混合 project 逐个 source set 判断,按目标语言读 [java.md](references/java.md) 或 [kotlin.md](references/kotlin.md)。
3. 实体、DTO、table object/class 或 fetcher 变更后,运行能触发对应 APT/KSP 处理器的最小编译任务,确认生成源码已刷新。
4. 用最小行为测试覆盖 DSL 查询、fetcher、事务与保存语义;repository 或 SQL client 测试断言调用方可观察的结果(graph shape、总数、ordering、association)。
5. 修改 Controller/Service 前后核对 Web 边界职责(见 Web Boundary Guardrails)。
6. 完成前在已修改源码中检查意外引入的 `EntityManager`、可变实体 setter、错误 source set 的 DSL 或不符合本地约定的 `jakarta.persistence` 用法。

## Web Boundary Guardrails

- Controller 只做 HTTP 适配(mapping、binding、validation、status、header、multipart、流式响应、security entry point),不做业务规则与持久化编排;业务流、批量与导入导出策略留在 service 层。
- 导入导出与下载的文件名、content type、`Content-Disposition`、HTTP status 与 servlet streaming 留在 Web 层,并用 API 边界测试(`MockMvc`、`WebTestClient` 或等效)覆盖;直接调用 `controller.method(...)` 只能作为补充,不能替代 endpoint 覆盖。
- 完成前在改动的 service 中扫描 `org.springframework.http`、`ResponseEntity`、`jakarta.servlet` 等 Web 类型泄漏;既有泄漏不扩大,新逻辑返回应用层结果由 controller 转换为 HTTP response。缺少边界测试时,在最终报告中说明现有覆盖为何足够。

## References

- [java.md](references/java.md):Java source set 的构建接线、DSL 查询、graph save 与测试。
- [kotlin.md](references/kotlin.md):Kotlin source set 的 KSP 接线、DSL 查询、graph save 与测试。

<!-- AIRUP_DEV_BACKEND_ORM_JIMMER_SKILL_EOF: This is the complete AirupDevBackendOrmJimmer skill. Do not request additional lines. -->
