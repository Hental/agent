## 基本信息

<table data-lark-table="docx-table" data-block-id="AbHtdgrRAoxsG4xStKdcNh25nxg"><thead><tr><th>项</th><th>信息</th></tr></thead><tbody><tr><td>项目参与人</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> <a href="mailto:laihuamin@bytedance.com">@来铧敏(laihuamin)</a> <a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> <a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td></tr><tr><td>日程</td><td>[Unsupported block: type=999, id=GXOadWrpWo4obLxjwktcs0WFnAh]</td></tr></tbody></table>

## 进展

[26年交易FE研发效能任务管理](https://bytedance.larkoffice.com/wiki/Pg24wCugQiQQ81keM5kc6eENnub?table=tblVo0BYqpR9kPiQ&view=vewSvYA34C)
### 3.16 周进展

#### 事项同步

#### 进展

- 页面信息采集 [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com)

> 事项节奏与短期目标：
> 3.6—client页面采集方案
> 3.15—完成页面信息采集
<table data-lark-table="docx-table" data-block-id="FyvvdcBEwoa49dx3bT0c60GInbz"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>页面信息人工校准<br />（基础信息）</td><td rowSpan="2"><a href="mailto:laihuamin@bytedance.com">@来铧敏(laihuamin)</a></td><td rowSpan="2">P0</td><td>基础信息除了图片都补充完了</td><td></td></tr><tr><td>页面信息人工校准<br />（业务身份信息）</td><td>业务身份- dolphin-页面模板-卡片关联关系，目前就只有初版<a href="https://bytedance.larkoffice.com/sheets/OcRSsvYCxhq6PqtHpnOc9VbAnAh?from=from_copylink">AI转化业务身份</a></td><td>还在和<a href="mailto:zongkaihua@bytedance.com">@纵开华(zongkaihua)</a> 确认中，目前问题比较多</td></tr></tbody></table>

- 卡片信息采集-代码信息 [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com)

> 事项节奏与目标：
> 1. 3.6 完成 codeGraph skill 建设  ✅
> 1. 3.10 进行部分代码仓库的录入 ✅
> 1. 3.17 跑通 landerx 接入链路，完成全量代码仓库的录入
> 1. 3.20 完成 wiki 生产 skill 建设，完成全量页面 wiki、卡片 wiki 的录入
> 1. 3.24 完成卡片二级页中 wiki 部分
>

<table data-lark-table="docx-table" data-block-id="ULOkdvtxAoj6SrxW4U7ctHHrnHc"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>~~跑通 landerx 容器部署~~</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>~~P0~~</td><td>~~100%~~</td><td></td></tr><tr><td>codeGraph skill 搭建</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>95%</td><td>生成的 codeGraph 在部分 import 中还存在问题，今天调试中</td></tr><tr><td>代码召回服务</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>90%</td><td>已开发完毕，本地调试中</td></tr><tr><td>代码召回能力联调</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>0%</td><td></td></tr><tr><td>Wiki skill 搭建</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>10%</td><td></td></tr></tbody></table>

- 卡片信息采集-截图信息 [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com)

> 事项节奏与短期目标：
> 1. 3.6    完成卡片采集逻辑的开发
> 1. 3.10  上线卡片补充埋点
> 1. 3.13  对接后端接口，跑通流程，采集一轮数据
> 1. 3.17  完成卡片预览组件的开发
> 1. 3.20  全量采集卡片数据（订单、提单、商详）
>
<table data-lark-table="docx-table" data-block-id="GoNhdoqVnoYkC5xBPPXcApB3nof"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>方案设计</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<br /><a href="https://bytedance.larkoffice.com/wiki/EHFvwx70fiJ3KhkxrRzcVL1anwX">【技术方案】交易研发资产卡片端到端采集 </a></td><td></td></tr><tr><td>开发 - 卡片采集逻辑的开发</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<br />当前进展：截图、卡片scene/router_key 在订单、提单下已跑通。</td><td>router_key 采集方案调整<br />- 旧方案：<br />    - ast 分析 router_key 和组件的关系<br />    - 采集时通过组件反查出 router_key<br />- 新方案：<br />    - 运行时组件标注 data-router_key<br />    - 采集时通过 dataset 获取</td></tr><tr><td>开发 - 卡片和业务身份关系</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<br />当前进展：提单、订单埋点已上线</td><td>- 提单、订单：通过埋点查询<br />- 商详：业务身份 -&gt; 商品 -&gt; 卡片<br />商详的 dito data，如果下发了 card，即可视为卡片曝光</td></tr><tr><td>开发 - 商详适配</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（20%）<br />本周目标：<br />- 适配商详页截图</td><td>- 存在风险</td></tr><tr><td>开发 - 对接后端接口</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<br />当前进展：接口已调通</td><td></td></tr><tr><td>消费：卡片预览组件</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（30%）<br />本周目标：完成开发</td><td></td></tr><tr><td>采集：提单、订单、商详</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（20%）<br />当前进展：录入订单数据中，进度约 30%</td><td></td></tr></tbody></table>

- 卡片信息采集-端到端信息 [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com)

> 事项节奏与短期目标：
> 1. 【已完成】采集技术方案评审
> 1. 【已完成】场景工具技术方案评审
> 1. 【已完成】 代码分析Agent架构开发 + 部署
> 1. 【已完成】 完成卡片 - CO字段关联关系采集能力建设
> 1. 3.20 完成卡片 - CO字段关联关系采集 & 场景工具服务建设
> 1. 3.24 完成** **场景二级页页面开发
>
<table data-lark-table="docx-table" data-block-id="VHO8dZVaJo4Ahqx67tFczdfcn9f"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>卡片 - CO字段关联关系采集完整能力</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>90%</td><td>1. 代码分析Agent：<br />    1. 基于DitoM数据源代码分析卡片 - CO关联关系能力建设完成；<br />    1. 基于仓库代码分析卡片 - CO关联关系能力依赖<a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> CodeGraph能力<br />1. 卡片 - CO字段关联关系采集：目前已生成一版全量卡片和CO关系，待<a href="mailto:zhubeiyi.1024@bytedance.com">@朱倍仪(zhubeiyi.1024)</a> 录入完成后绑定；</td></tr><tr><td>场景二级页工具</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>30%</td><td>1. 页面交互开发：原型页代码已迁移完毕<br />    1. 筛选交互<a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> ：待介入；<br />    1. CO工具<a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a> ：待介入；<br />    1. 卡片组件<a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> ：<br />1. 场景工具提取服务：searcher Agent依赖<a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> 提供CodeGraph召回能力，基础服务部署已完成，后续需要一定时间调优；</td></tr></tbody></table>

#### 总结

- todo：
    - [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com) 确认一下页面-业务身份采集进度
    - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) 确认一下 skill 调试进度
    - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com) 今晚再对一版召回服务进度

