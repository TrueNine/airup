---
name: airup-dev-code-review
description: "以风险优先的代码评审工作流:实现完成后做缺陷导向自审,收到评审意见后按 must_fix/discuss/decline_with_reason/already_addressed/needs_more_context 分类处置并逐条验证。不负责发布或分支操作。"
version: "0.2.28"
license: "GPL-3.0-only"
metadata:
  version: "0.2.28"
---

# Dev Code Review

同一评审工作流的两次使用:实现完成后、请求他人信任变更前做缺陷导向自审;收到评审意见后分类处置并逐条验证。两种场景都以风险而非赞扬开头,不发通用总结。

## Requesting Review

自审按风险优先展开:摘要依次给出变更意图、风险区与验证证据(命令 → 结果),检查正确性缺陷、行为回归、缺失或薄弱的测试、公共契约变更、持久化/事务/顺序/并发风险、安全与授权风险,以及与已确认契约(如 `.feature` Scenario、style pack)不一致之处。相关测试失败时不请求评审,除非评审正是针对该失败。

- 每条发现给出 `file:line`、风险与最小建议,可用一行 TOON 记录(格式见 `airup-dev-engineering-standards` 的 Structured Data Format):

```text
findings[1]{file,line,risk,fix}:
  src/auth/session.ts,"42","刷新令牌可重放,存在会话固定风险","改为单次使用并补并发测试"
```

- 不把无关清理纳入评审范围。
- 未发现问题时明确说明,并列出残余测试缺口或已知风险。

## Receiving Review

对每条意见先读完整评论及其上下文代码,再五选一分类:`must_fix|discuss|decline_with_reason|already_addressed|needs_more_context`。

1. 一次修复聚焦一个主题,变更范围限于评论所指内容,不顺手重构。
2. 修复引入新行为或暴露未受保护的风险时,先补测试再修。
3. 每条处置完用最小相关验证证明,并附给评审者的答复;没有代码、证据或清晰解释时不标记为已解决。
4. 评论指出具体缺陷或契约风险时,不以个人偏好反驳;当前测试通过不构成忽略变更请求的理由。

## Rules

- 不编造证据:每条发现、分类与"已解决"都必须对应真实运行过的命令或真实 diff。
- 不静默改契约:发现或修复涉及公共契约时显式标注并请用户确认。
- 修复引入新行为时走 `airup-dev-tdd`,先有失败测试再修。
- 范围外意见单独列出,不顺手改;也不还原目标范围外的变更。
- 评审摘要与最终报告遵循 `airup-dev-engineering-standards` 的 Evidence Standard:结论 + TOON 证据表 + 剩余风险。

## References

无

<!-- AIRUP_DEV_CODE_REVIEW_SKILL_EOF: This is the complete AirupDevCodeReview skill. Do not request additional lines. -->
