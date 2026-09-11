---
source:
  - "https://bytedance.larkoffice.com/docx/ETw7d87VGovOxGx0r52cGAHtnkb"
source_title: "《全链路订单 E2E 三仓 MR 改动与 CR 汇总（2026-08-12）》"
type: "document_snapshot"
summary: "全链路订单 E2E 三仓改动与 CR 汇总。原文快照；目标、进展和实际结果按原文区分。"
---
<title>全链路订单 E2E 三仓 MR 改动与 CR 汇总（2026-08-12）</title>

**报告范围：**life_trade_c_fe_e2e MR 77、life_trade_fe_tool_mono MR 206、life_e2e_optimus MR 169。

<callout emoji="❗">
**结论：**本次改动已经打通“Optimus 配置与展示 → lib-e2e 回放/执行 → lib-common Tea 查询”的全链路能力，但三个 MR 当前均不建议直接合入。E2E 仓存在 1 个 P0 凭证泄露、1 个 P1 状态判断问题和 1 个 P2 链路串单风险；Optimus 存在代码冲突及测试失败；Tool 仓远端 Full Pipeline 的 lint 失败仍待定位。
</callout>

# 1. 整体改动

本次需求将订单 E2E 从单页面回放扩展为全链路回放。用户可在 Optimus 创建任务时选择全链路模式、基准页面及是否过滤不完整链路；后端通过 Tea 日志关联商品详情页、订单确认页和订单详情页，重建各页面回放数据，合并 Mock 并交给 EHome/Bytest 执行；任务结果侧按页面展示截图、日志、回放状态与汇总信息。

**主链路：**Optimus 任务配置与结果展示 → life_trade_c_fe_e2e 的任务编排、Tea 日志关联、Replay 与 EHome 执行 → life_trade_fe_tool_mono 的 Tea DSL 与公共类型能力。