- 风险：
    -

### 3.10 周进展

#### 事项同步

1. 本周目标[里程碑&排期](https://bytedance.larkoffice.com/wiki/OkYnwS1BDieKiNkZgpZcpyODnff)：
    - 资产前后端整体采集上翻一版（保证研发流程所需资产）
    - 研发流程P0功能联调完成

#### 进展

- 页面信息采集 [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com)

> 事项节奏与短期目标：
> 3.6—client页面采集方案
> 3.15—完成页面信息采集
<table data-lark-table="docx-table" data-block-id="LkLEd5aeMoFT9KxXmyhcvxA0nHJ"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>页面信息人工校准</td><td><a href="mailto:laihuamin@bytedance.com">@来铧敏(laihuamin)</a></td><td>P0</td><td>基础信息今天能校准完<br />业务身份- dolphin-页面模板-卡片关联关系（当前还在产出数据）</td><td>可以后期投入</td></tr></tbody></table>

- 卡片信息采集-代码信息 [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com)

> 事项节奏与目标：
> 1. 3.6 完成 codeGraph skill 建设
> 1. 3.10 进行部分代码仓库的录入
> 1. 3.17 跑通 landerx 接入链路，完成全量代码仓库的录入
> 1. 3.20 完成 wiki 生产 skill 建设，完成全量页面 wiki、卡片 wiki 的录入
> 1. 3.24 完成卡片二级页中 wiki 部分
>
<table data-lark-table="docx-table" data-block-id="TL1UdvgEvofSYox4kGZcJVYKntb"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>~~跑通 landerx 容器部署~~</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>~~P0~~</td><td>~~100%~~</td><td></td></tr><tr><td>codeGraph skill 搭建</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>80%</td><td></td></tr><tr><td>代码召回服务</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>30%</td><td></td></tr><tr><td>代码召回能力联调</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>0%</td><td></td></tr></tbody></table>

- 卡片信息采集-截图信息 [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com)

> 事项节奏与短期目标：
> 1. 3.6    完成卡片采集逻辑的开发
> 1. 3.10  上线卡片补充埋点
> 1. 3.13  对接后端接口，跑通流程，采集一轮数据
> 1. 3.17  完成卡片预览组件的开发
> 1. 3.20  全量采集卡片数据（订单、提单、商详）
>
<table data-lark-table="docx-table" data-block-id="HyD0dmnkoovCyyxcsAcc4k7cnJg"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>方案设计</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<br /><a href="https://bytedance.larkoffice.com/wiki/EHFvwx70fiJ3KhkxrRzcVL1anwX">【技术方案】交易研发资产卡片端到端采集 </a></td><td></td></tr><tr><td>开发 - 卡片采集逻辑的开发</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<br />当前进展：截图、卡片scene/router_key 在订单下已跑通。</td><td>router_key 采集方案调整<br />- 旧方案：<br />    - ast 分析 router_key 和组件的关系<br />    - 采集时通过组件反查出 router_key<br />- 新方案：<br />    - 运行时组件标注 data-router_key<br />    - 采集时通过 dataset 获取</td></tr><tr><td>开发 - 卡片和业务身份关系</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（60%）<br />当前进展：提单、订单埋点已上线<br />本周目标：测试数据写入 boe 环境</td><td></td></tr><tr><td>开发 - 商详适配</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（10%）<br />本周目标：<br />- 适配商详页</td><td></td></tr><tr><td>开发 - 对接后端接口</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（80%）<br />当前进展：订单调通<br />本周目标：录入数据</td><td></td></tr><tr><td>消费：卡片预览组件</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>采集：提单、订单、商详</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr></tbody></table>

- 卡片信息采集-端到端信息 [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com)

> 事项节奏与短期目标：
> 1. 【已完成】采集技术方案评审
> 1. 【已完成】场景工具技术方案评审
> 1. 3.6 代码分析Agent架构开发 + 部署
> 1. 3.13 完成卡片 - CO字段关联关系采集能力建设
> 1. 3.20 完成卡片 - CO字段关联关系采集 & 场景工具服务建设
> 1. 3.24 完成** **场景二级页页面开发
>

<table data-lark-table="docx-table" data-block-id="HKNGdGbr8ozYsQxV2KocHH9LnTf"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>卡片 - CO字段关联关系采集完整能力</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>70%</td><td>1. 代码分析Agent：<br />    1. 基于DitoM数据源代码分析卡片 - CO关联关系能力建设完成；<br />    1. 基于仓库代码分析卡片 - CO关联关系能力依赖<a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a> CodeGraph能力<br />1. 卡片 - CO字段关联关系采集：<strong>依赖前置所有卡片、CO、DitoM页面采集完成，3.13有较大风险</strong></td></tr><tr><td>场景二级页工具</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>20%</td><td>本周无进展</td></tr></tbody></table>

#### 总结

- todo：
    - [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com) 与 client 确认 业务身份- dolphin-页面模板-卡片关联关系 的产出时间，后续同步风险
    - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) 3.11 提供代码召回服务与[@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com) 进行联调，后续同步联调过程中暴露的风险
    - [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) 与 server 确认 卡片-业务身份关联关系 数据的结构是否有误，后续同步这部分数据录入的进展

