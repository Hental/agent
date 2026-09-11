---
source:
  - "https://bytedance.larkoffice.com/docx/FjOPdC8Fpo1hNexnJnxci0evn5f"
source_title: "《26 Q2 研发平台&资产上翻》"
type: "document_snapshot"
summary: "2026 Q2 研发平台与资产上翻。原文快照；目标、进展和实际结果按原文区分。"
---
## Q2 总结

### 目标&完成情况

> 4 月底进行目标调整，研发平台调整为仅内部试用，不进行团队内推广使用
<table data-lark-table="docx-table" data-block-id="ULX8dU02Bo9Narxs4rXcQE7WnLb"><tbody><tr><td>目标</td><td>达成结果</td></tr><tr><td>研发平台-运营&amp;优化</td><td>1. 完成 18 个需求的试用，已处理完成 32 个问题(主要为工具体验优化、边界资产错误信息修复)<br />1. 额外完成了场景工具与回放平台打通的功能<br />1. <a href="https://bytedance.larkoffice.com/wiki/WBMWwuizOicY3PkqIkQcaDJtnef">交易研发资产平台宣讲</a>资产平台宣讲</td></tr><tr><td>资产上翻-准确率&amp;覆盖率</td><td>1. 资产准确率由  81.81% <strong>提升至 92.31%</strong><br />1. 资产覆盖率 97.64%<br />1. 场景+ UI 覆盖率由 38.71% <strong>提升至 58%</strong><br />1. 自动化保鲜能力：预期 6 月底开发完成</td></tr><tr><td>资产上翻-oncall 场景支持</td><td>1. 实现资产检索 skill，为 oncall 场景提供上下文支持</td></tr><tr><td>知识库&amp;oncall</td><td>1. 搭建前端知识库<br />1. 搭建前端 oncall 机器人，截止目前共人工统计 11 个答疑 + oncall 数据，准确率为 **84.62% **</td></tr></tbody></table>

## 事项&人力评估

[交易平台提效-需求跟踪](https://bytedance.larkoffice.com/wiki/ANBJwlWisiXuUEkX0SdclUo8njc?table=tbl6VDmxAfM4vFNt&view=vewhcU6SYs)
> [!NOTE]
> 本 Q 主要 for 资产上翻 [交易平台提效-需求跟踪](https://bytedance.larkoffice.com/wiki/ANBJwlWisiXuUEkX0SdclUo8njc?table=tbl9vGEjH7Mx70yz&view=vewGKThJED)
> - 更新前
>> - 总人力 34~40pd
>> - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) 预估 21~ 24 pd
>> - [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) 预估 13~16 pd
> - 更新后
>> - 总人力 21pd
>> - [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) 8pd
>> - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) 13pd
>
### 事项更新

<table data-lark-table="docx-table" data-block-id="TC6odXVPmo6ULBxU8Alcne6cnng"><tbody><tr><td>人员</td><td>事项</td><td>具体事项</td><td>人力</td></tr><tr><td rowSpan="3"><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>研发平台-场景工具优化</td><td>- 信息覆盖率提升 3pd<br />- 反馈问题处理 1pd<br />- 打通已有页面回放工具，接入 Aime 处理长尾问题 2pd</td><td>6pd</td></tr><tr><td>资产采集消费-oncall 场景</td><td>- 知识库建设 4pd<br />- skill 建设 3pd</td><td>7pd</td></tr><tr><td colSpan="2">总计</td><td>13pd</td></tr><tr><td rowSpan="4"><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>研发平台-场景工具优化(截图采集相关)</td><td>- 信息覆盖率提升 1pd<br />- 反馈问题处理 1pd</td><td>2pd</td></tr><tr><td>截图资产准确率、覆盖率提升</td><td>- 商详支持 1pd<br />- 链路优化 2pd<br />- 保鲜链路 2pd</td><td>5pd</td></tr><tr><td>Oncall 接入支持</td><td>- oncall 接入支持</td><td>1pd</td></tr><tr><td colSpan="2">总计</td><td>8pd</td></tr></tbody></table>

### 事项梳理

