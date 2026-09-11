---
source:
  - "https://code.byted.org/life_service/life_trade_c_fe_e2e"
  - "https://code.byted.org/devops/life_trade_c_order_e2e"
source_title: "《订单 E2E 自动化代码仓库》；《订单 E2E Bits 流水线原子节点》"
type: "code_reading_summary"
summary: "订单 E2E 自动化代码仓库；订单 E2E Bits 流水线原子节点。代码阅读摘要，不是完整源码或生产运行指标。"
---
# 订单 E2E 本地代码证据索引

核对日期：2026-09-10。以下为代码阅读摘要，不是生产运行结果或完整源码快照。

## E2E 管线

- 仓库：https://code.byted.org/life_service/life_trade_c_fe_e2e
- 本地目录：`~/workspace/e2e/life_trade_c_fe_e2e`
- `references/e2e/project.md`：共享数据、回放、真机截图、Diff 与结果确认的链路。
- `lib/e2e/pipeline/`：任务与 Job 编排，replay / ehome / diff / resolve 分阶段执行。
- `lib/e2e/pipeline/steps/resolve/impl.ts`：阈值判断自动放行，差异进入人工确认。
- `lib/e2e/pipeline/steps/diff/impl.ts`：线上与目标环境截图对比与结果有效性校验。
- `references/e2e/metrics.md`：技术成功率、噪音率和耗时的口径。

## Bits 原子节点

- 仓库：https://code.byted.org/devops/life_trade_c_order_e2e
- 本地目录：`~/workspace/e2e/life_trade_c_fe_e2e_atom`
- `impl/index.ts` 与 `impl/tools/`：节点生命周期、进度、超时与终止清理。

## 归属边界

本地项目说明标明订单 E2E 产品平台由交易 C Client 团队负责。已核对 liutao.fe 的管线与原子节点提交；这不能单独证明全部平台能力由个人完成，也不能证明生产采用规模或收益。
