# Authorization Model

## Source Discipline

引用 Google Cloud IAM 或 AIP 规则前,先获取当前官方页面:

- `https://docs.cloud.google.com/iam/docs/roles-permissions`
- `https://docs.cloud.google.com/iam/docs/roles-overview`
- `https://docs.cloud.google.com/iam/docs/conditions-overview`
- `https://google.aip.dev/121`
- `https://google.aip.dev/122`
- `https://google.aip.dev/127`

## Vocabulary

- Permission:1 个 service 中 1 个 resource type 上的原子肯定动作;授权检查询问调用方是否拥有 permission,否定行为属于 deny policy 或 condition evaluation。
- Role:用于 RBAC assignment 的具名 permission 集合;role 绝不是 permission 的另一种拼写,role 名不得进入 permission。
- Principal 与 resource scope:principal 是已认证 identity 或 principal set,保存在 typed field 中;scope 是 binding 生效的 canonical resource name 或层级节点。
- Binding:principal 集合、role、resource scope 与可选 condition 之间的关联。
- Condition:细化 binding 生效条件的 CEL boolean expression。

## Identifier Grammar

```regex
permission  ^[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$
role        ^roles/[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$
```

- `service` 是稳定的小写 product/bounded-service namespace;`resource` 是 lowerCamelCase resource type(通常复数);`verb` 是 lowerCamelCase 动作,standard method 优先 `get`/`list`/`create`/`update`/`delete`,真正的 custom action 用精确 domain verb(如 `actAs`、`archive`)。
- `library:books:get`(旧式冒号)、`library.books.*`(wildcard)、`library.books.get.production`(泄漏 environment)、`rest.books.get`(transport namespace)、`library.book_records.get`(违反 lowerCamelCase)、`roles/library:viewer`(禁止的 delimiter)一律无效。
- 不要在 permission 中编码 row filter、ownership、tenancy、time window、network zone、resource tag 或 deployment environment;同一业务动作跨 transport 复用同一 permission。

## Bindings And Conditions

```yaml
binding:
  principals:
    - "principal://identity.example/users/alice"
  role: "roles/library.viewer"
  scope: "publishers/acme"
  condition:
    title: "business-hours"
    expression: "request.time.getHours() >= 8 && request.time.getHours() < 18"
```

- unconditional RBAC 省略 `condition`;ABAC 只通过 binding 上的 CEL 表达,不创建 conditional permission 或 role variant。
- expression 必须求值为 boolean,提供稳定 title 与对运维有用的 description,只用目标 policy engine 支持并记录的 attribute;evaluation error 或所需 attribute 不可用时视为拒绝。
- 在实际可行的最窄 scope 上授予最小 role;若目标无法执行 CEL,报告不兼容,不引入第二套 DSL 或静默转换 expression。

## Migration And Fail-Closed

1. 盘点 permission producer、catalog、policy store、middleware、annotation、测试与 API mapping;为每个旧式 identifier 分配一个 canonical replacement。
2. 在受控 migration boundary 内更新 producer 与 consumer,然后删除旧 identifier,并在 validation 与授权边界拒绝旧值;不支持 dual read/write、colon-to-dot 转换、case folding、wildcard expansion 或 best-effort matching。
3. permission 缺失、格式错误、未知、未映射或旧式时拒绝访问;记录 warning 后继续、猜测 permission 或 fallback 到宽泛 role 都会把命名漂移变成 authorization bypass。
