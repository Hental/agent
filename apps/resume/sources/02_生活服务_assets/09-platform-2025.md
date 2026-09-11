---
source:
  - "https://bytedance.larkoffice.com/docx/TIFxdp90lofVHCxnNWIclSKYn0e"
source_title: "《智能纪要：资产管理平台介绍 2025年4月16日》"
type: "meeting_summary"
summary: "资产管理平台介绍的智能纪要；不能单独证明实现或收益。"
---
> 会议主题：资产管理平台介绍
> 会议时间：4月16号（周三） 15:30 - 15:58 （GMT+08）
> 参会人：[@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) [@陈柏昆(chenbokun)](mailto:chenbokun@bytedance.com) [@何奔(heben)](mailto:heben@bytedance.com) [@李鑫(lixin.zheng)](mailto:lixin.zheng@bytedance.com) [@李杨韬(liyangtao)](mailto:liyangtao@bytedance.com) [@邱念(qiunian)](mailto:qiunian@bytedance.com) [@赵镇澜(zhaozhenlan)](mailto:zhaozhenlan@bytedance.com) [@钟嘉豪(zhongjiahao.09)](mailto:zhongjiahao.09@bytedance.com) [@朱凌霄(zhulingxiao)](mailto:zhulingxiao@bytedance.com) 
> 智能会议纪要由 AI 生成，可能不准确，请谨慎甄别后使用

# 总结

会议讨论了关于资产管理中卡片标准化和相关功能的使用方式及改进措施。具体如下：
- **卡片截图与保存**：
    - **自动截图与接口数据抓取**：平台可自动保存截图和抓取订单接口数据，无需手机截图。
    - **多个图片处理**：考虑与卡片ID关联，避免平铺，识别图片差异性并按时间规则保存。

- **场景梳理与提效**：
    - **现有方式**：手动梳理卡片场景，存在效率问题。
    - **改进建议**：在开发流程中加入场景录制环节，实现自动化。

- **测试商品与直播品**：
    - **测试商品需求**：缺少测试商品，影响研发逻辑测试。
    - **直播品区分**：通过字段判断是否为直播品。

- **卡片样式对比**：提议用新截图与之前截图做对比进行冒烟测试，被认为意义不大。
- **埋点方案**：技术侧增加埋点，沉淀信息以便复用，明确不同页面来源的标识，制定统一的质检或遵循业务规范。

> **[文档小组件]**
> - 类型: blk_605344f606400001a416289a
> - bizType: ai_notes
> - extra: {"sectionType":"summary","subScene":"meeting","sourceType":"meeting","sourceID":"7493809740377456668"}
> - protocolVersion: 1
> - styleType: 2

# 待办

- [ ] 在标准化模板梳理时加入埋点，以便后续沉淀和使用
- [ ] 刘韬把会议结论发到架构群里，以便大家明确要做什么，同时思考有没有 check 机制[@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com)

> **[文档小组件]**
> - 类型: blk_605344f606400001a416289a
> - bizType: ai_notes
> - extra: {"sectionType":"todo","subScene":"meeting","sourceType":"meeting","sourceID":"7493809740377456668"}
> - protocolVersion: 1
> - styleType: 2

# 智能章节

[00:00](https://bytedance.larkoffice.com/minutes/obcnws1gat24hafrqd3839x8?t=0)**  资产平台在卡片场景梳理中的使用及讨论**
> 本章节主要讨论资产平台在卡片场景梳理中的使用方式。提到平台可自动保存截图、抓取接口数据，能提高效率。还探讨了图片保存规则，如根据差异性及时间范围。在场景梳理上，认为标准化后可自动化，特殊场景需单独处理，建议开发者在开发流程中记录场景，同时梳理时可顺带保存已有场景。
[12:11](https://bytedance.larkoffice.com/minutes/obcnws1gat24hafrqd3839x8?t=731000)**  商品投卡、截图、测试商品及埋点方案讨论**
> 本章节主要讨论了方案模板相关内容，包括商品投卡截图、数据加工配置化、图片与 detail 卡联动等。还提及直播品区分方式。之后围绕卡片梳理录入程度、是否做截图对比测试展开交流，并重点探讨了埋点方案，强调技术或业务侧埋点要实时，规范上报，最后安排发结论到架构群及后续单拉会 。
[22:07](https://bytedance.larkoffice.com/minutes/obcnws1gat24hafrqd3839x8?t=1327000)**  会议结束**
> 会议结束
> **[文档小组件]**
> - 类型: blk_605344f606400001a416289a
> - bizType: ai_notes
> - extra: {"sectionType":"chapter","subScene":"meeting","sourceType":"meeting","sourceID":"7493809740377456668"}
> - protocolVersion: 1
> - styleType: 2

# 相关链接

- 会中共享的文档：[交易资产管理插件使用说明](https://bytedance.larkoffice.com/wiki/DU6DwPLjkievy1kVozacAssnnjc)
- 妙记：[资产管理平台介绍](https://bytedance.larkoffice.com/minutes/obcnws1gat24hafrqd3839x8?from=ai_minutes)
- 文字记录
    - [资产管理平台介绍 2025年4月16日](https://bytedance.larkoffice.com/docx/RJWudNFqIoHx4Zxt1CiceMnUnsf)