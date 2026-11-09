# Java And Kotlin Project Structures

布局先服从目标项目已有的模块、source set、测试框架和构建命令;不因 BDD 契约强制混用 Java 与 Kotlin,也不改动项目已有布局。

## Layouts

- 常规 source set:生产代码在 `src/main/java` 或 `src/main/kotlin`,steps 与 runner 在 `src/test/java` 或 `src/test/kotlin`,`.feature` 属于测试资源 `src/test/resources/features/`;同一模块不需要同时用两种语言。
- 按能力归组:steps、runner 与测试资源按领域 package 归组,如 `src/test/java/com/example/order/OrderSteps.java` 配 `src/test/resources/features/order/order.feature`。
- 独立验收模块:把验收测试拆为独立 source set 或模块(如 `order-acceptance/`),将快速单元测试与较慢的 Cucumber、integration 测试分开;需在构建配置中明确依赖、测试任务与报告边界。

## Runner Variants

- Java Cucumber 由 JUnit 4、JUnit Platform 或项目已有 runner 启动;Kotlin Cucumber 可由 JUnit 或 Kotest 承载。
- Maven Surefire、Failsafe、Gradle `test` 或独立 acceptance test task 都可能负责收集执行结果;不能仅凭 Java 或 Kotlin 推断 runner。

## Selection

- 先检查 `pom.xml`、Gradle build files、source set、JUnit/Cucumber/Kotest 配置和 CI 命令。
- 重点是 Feature、`@req-` 标签、step definitions、测试入口与构建任务之间可追踪,而不是目录名称;项目已有约定时只补缺失的契约、steps 或 runner 入口。
