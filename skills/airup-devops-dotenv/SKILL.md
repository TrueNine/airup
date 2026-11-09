---
name: airup-devops-dotenv
description: "dotenv 环境变量全生命周期治理:分层与优先级、加载与校验、安全清单与各环境覆盖;新增、迁移或排查 .env、环境变量与 secret 配置时使用,在开发、测试、部署与运维间保持环境契约一致。"
version: "0.2.37"
license: "GPL-3.0-only"
metadata:
  version: "0.2.37"
---

# Dotenv Environment Management

管理环境变量从本地开发到测试、部署与运维的完整生命周期。dotenv 文件是配置输入与本地启动工具,不是生产 secret vault、数据库或业务数据存储;生产与 CI/CD 的真实 secret 优先走平台 secret store 或 pipeline 注入。

## Environment Layers

- 按项目约定分层:`.env.example`(提交的非敏感模板)、`.env.defaults`、`.env.local`、`.env.test`、`.env.production`,以及由 CI/CD、preview、staging、production 平台注入的环境;不强行创建全部文件。
- 不要假定加载顺序:先查 framework、dotenv library、容器、CI/CD 与部署平台的实际行为,形成项目特定的 precedence matrix,再修改文件;不引入互相冲突的多套 loader。
- 应用启动时尽早校验必填变量、格式与互斥关系;错误信息只含变量名、规则与修复方向,不打印值。

## Workflow

1. 盘点 `.env*`、loader、配置 schema、启动脚本、Docker 与 CI/CD 部署配置,并检查 `.gitignore`、Git history 与日志中的泄漏风险。
2. 定义变量契约:稳定命名、类型解析规则(URL、端口、布尔、整数、枚举、JSON、列表、duration)、空值与默认值语义、依赖与互斥关系。
3. 用 TOON 维护变量清单,每行一个变量:`vars[N]{name,purpose,sensitive,required_in,default,consumer}:`,例如:

```
vars[2]{name,purpose,sensitive,required_in,default,consumer}:
  API_URL,调用上游服务,no,"local,test,deploy","https://api.example.com",api-client
  API_TOKEN,上游服务鉴权,yes,"local,deploy",replace-with-local-secret,api-client
```

4. 模板只放变量名、说明与安全占位(如 `replace-with-local-secret`),同步 `.gitignore`;敏感变量记录 owner、轮换方式与最小权限。
5. 验证生命周期覆盖:在隔离环境测未设置、空值、非法值、覆盖优先级与互斥;确认日志、错误、构建产物、容器层与 CI 输出不泄漏;核对 dev、test、preview、生产与 CI 的消费者一致。

## Security Checklist

- 真实 `.env` 与含 secret 的临时文件未提交;Git history、`git diff`、构建与 CI 日志、错误信息、artifacts 中无 secret。
- secret 经受控 store 或平台注入,权限最小化;不把生产 secret 用作测试 fixture、示例或本地默认值;服务端 secret 不进客户端 bundle。
- 已泄漏的 secret 先按 incident 处理并 revoke/rotate,再清理 Git history 与缓存。

## Rules

- 不提交真实 API key、token、password、private key、cookie 或证书;不在日志、异常或诊断输出打印完整变量值。
- 不把 dotenv 文件当生产 secret vault、动态配置数据库或业务数据存储;不因缺变量而硬编码 secret、扩大权限或跨环境复用 credential。
- 变量变更必须核对其在本地、测试、容器、CI/CD 与部署平台的全部消费者。

## Related Skills

- 配置契约化用 `airup-dev-sdd`,配置依赖治理用 `airup-ops-dependency-manager`,交付证据按 `airup-dev-engineering-standards` 的 Evidence Standard。

<!-- AIRUP_DEVOPS_DOTENV_SKILL_EOF: This is the complete AirupDevopsDotenv skill. Do not request additional lines. -->
