# Java Reference

覆盖 Java source set 的构建/模型接线与查询/保存/测试;Kotlin source set 见 [kotlin.md](kotlin.md)。混合 project 逐个 source set 选择,不按项目主语言推断。

## Build And Model

- 使用 `airup-jimmer-sql` 与项目既有 Maven/Gradle annotation processor wiring,不引入 Kotlin KSP 配置。
- 修改依赖前先检查当前 Jimmer 版本、构建插件、APT 配置与生成源码目录;除非任务明确要求,不升级版本。
- 实体通常为不可变 interface;沿用项目声明风格,不引入可变无参实体类或基于 setter 的持久化流程。
- 保留 `@Entity`、`@Table`、`@Id`、`@GeneratedValue`、association、computed property 与 logical deletion 等 annotation 与语义。
- 编写 query 前先定位真实 generated table class 与命名方式,不猜测生成类型名;识别项目用 Spring Boot auto-configuration、Jimmer repository、直接注入 `JSqlClient` 还是自定义 persistence adapter。

## Query, Save And Testing

- 用 Java DSL 与 generated table class 表达 predicate、join、ordering、pagination 与 projection,不拼接 SQL 字符串;native expression 限制在局部并保留清晰类型边界。
- 用 fetcher 或 DTO projection 控制 graph shape;复杂 save 优先 input DTO,复杂 query response 优先 output DTO,业务校验保留在业务层。
- graph save 用 incomplete object graph 表达保存意图,由 Jimmer 处理 upsert 与 batch DML,不为少量字段更新预加载完整 graph。
- 修改实体或 DTO 后运行 compile/APT 任务确认生成代码已刷新,再跑针对性 Java/JVM persistence test,覆盖 filtering、ordering、pagination、association shape、graph save 与 constraint 行为。