<table data-lark-table="docx-table" data-block-id="CGDld793ioIaudxTDgscI5kfnWh"><tbody><tr><td>方向</td><td>具体事项</td><td>事项背景/方案</td><td>人力预估&amp;分工</td><td>优先级</td><td>人力汇总</td><td>更新后人力预估</td><td>更新后人力汇总</td></tr><tr><td rowSpan="4">研发平台体验优化</td><td>场景工具信息覆盖率优化</td><td>- 背景：当前采集上来的数据较为单一，有些场景下定位业务身份后无法看到需求对应的模块，导致后续操作阻断<br />- 方案：通过埋点增加信息采集覆盖率</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 3pd<br />- 埋点获取&amp;梳理&amp;验证  3pd<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 1pd<br />- 埋点数据采集链路 1pd</td><td>P0<br />在做中</td><td>4pd</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 3pd<br />- 埋点获取&amp;梳理&amp;验证  3pd<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 1pd<br />- 埋点数据采集链路 1pd</td><td>4pd</td></tr><tr><td>场景工具 scene 优化</td><td>- 背景：当前标准化 scene 使用 wrapper 区分，存在多对一、难以快速定位的问题<br />- 方案：通过插件为标准卡注入 scene 文件名，并在场景工具中添加跳转能力</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a>  1pd<br />- 场景工具跳转能力 0.5pd<br />- 上线测试 0.5pd<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 2pd<br />- scene 注入 1pd<br />- 上线测试 0.5pd<br />- 修改录入的数据 0.5pd</td><td>P1</td><td>3pd</td><td></td><td></td></tr><tr><td>场景工具细节体验优化</td><td>- 背景：处理交易研发平台使用中收集到的问题</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a>  预留 2~3pd<br />- Wiki<br />- 场景工具：agent 分析、业务身份检索<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 预留 2pd<br />- 场景工具：截图、h5 组件</td><td></td><td>4 ~ 5pd<br />纯 bug 1~2</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 1pd<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 1pd</td><td>2pd</td></tr><tr><td>wiki 内容优化</td><td>- 背景：实际体验中发现 wiki 内容无法提供细节上的帮助<br />- 方案：<br />    - 需求陪跑过程中调研团队内新/老同学的实际诉求<br />    - 细化 wiki 生成 skill，补充细节性描述</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 5pd<br />- 陪跑调研 1pd<br />- Wiki 内容调整 3pd<br />- 准确性验证 1pd</td><td></td><td>5pd</td><td></td><td></td></tr><tr><td rowSpan="2">资产准确率/覆盖率提升</td><td>商详卡片支持</td><td>- 背景：Q1 商详支持了部分场景</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 1pd</td><td></td><td>1</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 1pd</td><td>1pd</td></tr><tr><td>截图准确率/稳定性提升</td><td>- 背景：当前截图后缺少验证手段，存在部分因为黑屏、弹窗导致截图异常的 case</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 2pd</td><td></td><td>2</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 2pd</td><td>2pd</td></tr><tr><td>资产保鲜链路</td><td>保鲜链路</td><td>- 背景：当前资产无自动化保鲜链路，长期迭代后准确率会明显下降<br />- 方案：<br />    - 前期定期保鲜机制：串联 client、server，建立前期人工定期保鲜机制(人工定期进行脚本执行)<br />    - 后期保鲜链路</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a>  3~6pd<br />- 人工定期保鲜机制：1pd<br />- 卡片级保鲜链路：2pd(增量保鲜链路： 5pd)<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a>  2~5pd<br />- 截图卡片级保鲜链路 2pd (场景级保鲜链路 5pd)</td><td></td><td>5 ~ 11<br />by 卡维度  （非覆盖式）5pd</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 1pd<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 2pd</td><td>3pd</td></tr><tr><td>研发平台推广</td><td>研发平台的宣讲、推广、运营</td><td></td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 3pd</td><td></td><td>3pd<br />简单做</td><td></td><td></td></tr><tr><td>Oncall 场景支持</td><td>Oncall 场景支持</td><td>- 背景：<br />    - 扩展资产采集后的消费场景<br />    - follow 大团队整体建设 <a href="https://bytedance.larkoffice.com/wiki/DBQvwoPaKiSzAZkSBxwca9c7nNe">2026业务平台Ai建设思路&amp;方案</a><br />- 方案：<br />    - <a href="https://bytedance.larkoffice.com/wiki/DBQvwoPaKiSzAZkSBxwca9c7nNe">2026业务平台Ai建设思路&amp;方案</a></td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 4pd<br />- 知识库建设<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 3pd<br />- Skill 建设<br />- Skill 接入 oncall</td><td></td><td>7pd</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 6pd<br />- 知识库建设<br />- Skill 建设<br /><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> 1pd<br />- Skill 接入 oncall</td><td>7pd</td></tr></tbody></table>

---

## 评论 (3条)

### 评论 #1 — 涂昊天 · 2026-04-29 09:33
> 引用: "打通已有页面回放工具，接入 Aime 处理长尾问题 2pd"

  **涂昊天** · 2026-04-29 09:33: 新增事项，与当前已有的  打通
  **涂昊天** · 2026-04-29 09:36: 优势：
1. 能够辐射到同页面同业务身份其他卡片，降低不同卡片的切换使用成本
2. 借助页面回放工具快速接入 Aime，较低成本的覆盖长尾问题
3.  可复用oncall 场景的 skill

成本：
1. 在原有的工具中实现与卡片资产的互通、跳转等逻辑
2. 调优问答模板

**状态: 未解决**

### 评论 #2 — 涂昊天 · 2026-04-29 09:37
> 引用: "研发平台-场景工具优化"

  **涂昊天** · 2026-04-29 09:37: 删除事项：wiki。
不对当前的 wiki 进行大规模的调整，优先通过场景工具建设 + aime 问答解决用户问题。wiki 内容抽时间、看成本进行调优

**状态: 未解决**

### 评论 #3 — 涂昊天 · 2026-04-29 09:50
> 引用: "oncall 接入支持"

  **涂昊天** · 2026-04-29 09:50: 不再参与知识库相关建设，主要提供 oncall 流程、oncall接入相关的 支持
  **郭艳明** · 2026-04-29 09:52:  这个是不是你直接闭环了？
  **涂昊天** · 2026-04-29 09:53: 主要是对现有 oncall 流程、机器人接入、数据相关的一些事项，需要 提供一下支持
  **郭艳明** · 2026-04-29 09:53:  ok，那目标还是放你这边吧，他提供协助是吧

**状态: 未解决**
