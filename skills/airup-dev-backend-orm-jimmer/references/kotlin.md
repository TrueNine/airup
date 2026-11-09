# Kotlin Reference

覆盖 Kotlin source set 的构建/模型接线与查询/保存/测试;Java source set 见 [java.md](java.md)。混合 project 逐个 source set 选择,不按项目主语言推断。

## Build And Model

- 使用 `com.google.devtools.ksp`、`airup-jimmer-sql-kotlin` 与项目既有 KSP processor wiring,不改用 Java annotation processor。
- 修改依赖前先检查当前 Jimmer 版本、Kotlin plugin、KSP 配置与生成源码目录;除非任务明确要求,不升级版本。
- 实体通常为不可变 interface 或 abstract declaration;沿用项目声明风格,保留 `@Entity`、`@Table`、`@Id`、`@GeneratedValue`、association、computed property 与 logical deletion 等 annotation 与语义。
- 编写 query 前先定位真实 generated table object 与命名方式,不猜测生成类型名;识别项目用 Spring Boot auto-configuration、Jimmer repository、直接注入 `KSqlClient` 还是自定义 persistence adapter。

## Query, Save And Testing

- 用 Kotlin DSL 与 generated table object 表达 predicate、join、ordering、pagination 与 projection,不拼接 SQL 字符串;native expression 限制在局部并保留清晰类型边界。
- 用 fetcher 或 DTO projection 控制 graph shape;复杂 save 优先 input DTO,复杂 query response 优先 output DTO,业务校验保留在业务层。
- graph save 用 incomplete object graph 表达保存意图,由 Jimmer 处理 upsert 与 batch DML,不为少量字段更新预加载完整 graph。
- 修改实体或 DTO 后运行 compile/KSP 任务确认生成代码已刷新,再跑针对性 Kotlin/JVM persistence test,覆盖 filtering、ordering、pagination、association shape、graph save 与 constraint 行为。
