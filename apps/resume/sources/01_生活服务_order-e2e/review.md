---
source:
  - "https://bytedance.larkoffice.com/wiki/Oo4vwRnGzibmPKkUiiZcC14Mnag"
source_title: "《E2E Q1 Review & Q2  规划》"
type: "document_snapshot"
summary: "E2E Q1 Review 与 Q2 规划。原文快照；目标、进展和实际结果按原文区分。"
---
# E2E Q1 Review & Q2  规划

## Q1 总结

### 效果展示

<table><colgroup><col/><col/><col/></colgroup><thead><tr><th>页面</th><th>功能描述</th><th>示意</th></tr></thead><tbody><tr><td>任务管理</td><td><ul><li>创建测试任务</li><li>查看任务进度</li><li>人工确认 diff 异常的 case</li></ul></td><td>创建任务<img name="image.png" alt="图片展示的是E2E测试平台中任务管理界面。界面显示了多个测试任务，包括Task ID、Name、Status、Job数量、负责人及操作按钮等信息。其中，任务“p2e_test_20240418_103034”处于“待确认”状态，其右侧有“确认”按钮。弹出的“批量确认测试任务”窗口中，有“测试任务ID”输入框，已输入“p2e_test_20240418_103034”，下方有“取消”和“确认”按钮。该图片与文档中任务管理功能描述相关，直观呈现了任务确认操作界面。" mime="image/jpeg" scale="1.000000" src="MQDibkwvYoJUT4xEwAzcbcdXnkc"/><br/>任务详情<img name="image.png" alt="该图片为测试任务详情界面，对应任务管理功能中的任务详情板块，该板块是任务管理功能里需人工确认diff异常case的相关内容。界面左侧显示了task标识（task_27181564778848aed82d3628）以及任务执行的相关信息列表，中间和右侧区域分别展示了待确认的任务卡片内容，卡片包含相关内容与操作按钮，契合上下文里任务管理功能中人工确认diff异常case的需求。" mime="image/jpeg" scale="1.000000" src="Ng4Ob6CLcon9eTx4Q1LcTHhwndf"/><br/>待确认<img name="image.png" alt="这张图片展示的是E2E Q1效果展示中任务管理功能的示意界面，对应任务管理模块里的创建任务、任务详情及待确认相关内容。界面左侧是任务列表，显示了多项任务条目；右侧主区域分上下两部分，上半部分呈现任务相关的步骤与日志信息，下半部分展示了两张“订单取消”相关的界面截图，用于辅助说明任务管理功能的实际展示效果。" mime="image/jpeg" scale="1.000000" src="NFRxb91IjoPaMmxDwbCcg0zGnhe"/></td></tr><tr><td>流水线原子节点</td><td><ul><li>流水线原子节点</li><li>消息通知</li></ul></td><td vertical-align="top"><img name="image.png" alt="图片展示的是E2E任务流水线界面。上方显示任务编号、状态、创建人等信息，有“复制测试”“飞书通知”等操作选项。下方是流水线原子节点列表，包含“Prepare”“Execute”“Loop”等节点，其中“Loop”节点被红色框突出显示。该图片与文档中“流水线原子节点”内容相关，直观呈现了E2E任务流水线的界面及关键节点情况。" mime="image/png" scale="1.000000" src="JHn9b8FDqocJuMxoMmnc7CWdnoc"/><img name="image.png" alt="该图片是交易C订单测试的通知界面，显示了两条由BytePipeline Bot发送的订单E2E测试通知。上方通知标题为“[Job]失败-订单E2E测试”，标注了失败原因为订单E2E测试执行的crontab任务失败，附带了具体的crontab详情链接，还提供了失败相关的任务ID与流水线链接；下方通知标题为“[Job]成功-订单E2E测试”，对应任务与流水线信息，标注了prod环境，清晰呈现了该订单测试任务的执行结果与核心关联信息。" mime="image/png" scale="1.000000" src="GjazbD2KDoazY5xWDVMc4BQEngd"/></td></tr><tr><td>异常拦截</td><td></td><td><img name="image.png" alt="这张图片展示了两款移动端APP的交易成功页面，左侧页面顶部显示状态为“online”，右侧页面顶部标注了“pps_it_order”的字样。两款页面均以白色为底色，顶部明确显示“交易成功”的标题，页面下方呈现了不同的交易相关内容，左侧页面包含优惠券、门店名称等交易相关信息，右侧页面则展示了交易的详细相关条目。该图片位于E2E Q1 Review&amp;Q2规划文档的Q1总结的效果展示部分，用于呈现异常拦截相关的界面示例，辅助说明对应功能的效果。" mime="image/png" scale="1.000000" src="WquHbl5yHohmsox8T2RcMyYinWd"/><ul><li>测试 MR：https://bits.bytedance.net/devops/325918412802/develop/detail/2255746/change/3411584?devops_space_type=server_fe</li></ul></td></tr></tbody></table>

### 方案概述

### 总结

数据

