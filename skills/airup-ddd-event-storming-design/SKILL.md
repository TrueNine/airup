---
name: airup-ddd-event-storming-design
description: "用 Event Storming 与需求追踪进行 DDD 建模:从原始需求出发,以行为优先澄清 Domain Event、Command、Policy、Aggregate 与 Read Model,并审查由数据库表、CRUD 页面或包结构驱动的伪 DDD 设计。适用于看似 CRUD 的后台需求与持续演进的业务域。"
version: "0.2.33"
license: "GPL-3.0-only"
metadata:
  version: "0.2.33"
---

# DDD Event Storming Design

先协作发散、再有纪律收敛的 DDD 建模流程。假定用户不熟悉 DDD:把表、字段、CRUD 页面、"管理公司/部门/员工"等表述视为原始探索材料,而不是模型本身。默认只产出领域设计,不产出代码、测试或持久化映射,除非用户明确要求实现。

## Core Rule

- 从问题域、业务事实、Domain Event、Command、规则与 Read Model 出发推导 Aggregate;不从数据库表、CRUD 页面、HTTP API、包结构或战术术语出发。
- 候选事件只是工作材料;只有当事实具备业务含义、存在生产路径(参与者/外部系统 -> Command -> Aggregate/流程 -> 事件),且至少有一个非查询业务消费者会因此改变选项、规则、流程或能力时,才接纳为 Domain Event。仅凭 Read Model 刷新、页面展示或缓存更新不足以接纳事件。
- 把数据驱动请求翻译成行为探索:表/实体名 -> 业务主体或生命周期候选;字段 -> 事实、决策或不变量;create/update/delete -> 解释"变更为何重要"的 Command;状态字段 -> 生命周期事件;外键 -> 所有权与一致性关系;sync/upsert -> 外部事实与权威来源问题;后台页面 -> 参与者职责、审批与审计关注点。
- CQRS 是建模视角:Command 经领域模型改变状态,查询由 Read Model 满足。Read Model 字段可来自事件投影、当前状态查询、查询侧 Join、技术投影、丰富化 Payload 或外部来源;不得为填充查询字段臆造事件。

## Workflow

```text
需求收集(需要时) -> 问题域边界 -> 参与者与权威来源 -> 候选事件池
  -> 事件筛选与接纳 -> Command 与 Policy -> Aggregate -> Read Model -> 关系与完备性
```

对决定下游建模的章节使用确认门,未确认且会影响后续模型时不得越过:

1. 需求收集门:多场景输入先确认需求条目与缺口,再作为建模输入。
2. 问题域门:确认域名称、包含与排除职责、是否存在 CRUD 模板风险。
3. 参与者与权威来源门:确认 Command 发起者、受影响主体、外部系统的权威性。
4. 关键规则门:确认会塑造事件与聚合边界的业务规则(任职限制、删除语义、冲突优先级等)。
5. 建模方案门:存在 2-3 种合理方案时,先确认推荐方案再定 Aggregate 边界。
6. 持久化门:写文件前只确认尚未确认或已变化的结论。

输入是类 CRUD 名词列表(如"公司、部门、岗位、员工")时,首次响应只标记 CRUD 模板风险、给出行为优先的边界建议,并停在问题域门提出一个聚焦确认问题;该门确认后才展开事件、Command 与 Aggregate。缺失但不阻塞当前门的信息按最小合理假设处理,标记为推断结论并纳入确认清单。

## Requirements Intake

输入宽泛或后续要实现时,先做轻量需求收集(框架中立,产出停留在需求层面,需求条目不是 Command,业务主体不自动成为 Aggregate):

```text
requirements[N]{id,scenario,stakeholder,subject,operation,gap}:
  REQ-001,员工请假,员工,请假单,create,审批人未指定
  REQ-002,月度考勤汇总,HR,考勤记录,view,统计口径待确认
```

