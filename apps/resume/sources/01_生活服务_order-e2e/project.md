# 生活服务 - 订单 E2E 自动化

## 项目结果与收益

- **回归能力落地：**2026 年 3 月向订单小组开放 PPE 试用，6 月本人消息确认在集成回归阶段加入 E2E 调试；订单火车接入文档安排集成后触发、次日复核结果，形成发布前发现 UI 差异的检查流程。见 [部署消息](https://applink.feishu.cn/client/chat/open?openChatId=oc_cbaeeacd0e59ccc13c935a268f0f6bd4&position=93)、[接入消息](https://applink.feishu.cn/client/chat/open?openChatId=oc_b789094c27a36c6c57758544fbe63758&position=773)、[治理方案](https://bytedance.larkoffice.com/wiki/M9vYwRg2uinawHkFaIgcDjK2ndb)。
- **覆盖与复用：**Q1 复盘记录业务身份数据覆盖度 **100%**；复用平台与共享数据，建设单页回归并扩展多页面回放，减少逐场景重复准备数据与执行步骤。时间收益未单独测量。
- **运行情况与限制：**9 月 4—10 日周度审查记载 **7 个任务、1,534 个 Job**，包含订单火车及酒旅、餐综测试，同时记录大量数据缺失、执行异常和未完成任务。该材料为部分 AI 生成的二手快照，未复核底层数据，仅说明运行场景；不作为高成功率或提效证明。见 [周度审查](https://bytedance.larkoffice.com/wiki/XUEZwMAgAiawsFksCr7cvxeUnpe)。

## 项目简介

时间：2026.01 — 至今

2025 年订单域曾出现卡片／按钮缺失导致用户无法核销、退款的问题。围绕这些风险，按业务身份组织测试数据，在发布前自动复现页面并比较线上与 PPE 的 UI 差异，降低逐场景维护测试脚本的成本。见 [技术方案](https://bytedance.larkoffice.com/wiki/KAVKwkzXVijooHkOOLjcXwLenyJ)。

## 个人职责

承担 FE 侧订单回归能力建设，串联流量回放、任意门 Mock、真机执行与 UI Diff，建设任务编排和 Bits 原子节点并接入订单火车回归；持续治理截图噪音与执行异常，扩展多页面全链路回放。

## 技术介绍

- **真实数据驱动：**复用资产采集测试数据，按行业与业务身份准备回归任务，重建接口响应并写入 Anywhere；解耦接口回放环境与 Gecko 包环境，通过 ehome / Bytest 执行双环境真机截图。
- **执行与流程编排：**建设任务、Job 与 replay → ehome → diff → resolve 四阶段管线，封装 Bits 原子节点和 cronjob，管理任务触发、进度、动态超时与终止清理。
- **差异与稳定性治理：**针对设备尺寸差异、白屏与状态栏噪音，完善截图有效性校验、白屏复检及 Diff 引擎降级；结合阈值自动放行与人工确认，上报执行成功率、噪音率和耗时。
- **全链路扩展：**通过 Tea 日志关联商详—提单—订单，重建多页面响应并合并 Mock，支持完整性校验与页面级结果展示。见 [当前源码](https://code.byted.org/life_service/life_trade_c_fe_e2e)、[原子节点](https://code.byted.org/devops/life_trade_c_order_e2e)、[三仓改动](https://bytedance.larkoffice.com/docx/ETw7d87VGovOxGx0r52cGAHtnkb)。

## 证据与统计口径

口径：Q1 复盘记录业务身份数据覆盖度 100%，分母为订单页面埋点中的业务身份，不代表全部状态、交互路径或代码覆盖。同期单次执行完成率约 40%，多次重试后可达 95% 以上；95% 完成率及噪音率从 73% 降至 10% 是后续治理目标，不能写作已达成。产品平台与初始 UI Diff 能力由 Client 团队提供，本人聚焦 FE 侧串联、工程化和治理。见 [Q1 复盘](https://bytedance.larkoffice.com/wiki/Oo4vwRnGzibmPKkUiiZcC14Mnag)、[分工](https://bytedance.larkoffice.com/wiki/KAVKwkzXVijooHkOOLjcXwLenyJ)。
