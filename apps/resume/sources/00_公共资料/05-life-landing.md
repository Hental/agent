---
source:
  - "https://bytedance.larkoffice.com/docx/KpB6duzbwo7KQlxIMGWcgeAlnVh"
source_title: "《生活服务 Landing》"
type: "document_snapshot"
summary: "生活服务 Landing。原文快照；目标、进展和实际结果按原文区分。"
---
[周报 - 刘韬](https://bytedance.larkoffice.com/wiki/ZShvwIckMijDM8kYXuEctK0ynTh)
[新人Landing任务 - 刘韬](https://bytedance.larkoffice.com/wiki/SInJwo2dIiPSbLkK22CcjAlNn8c?table=tblzwJRXfTn4POOs&view=vewz7oUzud)
[交易FE仓库&页面汇总(持续更新ing)](https://bytedance.larkoffice.com/wiki/YJbUwSQD4is9NnkxVANcFLainDb?table=tblzJYcIZ5t1KTUL&view=vew7sB3pOi)
[交易页面](https://bytedance.larkoffice.com/docx/DeW4d2r6DoJaWoxxxkPcYaVenge)
## 整体

![思维导图:\n- **生活服务**\n  - 业务\n    - 组织架构\n      - 商家@ou_a6b39a6d93202d00de2f0ca00e6db6bd\n      - 服务平台 @ou_07e075ff6ed7c9057dac38b3b1a2339d\n      - 算法 @ou_2c955dad5d0274282b32ff7d81c30abc\n      - C 端 @ou_fdcfa2135f8c73ba04984532236082df\n      - QA\n    - 产品\n      - ☆商品类型\n      - ☆行业\n      - ☆预定\n      - 特点\n    - 入口\n      - poi\n      - tab\n    - 页面\n      - 购前\n      - 订单\n      - 履约\n  - 技术\n    - 运行时\n      - 框架\n      - 二方库\n      - 三方库\n      - 页面\n    - 开发工具\n      - lynx-speedy\n      - HDT\n      - 任意门\n      - 埋点验证\n    - 数据\n      - libra\n      - 埋点\n      - 数据表\n      - 平台\n    - 稳定性\n      - ☆上线\n      - 监控\n      - 问题排查\n      - ☆事故](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/607eb25d-3263-4085-a91f-2ba581aafb02.png)

## 业务

> [C端交易业务串讲](https://bytedance.larkoffice.com/docx/EOP3dtxs7oGfsTx4evjcL4nRnlg)
> [生服服务用户问题和原声（for新人）-ONE PAGE](https://bytedance.larkoffice.com/docx/OMTadNiyZoGN8IxgzAGcC4Arn1b)
- 线下交易、核销

<table data-lark-table="docx-table" data-block-id="SdWkdG9lZomET9xeM8Zc2djUnGc"><thead><tr><th>分类</th><th>业务特点</th></tr></thead><tbody><tr><td>餐综</td><td>强依赖线下二维码核销<br />营销属性</td></tr><tr><td>酒旅</td><td>强依赖预订能力<br />依赖时间、库存、留资</td></tr><tr><td>大交通</td><td></td></tr></tbody></table>

### 名词概念

<table data-lark-table="docx-table" data-block-id="GWqNdlCwPoQHc1x0asYcBUJbnLg"><tbody><tr><th>POI容器</th><td>包括锚点、POI详情页、评论等，是C端流程中的信息供给者；</td></tr><tr><th>交易</th><td>括商品详情页、支付前、支付后等一系列流程，是C端流程中和成单最直接相关的业务域；</td></tr><tr><th>同城</th><td>基于生活服务具有强地理位置关联性的特征，衍化而来的信息聚合业务；</td></tr><tr><th>直播</th><td>基于直播手段，完成用户的种草和消费转化。</td></tr><tr><th>商家端</th><td>单独的 B 端应用，对接生活服务商家，支持商家入驻以进行后续的商品接入抖音等操作。</td></tr></tbody></table>

![OcrrbLfb5oEQmixEOaUcYypjn3i](https://tosv.byted.org/obj/larkparser/lark_cache/c51aa87f83d42c16c503981c2422e78082eb3d199f4a2b62ba4a5c5b2caaa5da.png)

### 产品类型

[测试账号](https://bytedance.larkoffice.com/wiki/L2HZwGtSOiqiIAkE56ZcXSefncc)
[生服商品类型](https://bytedance.larkoffice.com/docx/GskMdTHBzogpDkxdsbwcZPFRnHe#Xw1Od2RlwopLwlxUN5WctMdtnfb)
<table data-lark-table="docx-table" data-block-id="HxBPd61GKo9Bf0xw4CBcD7sSn8N"><tbody><tr><td>餐饮(订单屏效里有很全的商品类型)/B端账号找<a href="mailto:dengwenyan@bytedance.com">@邓文燕(dengwenyan)</a></td><td><a href="https://bytedance.larkoffice.com/docx/MAOudj428oduN9xHvE2ce8A2nxh">14、【交易】订单详情页提升屏效</a></td></tr><tr><td>综合</td><td><a href="https://bytedance.larkoffice.com/docx/DQuAd24i8ogs8zxZWmBcAKc3nle">综合 C 端百宝箱</a></td></tr><tr><td>旅行社</td><td><a href="https://bytedance.larkoffice.com/wiki/UN5Xwel83iPdbdk81BGcoFPsnIl">旅行社&amp;大交通测试商品</a></td></tr><tr><td>大交通</td><td><a href="https://bytedance.larkoffice.com/wiki/OBt7wTOOdiyhZBk6FI4cyNjnnTh">机票二期闭环履约-测试环境&amp;数据准备</a></td></tr><tr><td>住宿</td><td><a href="https://bytedance.larkoffice.com/wiki/GxQwwgJoeirGtIkWcFBciHtPnXb?source_type=message&amp;from=message">住宿C测试白皮书</a></td></tr><tr><td>景区测试商品/B端账号</td><td><a href="https://bytedance.larkoffice.com/docx/M9rld31duoHV90xlFLUceONBnld">景区 C 端白皮书</a></td></tr></tbody></table>

product_type
<table data-lark-table="docx-table" data-block-id="Q8L4dyemWoHpG2xACxHcYSzenlf"><thead><tr><th>序号</th><th>类型</th><th>说明</th></tr></thead><tbody><tr><th>1</th><td>GROUPON</td><td>团购活动</td></tr><tr><th>2</th><td>VIRTUAL</td><td>虚拟商品</td></tr><tr><th>3</th><td>PRESALE</td><td>预售券</td></tr><tr><th>4</th><td>HOTEL_HOME</td><td>民宿</td></tr><tr><th>5</th><td>SCENIC_TICKET</td><td>门票</td></tr><tr><th>6</th><td>TAKE_OUT</td><td>外卖</td></tr><tr><th>7</th><td>TRAVEL_FOLLOW_UP</td><td>旅行跟拍</td></tr><tr><th>8</th><td>SPU_TYPE_ONE_DAY_TRIP</td><td>一日游</td></tr><tr><th>9</th><td>HOUSE</td><td>售卖的房子</td></tr><tr><th>10</th><td>DCD</td><td>懂车帝</td></tr><tr><th>11</th><td>VOUCHER</td><td>代金券</td></tr><tr><th>12</th><td>PRESALE_V2</td><td>预售</td></tr><tr><th>13</th><td>BOOKING</td><td>预定<br />- (先买后约)<br />- (旅行社先买后约)<br />- (即买即订 - 日历票)<br />- (即买即订 - 日历房)<br />- (演出票务)<br />- (餐饮订座)<br />- (日历套餐)</td></tr><tr><th>14</th><td>DELIVERY</td><td>配送</td></tr><tr><th>15</th><td>TIMES_CARD</td><td>次卡</td></tr><tr><th>18</th><td>COMMON_EXCHANGE_COUPON</td><td>通兑券</td></tr><tr><th>22</th><td>ONLINE_BOOKING</td><td>预约预定 在线预约</td></tr><tr><th>28</th><td>PICK_UP_VOUCHERS</td><td>提货券</td></tr><tr><th>29</th><td>PREPAID_CARD</td><td>储值卡</td></tr></tbody></table>

### 行业

<table data-lark-table="docx-table" data-block-id="D3oedrVIYoDgJRxo9r1cG8jHnkv"><thead><tr><th>行业类型</th><th>说明</th></tr></thead><tbody><tr><td>☆food</td><td>餐饮行业</td></tr><tr><td>☆general</td><td>到店综合</td></tr><tr><td>☆trip</td><td>酒旅行业</td></tr><tr><td>deliver</td><td>外卖</td></tr><tr><td>marketing</td><td>营销</td></tr><tr><td>outside</td><td>多端</td></tr><tr><td>homed</td><td>家装</td></tr></tbody></table>

### 测试账号

[测试账号](https://bytedance.larkoffice.com/wiki/L2HZwGtSOiqiIAkE56ZcXSefncc)

## 技术

### 数据模型

<table data-lark-table="docx-table" data-block-id="KUsWdeQXDoLeu3xqAQ6c0usvnKf"><tbody><tr><th>商品</th><td><a href="https://bytedance.larkoffice.com/wiki/wikcnYat1R6eAiiyMjCoL0FZm9c">【生服】商品中台接入</a><br /><a href="https://bytedance.larkoffice.com/wiki/wikcnF9OPLkLV6iMqOdDCQKFGjd">商品域数据模梳理</a></td></tr></tbody></table>

### 后端服务

> **[文档小组件]**
> - 类型: blk_631fefbbae02400430b8f9f4
> - data: sequenceDiagram
  fe->>netlink: http request
  netlink->>server: rpc
  server ->> netlink: data
  netlink ->> fe: json

> - theme: default
> - view: codeChart

- netlink 把前端的 http 请求转换成 rpc 请求，请求后端服务，[参考文档](https://cloud.bytedance.net/docs/netlink/docs/6428623436e28302ec0ecbfc/669dfde330efb302ea8c77cf?x-resource-account=public)
- 后端服务按照 idl 协议解析请求，返回数据给前端
- Idl 协议遵循 [bam 规范](https://cloud.bytedance.net/docs/bam/wiki/doccnKswJf6FFPIEokh5qV?x-resource-account=public)
- 后端服务链路参考 [C端交易技术资产汇总](https://bytedance.larkoffice.com/wiki/RZnswehMxiLFbvk2cqFctaYvnTh)

<table data-lark-table="docx-table" data-block-id="A6uodGjQuoRpPFxTUW9c8zK0nQh"><tbody><tr><th>域名</th><td>https://api.amemv.com</td></tr><tr><th>netlink</th><td>https://cloud.bytedance.net/netlink/main/namespace/insert-manage?ns=3439&amp;sdmwc_domain=aweme.snssdk.com&amp;sdmwc_resolution_servername_id=26786&amp;sdmwc_selecting_servername_id=26786&amp;sdmwc_visible=1&amp;show_type=domain&amp;x-resource-account=public</td></tr></tbody></table>

<table data-lark-table="docx-table" data-block-id="QYmadZX54o96qjxdB1ecAxvJnxw"><thead><tr><th></th><th></th><th>psm</th><th>netlink</th><th>idl</th><th>codebase</th></tr></thead><tbody><tr><td>提单</td><td>http api</td><td>data.life.trade_prepare</td><td>https://cloud.bytedance.net/netlink/main/global/service-detail/data.life.trade_prepare</td><td>https://code.byted.org/cpputil/service_rpc_idl/tree/master/data/life/trade/data_life_trade_prepare.thrift</td><td>https://code.byted.org/life/trade_prepare?</td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>订单</td><td>http api</td><td>data.life.trade_order_api</td><td>https://cloud.bytedance.net/netlink/main/global/service-detail/data.life.trade_order_api</td><td>https://code.byted.org/cpputil/service_rpc_idl/tree/master/data/life/trade/data_life_trade_order_api.thrift</td><td>https://code.byted.org/life/trade_order_api?</td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>商品详情</td><td>http api</td><td>data.life.trade_product</td><td>https://cloud.bytedance.net/netlink/main/global/service-detail/data.life.trade_product</td><td>https://code.byted.org/cpputil/service_rpc_idl/blob/master/data/life/trade/data_life_trade_product.thrift</td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>

[【说明文档】BAM 接口代码生成工具（ @byted-arch-fe/bam-code-generator）（前端技术栈）](https://bytedance.larkoffice.com/docx/MgEIdIBdAoXt8ox2ABbcDQLfnBb)
### 前端技术栈

[团队技术栈](https://bytedance.larkoffice.com/wiki/WsUTwlHN6igaBykhemlcDDuEnVe)
![```mermaid\nflowchart TD\n    subgraph o1_63 \["客户端"\]\n        subgraph o1_64 \["AnnieX 容器"\]\n            subgraph o1_93 \["Lynx 运行时"\]\n                o1_94(\["Lynx 页面"\])\n                o1_96\["JSB"\]\n            end\n        end\n    end\n```](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/5021f6ae-7d79-4830-9763-69ee16e5fd09.png)

### 数据埋点

- BTM: [BTM 介绍](https://bytedance.larkoffice.com/wiki/wikcnEgNU66XbmqcMUdm33me0vg)
- https://data.bytedance.net/aeolus?from=coral#/dataQuery?appId=1000821&sid=2915144
- 数据上报
    - [@byted-poi/tracker使用文档](https://bytedance.larkoffice.com/wiki/wikcn0VFqVbcIJHN7AbmkSAmy7g)
    - 上报常规埋点到Tea，优先使用sendPoiLog，不能用则使用sendLogV3

### quark

> 动态组件加载方案
技术设计
组件加载：lynx 动态组件
https://lynx-doc.cn.goofy.app/docs/frontend/speedy/dynamic-component
数据下发：

接入文档

## 工作流程

[生活服务交易FE团队工作流程&规范](https://bytedance.larkoffice.com/wiki/J0Mnw9xYmi40KSkVE8JcpaBunWc)
<table data-lark-table="docx-table" data-block-id="OI9GdoC3qoJJw5xhOUVcYGQOndg"><thead><tr><th>meego</th><th>https://meego.larkoffice.com/local_services/story/homepage</th></tr></thead></table>

<table data-lark-table="docx-table" data-block-id="H6Cidc7yjo78jCxdulzcfTPRnsf"><tbody><tr><th>定容</th><td>确定人力</td></tr><tr><th>技术方案</th><td><a href="https://bytedance.larkoffice.com/wiki/CiJ8wBXglikz3XkrdkEc1JDAnAe">Q4 技术方案</a></td></tr><tr><th>开发</th><td><a href="https://annie.bytedance.net/docs/tools/hdt/introduction/what-is-hdt/">hdt</a></td></tr><tr><th>联调</th><td></td></tr><tr><th>提测 + CR</th><td><a href="https://bytedance.larkoffice.com/wiki/IweBwv0xniYqXvki1hJcppJgnch">CR规范和效果评估</a></td></tr><tr><th>上线</th><td><a href="https://bytedance.larkoffice.com/wiki/Z0XRwnANpiKOrgkzkcccZEjEngc">用户平台发布窗口说明</a><br /><a href="https://bytedance.larkoffice.com/wiki/Uk7owSF3ViICkmkIsuDcClRqnFb">交易-FE【发布】流水线介绍</a></td></tr><tr><th>稳定性</th><td><a href="https://bytedance.larkoffice.com/wiki/MI90wV7eSiZ5q2kjvmkcCDUFnid">报警处理SOP</a><br /><a href="https://bytedance.larkoffice.com/wiki/QOkNwQtTSika0lkl8htcx2Uxnpg">稳定性&amp;工具平台</a></td></tr><tr><th>数据埋点</th><td><a href="https://bytedance.larkoffice.com/docx/VqSSd7zr9ox0XdxRdZvcuARXnBf">实验分析入门分享 2024年12月4日 - 智能纪要</a><br /><a href="https://bytedance.larkoffice.com/docx/UoAIdF9A4oThq9x4aMqcPDa9nhb">ab实验标准流程和常见问题排查</a><br /><a href="https://bytedance.larkoffice.com/docx/doxcnl8wQTSJsRv9yp7HaXXmMNg">【生活服务】C端 AB实验流程</a></td></tr><tr><th>实验</th><td><a href="https://bytedance.larkoffice.com/wiki/wikcnTibjKQPRTgY8djj8WmwYAe">人人都是数据分析师</a></td></tr></tbody></table>

## 团队

[团队周报](https://bytedance.larkoffice.com/wiki/Z75VwKt58i9ux0knH8Kc9QVFngc?preview_comment_id=7439573840228057092)
- 团队成员 20人 [交易C前端找人地图(Q3)](https://bytedance.larkoffice.com/docx/KEzHdz278o5Umyxea0tc5rxZnXc)
    - 杭州 10 人
    - 成都 10人

### 合作

<table data-lark-table="docx-table" data-block-id="H0XddpcL7oyBKtxFv0ecjLF0nIe"><tbody><tr><td>后端</td><td>netlink</td><td>https://cloud.bytedance.net/netlink/main/namespace/insert-manage?domain_search=%7B%22fuzzySearch%22%3A%22api.amemv.com%22%2C%22compositionSearch%22%3A%7B%7D%7D&amp;ns=3439&amp;search=%7B%22compositionSearch%22%3A%7B%22domain%22%3A%22api.amemv.com-default%22%7D%7D&amp;show_type=domain&amp;tdm_domain=api.amemv.com&amp;tdm_host_group_tag=TNC-1128-api_normal&amp;tdm_servername=26786&amp;tdm_visible=1&amp;tnc_tab=domain-converge&amp;x-resource-account=public</td></tr><tr><td></td><td>tce</td><td><a href="https://cloud.bytedance.net/tce/services/1654021?cluster-type=cluster&amp;module=cluster&amp;page=1&amp;page_size=10&amp;x-resource-account=public">data.life.trade_order_api</a></td></tr><tr><td></td><td>scm</td><td><a href="https://cloud.bytedance.net/scm/detail/192354/versions?x-resource-account=public">life/trade/order_api</a></td></tr><tr><td></td><td>codebase</td><td>https://code.byted.org/life/trade_order_api?</td></tr><tr><td>client</td><td></td><td><a href="https://bytedance.larkoffice.com/wiki/wikcnVWFfL2RUAEdQ9IANSUdJGf">POI容器新人文档</a></td></tr></tbody></table>

## onepage

![!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/13be329c128fff58d3cfc31f36b4bae62e0370251c141316e3cc49add2e6c372.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/bcd524cfe3074eb54aa641e35079f6a08f8c6f417f8ddf6a08ccb4edf3e5ef51.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/1aeec1f11d505d4d029425c52a7f5e427c8462a5f395d1939ad0e2b79228847f.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/edb9618504003ac4d3506f6357a966839ea10ddc280cc3dfabda9b4ad7813847.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/77a4fb436c5f4d7ae983530fb9eff6566fa7861026b87b559c6825bd115088dc.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/bc6779d3a10f7ce2a54efe2c6937491fc0c6240a88552b4e62cd58b887cac9f2.jpg)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/94fb5f3843b9213b260761b5a955e738d5671340125f241f840188c50f14a8c7.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/aa23f52face4fdf46e1b90cbf891032277b40ab6fead638b190fd21632d82b65.png)\n\n> 搜索\n\n> PoI货架\n\n> 复购\n\n> 直播间\n\n> 收藏\n\n> 私信\n\n> 商品详情页\n\n> 商家主页\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/7376643231c1c2f990a5e4674656e9f8ec9b33056aab80035c16d855a24e2017.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/91b3dffd586bc058d6625abeac34f50b5a5e246b3034a4a34b1f826f6398a2be.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/1ab9de9e96da2df628e041d164520c527229db9f370ca2efc6f736664a4d2bff.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/7b14315c11b92ccfdb883fc4561f3bfdf224e0f197ab25c1264d62568c34d0e3.png)\n\n> feed\n\n> tab\n\n> 搜索\n\n> 用户二次分发\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/1a8906aad3425d30456c8338300c682379dc71bc7b33ed61ce8aa390ef4f2115.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/1b5f31dfb30313a6f4c9e5ea435169da81f4f0242fb66d46fe2f3c5a02900810.png)\n\n!\[图片\](https://tosv.byted.org/obj/larkparser/lark_cache/494235b56b7f7cef67a927903293f1202ed61898cc45a71b208780a3eb7bb241.png)](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/bf37ed41-4fa7-4d39-b81b-3a27f440069d.png)

<table data-lark-table="docx-table" data-block-id="QsqrdlJn2owBlqxt8LVcMxKYncd"><thead><tr><th>业务</th><th></th><th></th><th></th></tr></thead><tbody><tr><td>流量</td><td>视频锚点</td><td><a href="https://bytedance.larkoffice.com/wiki/wikcn4KjNmTIT0h95YAFdgaBQEc">生活服务视频OnePage</a><br /><a href="https://bytedance.larkoffice.com/wiki/wikcned56zU9SiVDcUKUdpHCxhc">直播&amp;视频前端团队介绍</a></td><td></td></tr><tr><td></td><td>直播</td><td></td><td></td></tr><tr><td></td><td>独立卡</td><td><a href="https://bytedance.larkoffice.com/wiki/Ll6AwQTUQivNjQkjhu1c5mt8noc">独立卡前端介绍</a></td><td></td></tr><tr><td></td><td>搜索</td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td>商城</td><td>频道/货架</td><td><a href="https://bytedance.larkoffice.com/wiki/HL2tw1PxFitrlMk72zQcN4f5nQg">商城前端Onepage</a></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/0c0ae1b8f4743c2f40921cd163518eda74628d20780e321b5da4cd809e55b9aa.png" alt="TjoRbw3e6oLx3uxtSCvcddarnOe" /></td></tr><tr><td></td><td>POI</td><td></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/454eca95a50da0c7dfd4fc4d5520ed7b4335d932c72a567ec75dd7a269b3fbb1.png" alt="ANNDbwNJTowu1Tx84Q8cNWb3n4e" /></td></tr><tr><td></td><td>商家橱窗<br />商家抖音号</td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td>交易</td><td>提单/订单</td><td><a href="https://bytedance.larkoffice.com/wiki/RxW2wPhvEipYDckRYdmcwRsKnnh">商品详情OnePage</a></td><td></td></tr><tr><td></td><td>购买完成<br />核销完成</td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td>用户增长</td><td></td><td></td><td></td></tr><tr><td>营销</td><td></td><td></td><td></td></tr></tbody></table>

商城
<table data-lark-table="docx-table" data-block-id="V3PidD07Mo0DGjxKTgpcL7ZinBh"><tbody><tr><td colSpan="4">同城tab</td><td colSpan="7">流量分发</td></tr><tr><td>tab名称</td><td>城市切换</td><td>气泡</td><td>文字红点</td><td colSpan="2">工具区</td><td colSpan="2">频道区</td><td>拓展区</td><td colSpan="2">内容区</td></tr><tr><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/4b5ef5c00a856eaabd45aa838d330bfee319d7131e3edee1aec1d3bebfed5ad8.png" alt="WjOYbVf43ohEBDxudq9cRrgMnRS" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/6df22e4dc84bda241476e98c9640b16075dcdb966ba35e2181e57105ecebb05e.jpg" alt="LGawbSKiRok7ZHxxg99cHQYanAb" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/525cd2e5976084530921610c3b0f0d746e7340dccceb50b6bd493ee004caad98.png" alt="Ff0Rb5iDooWdIDxdxM9cijgxnug" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/2b0fe2923a504c77bb27648783fa93d9c138940a539447b5a982ea3873a513a3.png" alt="BR18bJYJXo6pjpxFMePc4d7MnBg" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/e88c741e6c9beb36c5e9a0a31112e78e89e4c4f3df8221cf070ed69477040bd4.png" alt="I9iybCzTsoOWHjxhsa9c4JZ9nGd" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/118fdb6032354b25442d383fde0598147ad45860a86f3d66c5ba2f74550a3834.png" alt="YiT7bLfaPoruqDxkwEjcP1axn9e" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/2d10e583b2906ac30e7de98d49a192c7abaa0523246e95f899ca40c52691c445.png" alt="OzsLbMQf4oDBycxNTmLc5Uoxn2g" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/5499db823e687030b6e9492e37480af410d72a1c8bc240f65798b7837892bfae.jpg" alt="KdYQbFQ1EouXlAxqtwxcwdjLnue" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/186bf55f3a4d053b1e8de73961bea2b9e914c12efec161ce9f860158787c1aa8.png" alt="UuIDbZWaMopIEoxfUpOc3obanab" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/2a53b4f08a2ed377cc9684812f6ca96b3422a872aa90c9f91cf9a1d9201d3563.png" alt="RvNZbzQc7oalf5xRcgEc0qusnrd" /></td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/50fcb2fc99451ad206dd8350521a343edd7b33756e6ad7a9a807c3c0cebb4bbd.png" alt="ENQPbygrKosO2PxXJp8cObNVnzc" /></td></tr></tbody></table>

B 端
<table data-lark-table="docx-table" data-block-id="NtTQdEXcdoaiGtxPnDVcKRPhnlh"><thead><tr><th>业务</th><th></th><th></th></tr></thead><tbody><tr><td>商家</td><td></td><td><a href="https://bytedance.larkoffice.com/wiki/V7nMw7qkli9ytFkjXgdc5IzCnZd">商家-新人landing文档</a><br /><a href="https://life.douyin.com/p/settle">抖音来客</a></td></tr><tr><td></td><td></td><td></td></tr><tr><td>达人</td><td></td><td><a href="https://bytedance.larkoffice.com/wiki/wikcnjfQBYWqLKfz8SeEtfHOzvg">达人团队研发新人landing文档</a><br /><a href="https://bytedance.larkoffice.com/wiki/wikcnkibRB3gEmzzuCIeQ8kIWbh">撮合货找人方向OnePage（WIP）</a><br /><a href="https://bytedance.larkoffice.com/wiki/wikcnA6SohD7FSAbeskTwTGQNyy">达人撮合入口OnePage</a></td></tr><tr><td>业务支撑</td><td></td><td><a href="https://bytedance.larkoffice.com/docx/DavZdoCXToz0OSxSCXscb20xnob">【DA视角】生活服务交易产品One-Page（持续更新）</a><br /><a href="https://bytedance.larkoffice.com/wiki/wikcnkMGSPf4sT3ImA9ENhfOLSe">商品域OnePage</a></td></tr></tbody></table>

## 问题

技术上
1. 不同行业、玩法下 UI 展示有差异，梳理成本高
- 收敛逻辑（working）
- 自动生成 schema + mock 数据 + 云手机 => 方便查看页面，减低梳理成本

1. lynx 开发效率低，缺少热更新
- 开发效能 rspeedy [Rspeedy 2024 Q3](https://bytedance.larkoffice.com/docx/RaQCde3owoUohPx2WUwclRapn3c) [Lynx Speedy 升级 Rspeedy 中会遇到的问题](https://bytedance.larkoffice.com/wiki/G5Cnw5VEii88KlkcPGxc5ctCnhc)
- 手机投屏到 mac  [手机投屏](https://bytedance.larkoffice.com/wiki/SCH0wbgFvi3d6Xk7Hldc3JLwnff#MnmxdrGzXo1LKbxMOeQcCYeGnug) scrcpy https://pia.bytedance.net/cn/debug/quick-start/mirror-to-desktop.html

1. 数据埋点
-

业务上
产品 x 行业 x 链路