| MR | 规模 | 职责 | 当前状态 |
|-|-|-|-|
| [E2E MR 77](https://code.byted.org/life_service/life_trade_c_fe_e2e/merge_requests/77) | 28 文件  <br/>+4166 / -58 | 全链路日志关联、回放数据重建、任务编排、EHome 多页面执行 | 有未解决审查项，不建议合入 |
| [Tool MR 206](https://code.byted.org/life_service/life_trade_fe_tool_mono/merge_requests/206) | 7 文件  <br/>+62 / -23 | Tea DSL 公共参数、日期范围及类型支持 | 远端 lint 失败待定位 |
| [Optimus MR 169](https://code.byted.org/life_service/life_e2e_optimus/merge_requests/169) | 19 文件  <br/>+885 / -124 | 任务配置、BFF 参数透传、全链路结果展示 | 代码冲突，测试失败 |

# 2. 各仓改动明细

## 2.1 life_trade_c_fe_e2e：全链路核心实现

**配置模型。**Replay 新增 `single_page` 与 `full_chain` 两种模式；全链路模式支持配置基准页面、过滤不完整链路，并限制任务数量上限。创建任务时以商品详情页作为执行入口，以基准页面计算任务维度。

**日志关联。**通过 Tea 查询将 GoodsDetailPage、ProjectConfirmPage、OrderDetailPage 串联。确认页优先使用 `project_enter_id` 关联，并提供设备与商品维度的降级匹配；订单详情页根据订单相关日志补全链路。Tea 查询增加限流与重试，降低大批量查询的不稳定性。

**Replay 重建。**新增全链路 provider/scene，按页面读取与重建 response，合并多页面 Anywhere Mock，并记录各页面对应的 TOS 元数据、日志标识和回放摘要。

**EHome 执行。**由单截图扩展为多页面目标执行，支持不完整链路过滤、目标键和回放键，并同步补充测试、开发文档和依赖版本。

## 2.2 life_trade_fe_tool_mono：Tea 公共能力补齐

**日期范围。**Tea 查询参数新增 `period_start_days`，允许传 0 以包含当天，并将该参数传递到子分析查询。

**公共参数。**过滤条件与分组定义支持 Tea 的 `common_param` 属性类型，用于 `tea_profile_device_id` 等公共字段；相关类型同步放宽。

**代码整理。**`getAnalysisParams` 复用公共参数构建逻辑，增加单元测试并更新版本依赖。该 MR 是 E2E 仓进行全链路 Tea 查询的基础依赖。

## 2.3 life_e2e_optimus：产品入口与结果展示

**创建任务。**API Schema 和前端表单增加回放模式、基准页面、过滤不完整链路及数量边界校验；默认基准页为订单详情页。

**BFF 接入。**BFF 将 Replay 配置与默认 Job 信息传给 lib-e2e，并按基准页面生成任务维度，完成平台侧与执行层的契约对接。

**结果展示。**Replay 详情展示全链路摘要、各页面状态、日志 ID 与预览；EHome 结果支持按页面展示多张截图；任务汇总卡片展示完整链路数量和页面级统计；预设配置表支持查看与编辑新增字段。

**依赖升级。**升级到新的 `@byted-life/lib-e2e` 与 lib-common 开发版本，以消费底层全链路能力。

# 3. 已确认问题与合入阻塞

| 级别 | 问题 | 影响 | 建议 |
|-|-|-|-|
| **P0** | E2E 仓文档提交了完整个人 JWT | 凭证进入 Git 历史，存在直接泄露和被滥用风险；示例变量名与实际使用名也不一致。 | 立即吊销/轮换；从当前提交和历史中清除；文档改为占位符。 |
| **P1** | `hasSuccess()` 与执行阶段读取不同配置来源 | 执行阶段使用 case_data 与 job_info 合并配置，但成功判断只读取 job_info，可能误判任务未成功并重复执行 EHome。 | 统一从最终生效配置读取 `filter_incomplete` 等字段，并补回归测试。 |
| **P2** | 确认页基线按设备与商品取全局最新订单 | 同一设备重复购买同一商品时，旧链路可能被拼接到最新订单，造成跨任务串单。 | 加入时间窗口、事件序列或更稳定的链路标识进行一对一关联。 |
| 阻塞 | Optimus 与目标分支发生测试文件冲突 | 目标分支已扩展页面额外分组字段，MR 仍基于旧断言；当前不可合并，Full/Partial Pipeline 测试失败。 | 先同步目标分支并保留双方新增字段，再重跑测试。 |
| 阻塞 | Tool 仓远端 Full Pipeline lint 失败 | 本地隔离 MR 提交执行 lint 为 0 error、378 warning，暂无法将红灯归因到本次改动；详细流水线日志受权限影响未读取成功。 | 补齐流水线日志权限或由有权限同学导出失败日志，确认环境/基线差异。 |

# 4. 推荐合入顺序与验收

依赖方向决定推荐顺序为 **Tool → E2E → Optimus**：先发布 Tea 公共能力，再发布 lib-e2e 全链路实现，最后由 Optimus 升级依赖并接入平台能力。当前应先解决各自阻塞，再按该顺序逐仓发布。

1. 立即处理 E2E 仓个人 JWT：吊销、轮换、清理提交及历史。
2. 修复成功状态配置来源不一致和重复购买串单问题，并增加针对性单测。
3. 定位 Tool 仓远端 lint 红灯，确保目标版本可正式发布。
4. 同步 Optimus 目标分支、解决维度测试冲突，重新执行 Full 与 Partial Pipeline。
5. 使用完整链路、不完整链路、同设备重复购买同商品三组数据做跨仓冒烟验证。

# 5. 审查覆盖说明

本次已完成 Codex 主审与 TRAE CLI 独立审查，并结合三个 MR 的 diff、测试与流水线状态交叉核对。Kimi CLI 因账户用量限制返回 403，DeepSeek worker 两次启动后均未返回结果，因此报告未引用这两路模型的结论，也未将其包装为已完成审查。

**报告时间：**2026-08-12（Asia/Shanghai）