- 风险：
    - 卡片 - CO字段关联关系采集风险：前置依赖卡片、co、页面信息，周四双日会上确认进展，确认是否能够提供部分数据进行上翻保障里程碑 [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com)

### 3.2 周进展

#### 事项同步

1. 本周目标[里程碑&排期](https://bytedance.larkoffice.com/wiki/OkYnwS1BDieKiNkZgpZcpyODnff)：
    - 资产存储采集能力建设完成
    - 部分资产录入，支持检索（支持研发流程联调）

#### 进展

- 页面信息采集 [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com)

> 事项节奏与短期目标：
> 3.6—client页面采集方案
> 3.15—完成页面信息采集
<table data-lark-table="docx-table" data-block-id="WekodtiO4o0WVJxMyj4cXFjinch"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>页面信息人工校准</td><td><a href="mailto:laihuamin@bytedance.com">@来铧敏(laihuamin)</a></td><td>P0</td><td>暂无，等client方案</td><td>可以后期投入</td></tr></tbody></table>

- 卡片信息采集-代码信息 [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com)

> 事项节奏与目标：
> 1. 3.6 完成 codeGraph skill 建设
> 1. 3.10 进行部分代码仓库的录入
> 1. 3.17 跑通 landerx 接入链路，完成全量代码仓库的录入
> 1. 3.20 完成 wiki 生产 skill 建设，完成全量页面 wiki、卡片 wiki 的录入
> 1. 3.24 完成卡片二级页中 wiki 部分
>
<table data-lark-table="docx-table" data-block-id="DNHVd2HDeoqVKTx7WiqcbQVQn6f"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>跑通 landerx 容器部署</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>30%</td><td></td></tr><tr><td>codeGraph skill 搭建</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>20%</td><td></td></tr><tr><td></td><td></td><td></td><td></td><td></td></tr></tbody></table>

- 卡片信息采集-截图信息 [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com)

> 事项节奏与短期目标：
> 1. 3.6    完成卡片采集逻辑的开发
> 1. 3.10  上线卡片补充埋点
> 1. 3.13  对接后端接口，跑通流程，采集一轮数据
> 1. 3.17  完成卡片预览组件的开发
> 1. 3.20  全量采集卡片数据（订单、提单、商详）
>
<table data-lark-table="docx-table" data-block-id="Brn5dnGYPo1Z48xwL9fczZovn0f"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>方案设计</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<a href="https://bytedance.larkoffice.com/wiki/EHFvwx70fiJ3KhkxrRzcVL1anwX">【技术方案】交易研发资产卡片端到端采集 </a></td><td></td></tr><tr><td>开发 - 卡片采集逻辑的开发</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>当前进展：已完成卡片截图、卡片埋点，开发 router_key 采集<br />本周目标：<br />- 卡片埋点补充方案周四评审<br />- 适配商详页</td><td>router_key 采集方案调整<br />- 旧方案：<br />    - ast 分析 router_key 和组件的关系<br />    - 采集时通过组件反查出 router_key<br />- 新方案：<br />    - 运行时组件标注 data-router_key<br />    - 采集时通过 dataset 获取</td></tr><tr><td>开发 - 商详适配</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>开发 - 对接后端接口</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>采集：提单、订单、商详</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>消费：卡片预览组件</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr></tbody></table>

- 卡片信息采集-端到端信息 [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com)

> 事项节奏与短期目标：
> 1. 【已完成】采集技术方案评审
> 1. 【已完成】场景工具技术方案评审
> 1. 3.6 代码分析Agent架构开发 + 部署
> 1. 3.13 完成卡片 - CO字段关联关系采集能力建设
> 1. 3.20 完成卡片 - CO字段关联关系采集 & 场景工具服务建设
> 1. 3.24 完成** **场景二级页页面开发
>

<table data-lark-table="docx-table" data-block-id="TbTAdeU00oEBXUx6XoacpecnnV0"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>卡片 - CO字段关联关系采集完整能力</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>40%</td><td>1. 代码分析Agent：开发中，skill agent架构已建设完成，查询工具依赖CodeGraph能力；<br />1. 分析服务：复用DitoPixel原有域名 + 服务，PPE已部署；<br /><img src="https://tosv.byted.org/obj/larkparser/lark_cache/b19e9e380174e53a97432d7ee10a9d57b4d57c961178186a0db3e92e84c48019.png" alt="KG0tbdFgMokHsPxH34AcdbZ3nX8" /></td></tr><tr><td>场景二级页工具</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>20%</td><td>1. 页面开发：完成原型页面迁移至Dito仓库 + 跑通，后续基于原型页面进行迭代；<br /><img src="https://tosv.byted.org/obj/larkparser/lark_cache/239822b4e73d204ecd647355ad7b03d1269a417fb6ac5c9884094438f0265c10.png" alt="KeFubR8fpoLId7x0TVJctbXInAb" /><br />1. Vo - 字段关联关系提取Agent：复用代码分析Agent架构，新增skill，尚未开始</td></tr></tbody></table>

#### 总结

- 风险：
    - 各部分与[里程碑&排期](https://bytedance.larkoffice.com/wiki/OkYnwS1BDieKiNkZgpZcpyODnff)上排期的 gap
        - 代码信息采集：landerx 预计 3.13 才能进行联调接入，3.13 完成全量 codeGraph 的上翻有一定风险

- Todo:
    - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) 确认一下 codeGraph 的生产时间，是否能赶到 3.13 之前
    - [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com) 确认 3.13 是否需要上翻全量的资产信息

### 2.9 周进展

[智能纪要：资产信息上翻小周会 2026年2月9日](https://bytedance.larkoffice.com/docx/EU6KdNcm1o1X9OxLXJJcCp5hnvf?dcuId=6834386903116300290)
#### 事项同步

#### 进展

- 页面信息采集 [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com)

> 事项节奏与短期目标：
> 3.15之前—完成页面信息采集
<table data-lark-table="docx-table" data-block-id="CExndivTXoZy3wx1y60cWOYjnBb"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>页面信息人工校准</td><td><a href="mailto:laihuamin@bytedance.com">@来铧敏(laihuamin)</a></td><td>P0</td><td>暂无，等client方案</td><td>可以后期投入</td></tr></tbody></table>

- 卡片信息采集-代码信息 [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com)

> 事项节奏与短期目标：
> 1. 2.4 前完成需求推演与产品形态调整
> 1. 2.5 完成整体技术方案评审
>
<table data-lark-table="docx-table" data-block-id="NJP9dEDuao5x0KxWR2icPz1OnKd"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>codeGraph 生产技术方案</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>30%</td><td>采用电商 landerx 方案</td></tr></tbody></table>

- 卡片信息采集-截图信息 [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com)

> 事项节奏与短期目标：
> 1. 【已完成】采集的技术方案
> 1. 【已验证】卡片 H5 渲染
> 1. 【进行中】完成平台的技术方案，2.10 技术评审
>
<table data-lark-table="docx-table" data-block-id="AHJ6dfviooU9SwxZMMQcNdUsnqb"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>方案设计</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（100%）<a href="https://bytedance.larkoffice.com/wiki/EHFvwx70fiJ3KhkxrRzcVL1anwX">【技术方案】交易研发资产卡片端到端采集 </a></td><td></td></tr><tr><td>开发 - mock 数据采集</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>开发 - 截图采集逻辑</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>采集：卡片截图采集</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>加工：场景工具数据加工</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P1</td><td></td><td></td></tr><tr><td>消费：场景工具</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P1</td><td></td><td></td></tr></tbody></table>

- 卡片信息采集-端到端信息 [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com)

> 事项节奏与短期目标：
> 1. 2.4 完成采集技术方案评审
>
<table data-lark-table="docx-table" data-block-id="MqASdAgxroVJIxx4nmMcFX7LnMh"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>卡片端到端数据采集技术方案</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>20%</td><td>方案设计中，周三评审无风险</td></tr></tbody></table>

#### 总结

- 本周目标：
    - 2.4 进行采集技术方案评审
    - 2.5 进行二级页技术方案评审

- 风险：

### 2.2 周进展

#### 事项同步

1. 产品方案对齐 [资产平台-产品方案](https://bytedance.larkoffice.com/docx/BeCtdQgV9o96uvxyrFBcH0WLneE)
1. 目标内部 review

#### 进展

- 页面信息采集 [@来铧敏(laihuamin)](mailto:laihuamin@bytedance.com)

> 事项节奏与短期目标：
> 3.15之前—完成页面信息采集
<table data-lark-table="docx-table" data-block-id="IKc0djID6oIqD5xsl7mcrlRqnjd"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>页面信息人工校准</td><td><a href="mailto:laihuamin@bytedance.com">@来铧敏(laihuamin)</a></td><td>P0</td><td>暂无，等client方案</td><td>可以后期投入</td></tr></tbody></table>

- 卡片信息采集-代码信息 [@涂昊天(tuhaotian)](mailto:tuhaotian@bytedance.com)

> 事项节奏与短期目标：
> 1. 2.4 前完成需求推演与产品形态调整
> 1. 2.5 完成整体技术方案评审
>
<table data-lark-table="docx-table" data-block-id="XQz6da7vnosD8hxY1Egcr6pVn6e"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>codeGraph 生产技术方案</td><td><a href="mailto:tuhaotian@bytedance.com">@涂昊天(tuhaotian)</a></td><td>P0</td><td>30%</td><td>采用电商 landerx 方案</td></tr></tbody></table>

- 卡片信息采集-截图信息 [@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com)

> 事项节奏与短期目标：
> 1. 完成技术方案，2.4 完成采集技术方案评审
>
<table data-lark-table="docx-table" data-block-id="GaJWdi6eBoo3uZxdZ7UcdojUnQd"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>方案设计</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td>（10%）方案设计中，思路<br />- 数据：接口回放<br />- 渲染：任意门 mock</td><td></td></tr><tr><td>开发 - mock 数据采集</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>开发 - 截图采集逻辑</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>采集：卡片截图采集</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P0</td><td></td><td></td></tr><tr><td>加工：场景工具数据加工</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P1</td><td></td><td></td></tr><tr><td>消费：场景工具</td><td><a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a></td><td>P1</td><td></td><td></td></tr></tbody></table>

- 卡片信息采集-端到端信息 [@张泰豪(zhangtaihao)](mailto:zhangtaihao@bytedance.com)

> 事项节奏与短期目标：
> 1. 2.4 完成采集技术方案评审
>
<table data-lark-table="docx-table" data-block-id="D70Sdiv3zolaqVxV0SicEj9cnqe"><thead><tr><th>事项</th><th>跟进人</th><th>优先级</th><th>进展</th><th>备注</th></tr></thead><tbody><tr><td>卡片端到端数据采集技术方案</td><td><a href="mailto:zhangtaihao@bytedance.com">@张泰豪(zhangtaihao)</a></td><td>P0</td><td>20%</td><td>方案设计中，周三评审无风险</td></tr></tbody></table>

#### 总结

- 本周目标：
    - 2.4 进行采集技术方案评审
    - 2.5 进行二级页技术方案评审

- 风险：

---

## 评论 (2条)

### 评论 #1 — 刘韬 · 2026-03-02 06:39
> 引用: "3.24 完成 场景二级页"

  **刘韬** · 2026-03-02 06:39:  大概什么时候开始介入，我需要在你之前提供渲染组件
  **张泰豪** · 2026-03-02 06:40: 3.16

**状态: 未解决**

### 评论 #2 — 涂昊天 · 2026-03-02 06:43
> 引用: "事项节奏与短期目标："

  **涂昊天** · 2026-03-02 06:43: 再细化一下吧，按照「里程碑&排期」文档中定义的开发里程碑，确认一下3.13、3.20这几个节点的进展；事项也可以详细一点，比如co 关联关系中，agent 的建设完成时间、服务的建设完成时间、全量卡片录入的完成时间

**状态: 未解决**
