# Modeling Principles

Event Storming 建模过程中的战术原则清单,供推导 Aggregate、Command、Policy 与事件命名时对照使用;原则讲解从简,以小型对比辅助学习。

- 先行为后结构;参与者是一等输入(发起者、受影响主体、决策者、下游消费者、定时器、外部系统)。
- 事件用已完成业务时态命名,优先具体事实,拒绝"信息已变更"类模糊事件;失败仅在业务含义明确时建模。
- Command 用揭示意图的业务动作命名(如"任命部门负责人"),不用"新增/修改/删除/同步";Command 不是 HTTP API 或 Controller 方法;定时器是发起 Command 的参与者。
- Policy 表示无状态的"事件发生则执行 Command";需要持久状态或跨事务协调时标记 Process Manager;Policy 不隐藏 Aggregate 不变量;Domain Service 仅用于真正跨聚合的领域协作。
- Aggregate 按行为、不变量、身份与生命周期推导;与 CRUD 页面名词同名时必须证明一致性边界,否则降级为 Read Model 或参考数据;既不过大也不过度碎片化。
- 维护依赖(命令校验先前事实)、订阅(事件触发 Policy 执行命令)、影响(事件改变参与者可见或可执行事项)三种关系;文本为事实来源,图表为辅助。

## Event Index Format

`event-storming.md` 末尾附 TOON 事件索引,记录已接纳事件的生产者与消费者:

```text
events[2]{name,producer,consumers}:
  员工已签到,签到命令,满勤奖励策略;考勤读模型
  订单已提交,提交订单命令,库存扣减策略
```
