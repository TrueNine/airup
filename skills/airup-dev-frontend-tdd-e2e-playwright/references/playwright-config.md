# Playwright Configuration

目标项目的 `playwright.config.ts` 使用以下固定契约,不得在 spec、临时 config 或命令行覆盖:

```ts
defineConfig({
  maxFailures: 1,
  retries: 0,
  globalSetup: './e2e/global-setup.ts',
  testDir: '.',
})
```

- `maxFailures: 1`:首个失败后停止;调试时先缩小到目标 spec。
- `retries: 0`:失败不自动重试,不要使用只在 retry 时生成证据的 `on-first-retry`。
- `globalSetup` 指向 `./e2e/global-setup.ts`:它是全局初始化与 backend server 启动的唯一入口,fixture 与测试只复用。
- `testDir: '.'`:测试发现范围由仓库根目录约定决定;新增 spec 遵循 SKILL.md 的放置与命名规则。

## Failure Evidence

没有自动 retry,失败须显式保留证据:调试时用 `bunx playwright test path/to/spec --trace=on --workers=1`,或在配置中设 `trace: 'retain-on-failure'`。

backend server 日志固定写入 `playwright-report/backend.log`(仅由 `globalSetup` 写入并逐次清空);测试失败先读日志末尾,确认根因后再查 trace。

## Full Suite Gate

package.json 的 `test:playwright` 是完整 Playwright 套件的正式入口,只有明确迭代单个页面/组件时才允许单 spec 命令获得局部反馈:

```bash
bun run test:playwright
```

交接时记录全量命令的 exit code 与首个失败摘要;单 spec、单 project 或手写 `bunx playwright test` 不能替代该 gate。
