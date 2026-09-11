# 项目事实与简历数据

修改前阅读 [写作要求](../RULE.md)。

## 内容层次

1. `../sources/catalog.json` 登记原始快照、外部来源和校验值；直接引用快照，不复制整套可读副本。
2. `evidence.json` 保存按项目编号的事实、原文摘录、来源定位和使用边界；`projects/*.md` 是其可读版本。每次更新事实时同步两者。
3. `user-confirmed.md` 单独记录用户补充和纠正，不冒充原始文档内容。
4. `resume-map.json` 记录简历各字段采用的事实与补充依据、计算口径及未采用项。
5. `report.md` 与 `report.json` 是简历渲染入口；从项目事实中合并精简，不反过来作为项目事实的来源。

## 项目目录

| 项目 | 事实文档 |
| --- | --- |
| 订单 E2E 自动化 | [e2e.md](projects/e2e.md) |
| 交易研发资产 | [assets.md](projects/assets.md) |
| 跨端 SDK 自动生成 | [sdk.md](projects/sdk.md) |
| 互动白板 | [board.md](projects/board.md) |
| 移动端落地页编辑器 | [editor.md](projects/editor.md) |
| 携程 Foxpage | [foxpage.md](projects/foxpage.md) |

Foxpage 目前仅支撑工作经历，未新增为简历代表项目。成都卡莱博尔只保留用户提供的公司、职位和年份。

## 维护要求

- 原文明确记录、技术方案、代码阅读摘要、消息和用户确认分别标明，不能混写证据类型。
- 计划不视为完成；任务分工不证明实现状态；旧简历和项目快照不能形成循环佐证。
- 推算值必须标明公式和基线。缺失的数据、范围或时间点不推断。
- 所有更新同时检查项目事实、精简正文、详细说明、JSON 指标与引用，避免旧表述继续展示。
