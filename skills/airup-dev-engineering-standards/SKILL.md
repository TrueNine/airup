---
name: airup-dev-engineering-standards
description: "为架构、API、安全、输入边界、Java 风格和代码评审等规范敏感任务选择权威工程标准,并统一结构化输出格式与验证证据标准。也负责仓库工具卫生整理。"
version: "0.2.37"
license: "GPL-3.0-only"
metadata:
  version: "0.2.37"
---

# Dev Engineering Standards

为规范敏感任务选择适用的权威标准,并将其转换为当前项目可执行、可验证的决策。所有 Airup skill 的结构化输出与验证证据都遵循本 skill 定义的格式,不各自重复定义。

## Authority Order

按以下优先级裁决规范冲突,项目规则覆盖外部建议时保留项目规则并记录偏离:

1. 目标项目根目录及受影响文件最近的 `AGENTS.md`。
2. 目标项目的模块、框架和团队规范。
3. 用户在当前任务中明确给出的约束。
4. 适用的外部权威规范,入口见 [standards.md](references/standards.md)。
5. Airup 的默认工程原则。

## Workflow

1. 识别规范敏感面:架构职责、API/契约、安全、输入边界、Java 风格或代码评审;一个任务可涉及多个面。
2. 从目标项目根目录向受影响文件所在目录查找并阅读适用的 `AGENTS.md` 与技术规范;不存在时在结果中记录"未找到"。
3. 按敏感面选择最小的外部来源集合,依赖具体条款时读取官方当前页面,不凭记忆补写。
4. 将规范解释为责任、前置条件、失败行为和验证方式;区分"规范原文要求""项目规则要求"和"本次设计判断"。
5. 交付时按 Evidence Standard 报告验证结果,并说明未适用的规则与原因。

## Boundary Responsibility

区分三种行为,不要混成"防御性处理":

- 规范化:将公开契约允许的别名转换为唯一表示,由拥有该输入契约的边界执行且只执行一次。
- 校验:每个边界仍验证自己拥有的不变量,收到非法值时按契约拒绝,不以重复修复代替校验。
- 业务决策:需要业务信息与一致性判断的规则归属拥有该业务责任的边界,不因输入来自 Controller 就放入 Controller。

## Structured Data Format

需要向用户或其他 agent 输出结构化数据(清单、发现、证据、检查点)时,使用 [TOON](https://github.com/toon-format/toon)(Token-Oriented Object Notation),不要使用 JSON、JSON5 或 YAML。TOON 与 JSON 同构,但省略引号、花括号和重复键,对表格类数据可减少约 40% token。

```text
findings[2]{file,line,risk,action}:
  src/auth.ts,42,missing permission check,add role guard
  src/api.ts,17,unbounded page size,cap at 100
```

书写规则:

- 对象为 `key: value` 行,嵌套用 2 空格缩进;表格数组用 `name[N]{f1,f2}:` 表头加每行一行记录,`N` 为行数。
- 字符串仅在含逗号、冒号、引号、方括号、首尾空白或形如数字/布尔/null 时加双引号;其余一律裸写。
- 数量少且非同构的数据用普通 `key: value` 行,不强行凑表格。
- 只有宿主工具接口明确要求 JSON 时才输出 JSON,并在交付说明中注明原因。

## Evidence Standard

报告验证结果时,统一使用一张 TOON 证据表,不重复解释格式:

```text
checks[3]{cmd,exit,result}:
  bun test,0,pass 412
  bun run lint,0,clean
  bun run typecheck,1,3 errors
```

- 每条命令给出 exit code 和一句话结果摘要;禁止只写"测试通过"而不给命令。
- 未执行的检查列入 `skipped[N]{cmd,reason}:`,不省略也不编造。
- 最终报告 = 结论 + 证据表 + 剩余风险,不加其他固定栏目。

## Repository Hygiene

整理仓库以降低 agent 上下文噪声:

- 根目录仅保留构建入口与说明文档;人类专用的一次性脚本、init 脚本移入 `scripts/` 或 `docs/`,并在 `AGENTS.md` 或 README 中留下可发现的入口说明。
- 移动或删除文件前先确认引用(构建脚本、CI、文档),破坏性操作须经用户确认;用 `git status --short` 核对结果。
- skill、文档和示例中不得写入密钥、内部主机名或真实 `.env` 值。

Gradle 项目需要阿里云镜像时,可参考 [aliyun-init.gradle.kts](templates/aliyun-init.gradle.kts) 作为 init script 模板。

## Guardrails

- 不复制外部标准全文;只读取与当前敏感面相关的条款。
- 不把一次性用法或团队偏好提升为跨项目原则;不用风格规范裁决领域模型。
- 没有可验证的项目规则或官方条款时,标记为设计判断,不伪造权威依据。

## References

按需读取 [standards.md](references/standards.md),获取官方规范入口与选择规则。

<!-- AIRUP_DEV_ENGINEERING_STANDARDS_SKILL_EOF: This is the complete AirupDevEngineeringStandards skill. Do not request additional lines. -->
