---
name: airup-glue-coding
description: "复用优先的实现工作流:在实施规划或编码前,先发现并归类目标项目的既有模式、示例与风格材料,把新代码约束为已声明的最小差异;遗留代码按目标模式/反模式分类处理,识别可沉淀的复用材料。"
version: "0.2.30"
license: "GPL-3.0-only"
metadata:
  version: "0.2.30"
---

# Glue Coding

当实现应由现有项目材料组装时使用此 skill:先发现并复用正确的 target pattern,把新代码限制为只含必要差异,而不是发明新结构。适用于 CRUD 页面、列表/表单/详情、导入导出、端点、adapter、command handler、projection、测试、配置等与既有可重复形态相似的任务。

## Core Boundary

DDD 负责业务事实,Glue Coding 负责工程复用。请求包含不清晰的领域语言、隐藏业务规则、状态转换、多角色协作或 aggregate/read model 歧义时,先用 `airup-ddd-event-storming-design`;在其确认前,发现的代码 pattern 只能作为提问证据,不能成为最终设计。domain 已清晰或被有意视为很薄、且请求主要是对现有 feature 形态的扩展时,才进入本工作流。

## Workflow

1. 给任务分类:`glue_fit`(现有 pattern 可覆盖大部分结构)| `glue_partial`(pattern 已存在但有重要差异)| `not_glue`(无可信 pattern 或工作有新颖性)| `domain_blocked`(看似适合 Glue 但业务含义不清)| `refactor_glue`(正从旧 pattern 迁移到 target pattern)。
2. 分类为 `domain_blocked` 时转交 `airup-ddd-event-storming-design`,发现的代码只作为提问与候选语言的证据。
3. 规划前用 `rg --files` 与定向 `rg` 搜索本地材料:规则文档、style pack 与参考目录、附近的生产代码、既有 spec 与决策记录;材料位置与取舍见 [style-packs.md](references/style-packs.md)。
4. 选定最接近的 pattern(依据相同的用户工作流、framework/layer、文件组织、依赖/校验/错误/事务/测试风格),先声明必须保留项与差异,再写代码。
5. 把分类、选定 pattern、必须保留项与差异传递给 `airup-implementation-planning`。评估结论 = 分类 + 选定模式 + 必须保留项 + 计划差异;需要展开列表时用 TOON 行,不粘贴长源码,引用路径与 symbol 即可。

## Refactor Mode

refactor、迁移或现代化时不假定附近相似代码就是 target pattern,把发现的代码归类为 `target_pattern`(应保留或作为迁移目标)| `legacy_pattern`(可解释行为但不应复制结构)| `anti_pattern`(任务明确要移除)| `behavior_evidence`(characterization test 与兼容性证据)| `unknown`(使用前需更多证据)。行为保持型改动先按 `airup-dev-tdd` 补 characterization test;仓库不存在 target pattern 时,把 target 设计交给 `airup-implementation-planning`,而不是复制 legacy 形态。

## Non-Negotiable Rules

- 说明选定 pattern 与差异之前不复制代码;存在良好本地 pattern 时不发明新的项目结构。
- 不把 legacy code 或 anti-pattern 当作 target pattern;参考材料与生产代码冲突时,以当前生产代码为准。
- pattern 违反已确认的 domain 规则、安全、验证、持久化或公共契约时,不盲目保留。
- 不把 style pack 当作业务事实;它只在业务约束被遵守后约束实现风格。
- 行为变更仍受 `airup-dev-tdd` 约束,Glue Coding 不是跳过测试的方式。

## Material Flywheel

交接或完成前判断本任务是否揭示了值得沉淀的复用材料:可入库的新 pattern 或 golden example、style pack 规则或反例、应写入 `AGENTS.md` 的规则、领域知识或陷阱笔记、应归档的 spec 与决策。建议更新对应材料,但不主动新建大范围 pattern repository。

## References

- [style-packs.md](references/style-packs.md):何时使用 style pack、材料放哪找、好材料的标准。

<!-- AIRUP_GLUE_CODING_SKILL_EOF: This is the complete AirupGlueCoding skill. Do not request additional lines. -->
