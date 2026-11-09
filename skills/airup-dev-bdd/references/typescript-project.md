# TypeScript Project Structures

文件布局先服从目标项目已有的模块边界、测试发现规则和构建命令;不要因为引入 BDD 就移动已有测试,也不强制创建全部五类文件。

## Layouts

- 模块同目录:`order.ts`、`order.test.ts`、`order.feature`、`order.steps.ts`、`order.feature.test.ts` 同放一个目录,从行为模块直达契约与测试。
- 分离目录:`src/` 放实现与单元测试,`features/` 放 `.feature` 与 steps,`test/` 放 feature 入口;适合项目已有 `features/`、`test/` 约定,基础名一致但非强制。
- 单一入口编排:只保留一套测试入口同时跑单元与 feature test,入口名称遵循项目约定(不必叫 `*.feature.test.ts`),在测试配置中记录 feature、steps 与入口的对应关系。

## Runner Variants

```text
runner[N]{runner,entry}:
  bun-test,bun test
  vitest,vitest run
  cucumber,由 bun-test 或 vitest 承载
```

- Cucumber 执行入口可由 Bun Test、Vitest 或项目已有的 Cucumber 启动方式承载;同时支持多个 runner 时,明确每个文件由谁收集,避免重复执行。
- Vitest 默认可能收集 `*.feature.test.ts`:按项目实际入口选择排除该文件,或让它使用项目已有的 Vitest wrapper。

## Selection

- 先检查 `package.json`、vitest/Bun/Cucumber 配置和 CI 命令,再定布局。
- 没有 Gherkin 契约时,只有实现与单元测试也能满足模块测试需求;有契约时,重点是 feature、steps、执行入口与 `@req-` 标签之间可追踪,而不是文件路径本身。
