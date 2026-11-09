# API Surface Mapping

## Mapping Invariant

授权语义属于 permission catalog,不属于 transport:REST、GraphQL 与 gRPC 暴露同一 resource 上的同一 action 时,必须引用同一个 permission identifier;绝不在运行时仅依据 HTTP verb、resolver name、RPC name、URL fragment 或 protobuf package 推导授权,维护显式、可评审且 fail closed 的 operation-to-permission mapping。

## Resource-First Design

按当前 AIP-121(资源设计)、AIP-122(resource name)、AIP-127(HTTP transcoding)指南识别 resource 与 standard method,再按稳定的 service、resource type 与 authorization action 命名 permission,并把每个 transport operation 映射到它;更广的 API 设计与 resource 命名遵循 `airup-google-aip-api-design`。

## Mapping Rules

- REST:standard method 映射到 `get`/`list`/`create`/`update`/`delete`,不把 HTTP path 与 API version 放入 identifier;授权前从已校验的 path 或 request data 提取 canonical resource scope;batch operation 记录是应用单个 collection permission 还是 per-resource check,不假设 wildcard 语义。
- GraphQL:显式映射受保护的 query/mutation resolver,verb 取底层 resource action 而非 `query`/`mutation`/field/schema 名;防 alias、fragment、batching 与 nested resolver 绕过检查;在识别 canonical resource 之后、返回受保护数据之前应用授权。
- gRPC/protobuf:在 service configuration 或 interceptor metadata 中把 fully qualified RPC 映射到 catalog permission;native 与 HTTP-transcoded call 用同一 mapping,resource name 取自 request contract 定义的 field,不放入 protobuf package 或 transport annotation。
- Custom action 仅在非 standard method 时使用 domain verb(如 `archive`、`cancel`、`actAs`),并在所有 protocol representation 复用同一 verb;不存在 `rest.books.archive`、`graphql.books.archive`、`library.books.archiveV1` 这类 variant,只有 `library.books.archive`。

## Cross-Protocol Example

| Surface | Operation | Permission | Resource extraction |
| --- | --- | --- | --- |
| REST | `GET /v1/publishers/{publisher}/books/{book}` | `library.books.get` | path resource name |
| GraphQL | `Query.book(id)` | `library.books.get` | resolver 加载的 book name |
| gRPC | `LibraryService.GetBook` | `library.books.get` | `GetBookRequest.name` |

transport 可以变化,permission 不变。

## Deny And Review

- 返回目标平台的 permission-denied response,不泄露不可访问的 resource detail;metadata 缺失或 extraction failure 必须导致拒绝访问。
- 审查时枚举每个受保护 route/resolver/RPC/transcoding rule,解析为 canonical resource 与 action,确认 identifier 通过随附 validator;检测无 mapping、多冲突名称、alias 或 protocol-specific name 的 operation,比较跨 protocol 的等价 action 并要求使用同一 permission。
