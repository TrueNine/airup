# Style Packs

Style pack 是项目所有的参考材料集合,在业务设计清晰后帮助 agent 保留仓库的实现风格;它不覆盖已确认的业务规则、安全、验证、持久化或公共契约。

## When To Use

任务映射到重复的实现形态(command、event、projection、controller、import/export、migration 等),或多种代码风格都可行而本地一致性很重要,或重构正从 legacy pattern 迁往选定 target pattern 时使用。

## Where To Find

按顺序查找:用户明确提供的路径;`AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md` 等规则文档中的指引;`.airup/style-pack/`;`examples/`、`docs/patterns/` 等参考目录。目录内部结构可按项目惯例组织,不强求固定形状。style pack 与当前生产代码冲突时,以生产代码为准,除非任务明确要求向该 pack 迁移。

## Good Material

- 归使用它的项目所有,展示完整的 naming、layering、dependency direction、测试与验证风格。
- 解释 pattern 存在的原因,并对看似相似但不应复制的 legacy 形态给出明确反例。
- 精简到编码前可以读完;不用空白填充 template、无选择指导的大段源码转储或过时示例。