<table><colgroup><col/><col/><col/></colgroup><thead><tr><th>指标</th><th>计算方式</th><th>当前数据</th></tr></thead><tbody><tr><td>业务身份覆盖度</td><td><latex>\frac{覆盖的业务身份}{订单页面所有的业务身份(基于埋点)}<br/></latex></td><td>100%<blockquote><p>和资产上翻复用相同的测试数据</p></blockquote></td></tr><tr><td>云真机执行完成率</td><td><latex>\frac{执行成功任务数}{单次执行总任务数}<br/></latex><blockquote><p>执行完成：云真机执行成功，截图成功，UI Diff 有结果</p></blockquote></td><td>40% 左右<blockquote><p>多次重试后可以达到 95% 以上</p></blockquote></td></tr><tr><td>通过准确率</td><td><latex>\frac{结论准确任务数}{执行成功任务数}<br/></latex></td><td> 97%<br/>1 -  (2 / 75)<br/>主要问题：白屏</td></tr><tr><td>噪音率</td><td><latex>1- \frac{结论准确任务数}{待人工确认任务数}<br/></latex></td><td>73%<br/> 1 - （16 / 59）<br/>主要问题<ul><li>设备尺寸不一致，导致截图有差异</li><li>缺少白屏检查，白屏截图作为 UI Diff 数据，结果不正确</li><li>AI promot 需要优化，需要忽略设备状态栏的差异</li><li>ppe 环境部分接口超时，导致商品标签没有下发（待确认）</li></ul></td></tr></tbody></table>



## Q2 规划

### 现状

问题

<table><colgroup><col/><col/><col/></colgroup><thead><tr><th>目标</th><th>具体描述</th><th>解法</th></tr></thead><tbody><tr><td>稳定性低，执行时间长</td><td><ul><li>真机设备限制最多 20 台，且设备在生活服务下共享，容易卡在设备调度上</li></ul></td><td><ul><li>使用 android 模拟器作为真机补充</li></ul></td></tr><tr><td>结果噪音大</td><td><ul><li>设备尺寸不一致，导致截图有差异</li><li>缺少白屏检查，白屏截图作为 UI Diff 数据，结果不正确</li><li>AI promot 需要优化，需要忽略设备状态栏的差异</li></ul></td><td><ul><li>使用相同设备截图一个任务不同环境</li><li>增加白屏检测</li></ul></td></tr><tr><td>缺少保鲜手段，</td><td></td><td><ul><li>和资产上翻一起考虑</li><li>定时任务</li><li>结合研发流程，在流水线节点确认</li></ul></td></tr></tbody></table>

预约需求（低端机兼容问题）

<cite type="user" user-id="ou_48947e199bcb3b0649165bfe0db1eb90" user-name="来铧敏"></cite> <cite doc-id="D79Mwbp5fiE67kkviNYc6OVDnde" file-type="wiki" title="26FY Q2 OKR" type="doc"></cite>

- 埋点：`engage_page_show`
- page_name = step1 step2 step3

<table><colgroup><col/><col/><col/><col/><col/></colgroup><tbody><tr><td></td><td>接口抓包</td><td>schema</td><td></td><td> gecko </td></tr><tr><td>预约第三步在抖音版本&lt;=27.0.0时候打开白屏</td><td><ul><li>/data/v1/life/trade/book/get_book_confirm_info/</li></ul><br/>https://bits.bytedance.net/anywheredoor/scene/1157716907191406?appId=1128&amp;nodePath=1091572112302550-1065200912465547</td><td>aweme://lynxview/?hide_nav_bar=1&amp;trans_status_bar=1&amp;is_life_poi=1&amp;channel=poi_lynx_trade_reserve&amp;dynamic=1&amp;use_gecko_first=1&amp;select_count=1&amp;loader_name=forest&amp;bundle=third_step%2Ftemplate.js&amp;surl=https%3A%2F%2Flf-normal-gr-sourcecdn.bytegecko.com%2Fobj%2Fbyte-gurd-source-gr%2Faweme%2Fpoi%2Flynx%2Fpoi_lynx_trade_reserve%2Fthird_step%2Ftemplate.js&amp;poi_id=7288156120797939712&amp;order_id=1093008179689948112&amp;is_markup=1&amp;sale_channel=e_commerce.order_detail.default&amp;product_sub_type=0&amp;sku_id=1823840770628617&amp;start_time=1776787200000&amp;end_time=1777046400000&amp;prev_container_id=1F04E5B3-0174-416D-A447-E3701E934D2D&amp;pre_page=reserve_second_step&amp;is_single_store=1&amp;reserve_type=1&amp;enter_from=order_detail_page&amp;enter_method=click_instant_book&amp;product_id=1824362112841771&amp;product_type=12&amp;product_bizline=1&amp;product_category_id=8005001&amp;reserve_session_id=10930081796899481121775807105047&amp;privilege_text=%E5%85%8D%E8%B4%B9%E5%8D%87%E6%88%BF&amp;privilege_range=%E5%85%A5%E4%BD%8F%E6%9C%9F%E9%97%B4%E5%8F%AF%E4%BA%AB&amp;book_product_id=1823840770458649&amp;is_establish_contact_retention=0&amp;source_btm_token=a2552.b4823.c772931.d268611.1775807150897620</td><td><img name="image.png" alt="图片为一个二维码，位于文档中“现状”部分。该部分提到，目前在“客户关系管理”中，客户关系管理页面的“客户关系管理”标签下，有“客户关系管理”“客户关系管理（新）”“客户关系管理（新）（2024）”三个标签，其中“客户关系管理（新）（2024）”标签下有“客户关系管理（新）（2024）”“客户关系管理（新）（2024）（2024）”两个标签。此二维码可能用于获取相关资料或进行操作。" mime="image/png" scale="1.000000" src="AlHQbMmYVoxvcIxd3PKcoNljncf"/></td><td><img name="image.png" alt="图片展示的是抖音内测部署的离线部署信息界面。界面中显示Project为抖音内测部署，Channel为poi_lynx_trade_reserve，资源包为7616759281920098355全量。泳道信息为ppe_p428a0 +2。界面底部有一个二维码，标注“离线资源 扫一扫二维码”，并有“?”图标提示可扫码获取离线资源。该图片与文档中Q2规划现状部分的接口抓包内容相关，用于展示离线部署信息。" mime="image/jpeg" scale="1.000000" src="SN7WbVBGMo1K5zxxEEacTxdsnu8"/><br/>7616759281920098355<br/><a href="https://gecko.bytedance.net/pro/2d15e0aa4fe4a5c91eb47210a6ddf467/channels/poi_lynx_trade_reserve/overview">gecko.bytedance.net</a><br/>1324</td></tr><tr><td>鸿蒙的局部机型和版本导致</td><td></td><td></td><td></td><td></td></tr><tr><td>华为Mate系列用户且鸿蒙系统为4.2.0，进入预约第一步选门店页黑屏</td><td></td><td></td><td></td><td></td></tr></tbody></table>

