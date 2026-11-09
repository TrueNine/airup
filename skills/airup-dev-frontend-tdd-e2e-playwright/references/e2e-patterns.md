# E2E Patterns

仅在需要具体 Playwright 写法时加载;切片顺序与门禁以 SKILL.md 为准。

## Locator Priority

用 `data-testid` 锁定组件边界,再以 role/label 断言内部语义;标识应描述业务对象或状态(如 `profile-form`、`profile-error`),不用 CSS class、随机值或 DOM 深度,无可访问名称时优先修复可访问性。

```ts
const form = page.getByTestId('profile-form')
await form.getByRole('button', { name: 'Save' }).click()
await expect(page.getByTestId('profile-error')).toHaveText('Profile could not be saved')
```

## Isolated Data

每个测试在 fixture 中造数与清理,使用唯一标识,不依赖其他测试先创建数据;cleanup 失败时保留唯一标识与失败上下文,避免下次运行误读残留数据。

```ts
const project = await createProject({ name: `e2e-${test.info().parallelIndex}-${Date.now()}` })
await page.getByRole('searchbox', { name: 'Projects' }).fill(project.name)
await expect(page.getByRole('row', { name: project.name })).toBeVisible()
```

## Network Boundaries

只 mock 不属于本切片的外部边界,并断言请求契约:

```ts
const request = await page.waitForRequest('**/api/profile')
expect(request.method()).toBe('POST')
expect(request.postDataJSON()).toMatchObject({ displayName: 'Ada' })
```

不要 mock 本切片正在验证的后端契约,也不要用宽泛 `**/*` 拦截器掩盖真实请求错误。排查偶发失败时从 trace 的 action、locator、console、network 与 timing 判断根因,`waitForTimeout` 只用于一次性诊断,不得提交到生产测试;backend 日志与失败证据规则见 [playwright-config.md](playwright-config.md)。