多场景输入分配稳定需求 ID(`REQ-001`),并维护一张待确认清单(假设、歧义术语、缺失业务事实)。用户只要需求分析时停在此处并请求确认。

## Design Proof Gates

最终确定 Command、事件、Aggregate 或 Read Model 前逐项过门:

- Event Admission:每个已接纳事件有过去时命名、生产路径与非查询消费者;拒绝或降级的事实记入非正式拒绝日志。
- Command Granularity:Command 按参与者意图设计,一个 Command 可产生多个事件但须解释为同一业务决策;无权威事实来源时禁止"全部同步"Command。
- Aggregate State Necessity:每个状态项至少被 Command 决策、不变量、事件生产、身份或一致性关系之一直接使用,否则移出 Aggregate。
- Identity And Uniqueness:身份与唯一性规则按参与者/来源分别建模,不合并为通用唯一性声明。
- Lifecycle Removal:删除/归档/停用须说明业务含义、真正阻塞的业务事实与历史引用有效性;无真实恢复能力时不添加恢复命令。
- Read Model Source:每个字段记录来源;缺字段首先是来源问题,只有存在非查询消费者时才可能是事件缺口。

## Output Template

对话响应使用以下章节,按需取舍,不输出空章节:

1. `Problem Domain Boundary`:包含/排除职责、假设、歧义。
2. `Actors`:发起者、受影响主体、决策者、下游消费者,附 `Actor -> Command -> Event -> 影响主体 -> 后续` 链路。
3. `Domain Events`:已接纳事件目录与逐条筛选结论;拒绝/降级记入非正式拒绝日志。
4. `Commands`:业务动作、发起参与者、可产生的多个事件、需求 ID。
5. `Policy`:自动化反应与 Process Manager 候选。
6. `Aggregates`:名称、身份、状态、Command、事件、不变量与归属理由。
7. `Read Models`:查询需求、字段与来源。
8. `Completeness Check`:按 Design Proof Gates 逐门核对,列出未覆盖需求与未决问题。

结尾附`结论确认清单`,只列尚未确认或刚变化且影响持久化的结论(每项注明影响的下游概念);全部已确认时明确说明无待确认项。需要图表时才用 Mermaid/PlantUML,标签用 `[Actor: 用户]`、`[Command: 签到]`、`[Event: 员工已签到]` 等形式。

用户需要文件时,每个业务域在目标项目的既有文档目录维护一个 `event-storming.md`,按 Output Template 章节组织并附 TOON 事件索引(格式见 [modeling-principles.md](references/modeling-principles.md));只在结论确认后写入或更新,增量演进只读取和更新受影响章节,不整体重生成。

## Related Skills

- 新需求需成文为可执行契约时,先用 `airup-dev-bdd` 输出 Gherkin `.feature`。
- 设计确认后进入实现:把每个行为切片交给 `airup-dev-tdd` 或 `airup-implementation-planning`,切片需含需求 ID、DDD 来源、测试层、预期 RED、最小 GREEN、保护对象、不可变更项与未决依赖;映射示例见 [mapping-examples.md](references/mapping-examples.md)。
- 以模式复用为主的实现用 `airup-glue-coding`;交付前用 `airup-verification-before-completion` 汇报验证与剩余风险。

## References

- [modeling-principles.md](references/modeling-principles.md):战术建模原则与事件索引格式。
- [anti-patterns.md](references/anti-patterns.md):需要拒绝或纠正的 DDD 建模反模式清单。
- [eval-cases.md](references/eval-cases.md):迭代本 skill 用的评估用例。
- [validate-ddd-design.ts](scripts/validate-ddd-design.ts):对草稿或 `event-storming.md` 的启发式检查:`bun "<SKILL_INSTALL_ROOT>/scripts/validate-ddd-design.ts" <path> [--require-sections]`,非零 exit code 视为阻断项。

<!-- AIRUP_DDD_EVENT_STORMING_DESIGN_SKILL_EOF: This is the complete AirupDddEventStormingDesign skill. Do not request additional lines. -->