<base_refer table-id="tbluQlrXqnqqbkiI" token="SLuvbVNKqa4IV1scVi2cl7tJnNc" view-id="vewVUcXi7l"></base_refer>



### 指标

### 目标

<okr cycle-id="7618073586285432440" cycle-name="2026 年 4 月 - 6 月" user-name="刘韬"><okr-objective objective-id="7626323450781224564" percent="0" score="0" status="unset"><p>质量建设：持续完善订单E2E拦截能力，保障能力落地并达成目标。</p><okr-progress><p></p></okr-progress><okr-key-result key-result-id="7626675522483064436" percent="0" score="0" status="unset"><p>持续治理订单E2E拦截能力，执行完成率 40% -&gt; 95%，失败噪音率 73% -&gt; 10%</p><okr-progress><p></p></okr-progress></okr-key-result><okr-key-result key-result-id="7626675727135510136" percent="0" score="0" status="unset"><p>在订单场景落地，UI 类问题线上漏放数 &lt;=1</p><okr-progress><p></p></okr-progress></okr-key-result><okr-key-result key-result-id="7626676276439125624" percent="0" score="0" status="unset"><p>在预约方向建设低端机兼容检测能力 /with<cite type="user" user-id="ou_48947e199bcb3b0649165bfe0db1eb90" user-name="来铧敏"></cite></p><okr-progress><p></p></okr-progress></okr-key-result></okr-objective></okr>





### 事项拆分

- 设备尺寸不一致，导致截图有差异
- 缺少白屏检查，白屏截图作为 UI Diff 数据，结果不正确
- AI promot 需要优化，需要忽略设备状态栏的差异
- ppe 环境部分接口超时，导致商品标签没有下发（待确认

<synced-source><table><colgroup><col/><col/><col/><col/><col/></colgroup><tbody><tr><td>事项</td><td>问题</td><td>具体事项</td><td>优先级</td><td>预估人力</td></tr><tr><td rowspan="2">减低噪音</td><td>设备尺寸不一致，导致截图有差异</td><td><ul><li>同一台设备</li></ul></td><td>P0</td><td>1</td></tr><tr><td>ppe 环境部分接口超时，导致商品标签没有下发（待确认</td><td><ul><li>数据回放后先做一轮接口 diff</li></ul></td><td>P0</td><td>1</td></tr><tr><td rowspan="3">云真机执行稳定性</td><td><ul><li>缺少白屏检查，白屏截图作为 UI Diff 数据，结果不正确</li></ul></td><td><ul><li>算法检测</li></ul><br/><cite doc-id="PMvxdFgpPotPrQx9vDlcfZ0RnMf" file-type="docx" title="基于字节基建的图片质检（黑白屏/异常弹窗）方案与架构设计" type="doc"></cite></td><td>P0</td><td> 2</td></tr><tr><td><ul><li>设备不足</li></ul></td><td><ul><li>使用 android 虚拟器作为补充</li></ul></td><td>P0</td><td>0.5</td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td>数据建设</td><td><ul><li>截图是否正确  -&gt;  云真机成功率</li><li>UI Diff 结果是否正确  -&gt;  噪音率</li></ul></td><td><ul><li>增加埋点</li><li>建设大盘</li></ul></td><td>P1</td><td> 2pd</td></tr></tbody></table></synced-source>