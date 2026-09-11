---
source:
  - "https://bytedance.larkoffice.com/wiki/DU6DwPLjkievy1kVozacAssnnjc"
source_title: "《交易资产管理插件使用说明》"
type: "document_snapshot"
summary: "交易资产插件使用说明。原文快照；目标、进展和实际结果按原文区分。"
---
> [!NOTE]
> 资产平台是一个 ditom 平台插件，扩展了 ditom 物料管理能力，物料在不同场景下的测试商品管理和截图预览。
>
> [!NOTE]
> 反馈地址：[使用反馈](https://bytedance.larkoffice.com/wiki/HcjywHkZviHHAikpwWVcAakTnjg)
>
# 平台地址

交易FE物料库地址： https://dito.bytedance.net/ditom/resources/life_trade_c_fe/resource
使用反馈：[使用反馈](https://bytedance.larkoffice.com/wiki/HcjywHkZviHHAikpwWVcAakTnjg)

# 使用场景

## 卡片场景梳理

### 场景说明

适用于卡片代码梳理，需要获取不同场景下的卡片截图。

### 优势

- 自动同步提单/订单页，自动抓取相关接口，一键操作，省时省力
- 一次保存截图&接口，多次使用。

### 前置准备

<table data-lark-table="docx-table" data-block-id="RkVudb2e8ok6SWxidC2crc6GnEd"><thead><tr><th>准备</th><th>操作说明</th></tr></thead><tbody><tr><td>申请<a href="https://bits.bytedance.net/env/flowsetting/anywheredoor/scene/167603146335929?appId=1128&amp;nodePath=">任意门场景</a>权限</td><td>联系<a href="mailto:liutao.fe@bytedance.com">@刘韬(liutao.fe)</a> <a href="mailto:chenbokun@bytedance.com">@陈柏昆(chenbokun)</a> 添加授权</td></tr><tr><td>配置 chrome 安全设置</td><td><a href="https://bytedance.larkoffice.com/wiki/DU6DwPLjkievy1kVozacAssnnjc#share-CeIqdFGzSoDIsPxd3nZcnEAHnVb">点击查看</a></td></tr><tr><td>打开 HDT 总开关</td><td>https://annie.bytedance.net/docs/tools/hdt/introduction/install-client/</td></tr></tbody></table>

### 流程概览

[Screenity video - Apr 16, 2025 (2).mp4](https://internal-api-drive-stream.larkoffice.com/space/api/box/stream/download/authcode/?code=NmYxNWUwYzcyNzU5ZmEyOTAyOTUxZTJmNTlhZmVmNzNfZTY3MDk5YzZkOTNiOWE1ODc5OTY4NmI2NTRhNmYzMWRfSUQ6NzQ5Mzc1NTY2MTkyNzc1OTg3NV8xNzg4NjgwMTAzOjE3ODg3NjY1MDNfVjM)

![```mermaid\nflowchart TD\n    o1_385(\["保存\n接口数据&截图"\])\n    o1_386(\["复制图片到文档"\])\n    o1_11(\["创建场景"\])\n    o1_12(\["选择场景\n进入场景详情"\])\n    o1_1\["场景梳理"\]\n    o1_2(\["梳理代码\n拆分场景"\])\n    o1_7(\["打开设备\n开启 HDT"\])\n\n    o1_11 --> o1_12\n    o1_12 --> o1_7\n    o1_385 --> o1_386\n    o1_1 --> o1_2\n    o1_7 <-.->|同步| o1_385\n    o1_2 --> o1_11\n```\n\n| 文档 |  |\n| --- | --- |\n| 平台 |  |\n| 测试手机 |  |](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/69023f14-6c9d-48b1-ba8e-bba2b46178cb.png)

### 步骤说明

<table data-lark-table="docx-table" data-block-id="PfcmddUhmoVIS4xCSs7cgrs3nec"><thead><tr><th>步骤</th><th>示意</th><th>说明</th></tr></thead><tbody><tr><td>1. 访问物料页</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/e5a4d11a0b313b751a0d9ff6a4de852bec94fdab9c55b29e7189b340ad4fbf5a.png" alt="Pr1KbbMc6o4uUKxwa3dcXn3Znld" /></td><td>https://dito.bytedance.net/ditom/resources/life_trade_c_fe/resource</td></tr><tr><td>2. 进入物料的场景管理</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/831b3e2c070fc3d04a8aee797313b412e10c8d5c35118343fd2229d044cd7bde.png" alt="IU3QbYa8aoSPC3xRsbrcf6vGncf" /></td><td>- 点击 <code>场景</code> 标签</td></tr><tr><td>3. 创建场景</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/560387df889d76f5a0a4e97f830192709d3240312108bbccd8334fd5836a6a01.png" alt="U9x7btVKsojdvJxB4dhcBN3Hn1f" /></td><td>- 点击 <code>添加场景</code> 按钮<br />- 填写表单内容<br />    - 场景key：英文名称，支持字母、数字、下划线和斜杠组合<br />    - 场景标题：中文名称<br />    - 场景描述：描述<br />    - 父节点：可选，支持场景嵌套</td></tr><tr><td>4. 点击卡片进入场景详情</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/3c04b8dba341bbc8bcfe8a62f720d145e43a2416e8543e496531732299c2fd47.png" alt="StbXb1xsMo2C3CxmGORcvD2qnqe" /></td><td>- 页面说明<br />    - 左侧展示当前场景和所有子场景<br />    - 右侧在真机连接后实时展示设备画面<br />    - 中间展示当前场景信息，相关测试商品</td></tr><tr><td>5. 首次连接设备或者切换设备需要绑定设备</td><td>| <img src="https://tosv.byted.org/obj/larkparser/lark_cache/19be18bfb7bd5cd111a8c406d1c77bb439cb4ed43606d9041010249397ada8a8.png" alt="In1tb6kZOoXF9XxfQsDcJEGZnnh" /> | <img src="https://tosv.byted.org/obj/larkparser/lark_cache/da79e63961a13ac49d0e3b4184915fde010250030f5263251d99e4faa6150f12.png" alt="IURcbbD6joJVZ6xudIEcvIjdnnv" /> |<br />| --- | --- |</td><td>- 鼠标 hover 到 icon 上<br />- 抖音使用 hdt 扫码<br />    - 点击 hdt 悬浮按钮<br />    - 点击扫一扫<br />| <img src="https://tosv.byted.org/obj/larkparser/lark_cache/8f282be7813dd4b185770be64d10d8808a04ed1e3e1b5d7ade88b47e4823e559.png" alt="BOg6b1NCFov4v9xTMBXcqppqnwd" /> | <img src="https://tosv.byted.org/obj/larkparser/lark_cache/79bc0a1a162fad35dd0488f86b53fe0a68e798d8a2b9f3abc98e34ee97c007fe.png" alt="YEigbfUpGo0ynGxmRkhcCGgGnKb" /> |<br />| --- | --- |</td></tr><tr><td>6. 访问页面，抓取接口</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/62b1209cb5a251183b672cb554f0fa1e8b500e77783150848909a928775e99f0.png" alt="WBnKbhcQMoJ7oWxiEoGcPA0nnrb" /><br /><img src="https://tosv.byted.org/obj/larkparser/lark_cache/13ba846dc22b82adc8186737cce62e5cc5b08a72e8c05214a49032e31240ab28.png" alt="ZUJFbELVroRlJmxsxtNcNxGlnnd" /></td><td>- 设备访问提单页/订单页，画面实时同步到 pc<br />- 点击抓包按钮，抓取接口数据<br />只能抓取设备连接后的的接口，如果页面是在设备连接前打开部分接口可能无法抓取到，可重新加载页面<br />- 点击保存按钮，新增 mock demo 并保存数据<br />默认使用商品名称</td></tr><tr><td>7. 保存当前截屏</td><td>| <img src="https://tosv.byted.org/obj/larkparser/lark_cache/5d1711196662b024afaefc65d09b22955b6a3ed3915b4c7ab76767a8fd206f2d.png" alt="Z4aCbUoAPoIIf8xDhIfcAIspn8f" /> | <img src="https://tosv.byted.org/obj/larkparser/lark_cache/8021ba8c30872157fdfafc31aa7c42e80edc11f12ff2376bbb45e33c07694e4c.png" alt="GGkwbh7hsoIvcLxTRBtcuebdn0g" /> |<br />| --- | --- |<br /><img src="https://tosv.byted.org/obj/larkparser/lark_cache/6efaa498ff7c6f6ee50158be650343f3a8f4dca0f7e51be740e106c7b0c6ad6b.png" alt="D0zabVsvooWz0oxrk0tc2bnPnPc" /></td><td>- 点击“保存当前截屏为Mock预览图”按钮或者点击“点击保存截图”按钮<br />- 选择“裁切范围”<br />- 点击“保存”</td></tr><tr><td>8. 查看 mock 数据</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/3b009cc4fbdaadb64b07afb65cfa5c6063b407af0629184f74d4d0b95a004b89.png" alt="NjOpbPDocoI5vpxcjzBcLxronoc" /></td><td>- 点击“Mock 数据” 标签页<br />- 点击对应的 mock 数据，可查看对应截图<br />- 预览对应的 mock 数据<br />    - 点击 <code>Map Local</code> 按钮，下发代理配置到设备<br />    - 真机设备扫“任意码”，手动开启代理配置</td></tr></tbody></table>

# 功能使用说明

## 查看场景列表

<table data-lark-table="docx-table" data-block-id="VGjpd2GQYoS1tex1lVMcq1HpnTh"><tbody><tr><td>卡片视图</td><td>展示第一层级的场景</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/e3d2e3e1bc47179e06a214648528443dc1fe751771afe3e071d4a1775f2b42ea.png" alt="BaHdbpCScol7aFxU4lFcSbIhnhb" /></td></tr><tr><td>表格视图</td><td>展示所有的场景，可点击展示子场景</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/8104af96564d85223dc431ff22931623c9c87119fd98d79a9f20f444edc9d6a0.png" alt="RjyKbqJ3moXukzx9XencIGMRnFo" /></td></tr></tbody></table>

## 实时预览&保存截图

> [!NOTE]
> 由于 chrome 安全限制，需要配置“网站设置”， [点击查看](https://bytedance.larkoffice.com/wiki/DU6DwPLjkievy1kVozacAssnnjc#share-CeIqdFGzSoDIsPxd3nZcnEAHnVb)
>
<table data-lark-table="docx-table" data-block-id="NnCwd5x2codp4IxS9H7c5HQcnnh"><tbody><tr><td>1. 首次连接设备或者切换设备需要绑定设备</td><td>| <img src="https://tosv.byted.org/obj/larkparser/lark_cache/19be18bfb7bd5cd111a8c406d1c77bb439cb4ed43606d9041010249397ada8a8.png" alt="BWqFb7Lp2ozbBgxYd9hce0wSnbb" /> | <img src="https://tosv.byted.org/obj/larkparser/lark_cache/da79e63961a13ac49d0e3b4184915fde010250030f5263251d99e4faa6150f12.png" alt="GipGbN1iHogYDBxfIMtcQmUlnaf" /> |<br />| --- | --- |</td><td>- 鼠标 hover 到 icon 上<br />- 抖音使用 hdt 扫码<br />    - 点击 hdt 悬浮按钮<br />    - 点击扫一扫<br />| <img src="https://tosv.byted.org/obj/larkparser/lark_cache/8f282be7813dd4b185770be64d10d8808a04ed1e3e1b5d7ade88b47e4823e559.png" alt="X6ccby3V4oVpx0xYjMtcMv2fnme" /> | <img src="https://tosv.byted.org/obj/larkparser/lark_cache/79bc0a1a162fad35dd0488f86b53fe0a68e798d8a2b9f3abc98e34ee97c007fe.png" alt="UjQAbTGvSosiiBxROTscT3OPnhg" /> |<br />| --- | --- |</td></tr><tr><td>2. 访问页面，自动同步截屏</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/c415fde3d9d8da28b5e11c73a85f6644b2bf3345fe16ad0305ce0e20b84adf6f.png" alt="RieUb6BLuociuAx1N9LcoOSwnKn" /></td><td>- 设备访问提单页/订单页，画面实时同步到 pc<br />- 按钮说明<br />    - 重新加载：重新加载当前页面<br />    - 停止代理：关闭当前代理配置<br />    - 扫码绑定设备<br />    - 扫码预览页面：扫码进入主端商品详情页<br />    - 保存截图：保存当前截屏作为当前测试商品/mock数据的截图<br />    - 保存接口数据：新增 mock 数据，使用当前抓取的接口数据</td></tr></tbody></table>

## 预览测试商品

<table data-lark-table="docx-table" data-block-id="ZUFHdQK8uoYzBSxkRaccGByDn4D"><thead><tr><th>步骤</th><th>示意</th><th>说明</th></tr></thead><tbody><tr><td>1. 选择测试商品</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/5d2cdd409a2b7b76b7aa8ccf2d77e73c14d94bab34412d55313e13f015b1331d.png" alt="YoyrbcXf9oMAAJxqIRhcbzQXnFf" /></td><td>- 点击“预览” 标签页<br />- 点击对应的测试商品</td></tr><tr><td>2. 扫码预览</td><td></td><td>- 选择想要预览的页面<br />- 真机扫码预览</td></tr></tbody></table>

## 预览 Mock 数据

<table data-lark-table="docx-table" data-block-id="PtxOdgsqVo3CEIx7EmYcYWfPn5d"><thead><tr><th>步骤</th><th>示意</th><th>说明</th></tr></thead><tbody><tr><td>1. 选择 mock 数据</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/3b009cc4fbdaadb64b07afb65cfa5c6063b407af0629184f74d4d0b95a004b89.png" alt="W4X6bazVKoR30rxE0xYcRAqpnBg" /></td><td>- 点击“Mock 数据” 标签页<br />- 点击对应的 mock 数据，可查看对应截图</td></tr><tr><td>2. 开启代理配置</td><td></td><td>- 点击 <code>Map Local</code> 按钮，下发代理配置到设备<br />- 真机设备扫“任意码”，手动开启代理配置</td></tr></tbody></table>

## 保存任意门抓包

> [!NOTE]
> 请先联系[@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) [@陈柏昆(chenbokun)](mailto:chenbokun@bytedance.com) 添加任意门权限。
>
<table data-lark-table="docx-table" data-block-id="WAyodZqFpoCZNBxKIMVch3DjnNg"><thead><tr><th>步骤</th><th>示意</th><th>说明</th></tr></thead><tbody><tr><td>1. 获取任意门分享链接</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/44b59966a272b20724d3308facc3eba4eff3e6cb1ece58f07e836391f64b5a11.png" alt="Ka83bMzXmoj5nLxBB5wcJgHCnRe" /></td><td><a href="https://cloud.bytedance.net/docs/bits/docs/6480709f2207580224c6b2d2/656059f20cfa03038f7e112f?x-resource-account=public&amp;x-bc-region-id=bytedance#98468f91">使用流量代理抓包（任意门）</a></td></tr><tr><td>2. 新增 mock 数据</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/586010ead2179bc9d582a306203644780bf4786eb500f00e0051ae28a3c7ad23.png" alt="KdPlb6z7ToWu6BxNJLbcNwNOnZc" /></td><td>- 点击“Mock 数据” 标签页<br />- 点击“添加”按钮<br />    - 名称<br />    - 任意门 url：填入任意门分享链接</td></tr></tbody></table>

## 保存接口抓包

<table data-lark-table="docx-table" data-block-id="DfvidkxXJoHoD1xWPW9cT4h6nyg"><tbody><tr><td>1. 访问页面，抓取接口</td><td></td><td>- 设备访问提单页/订单页，画面实时同步到 pc</td></tr><tr><td>2. 保存抓取的接口</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/62b1209cb5a251183b672cb554f0fa1e8b500e77783150848909a928775e99f0.png" alt="ORR2bgvQAouXXGxzaxUcWlztn6d" /></td><td>- 点击抓包按钮，保存抓取到的接口数据<br />只能抓取设备连接后的的接口，如果页面是在设备连接前打开部分接口可能无法抓取到，可重新加载页面</td></tr><tr><td>3. 保存 mock 数据</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/13ba846dc22b82adc8186737cce62e5cc5b08a72e8c05214a49032e31240ab28.png" alt="Nvihbz85dosvLAxKfZcck3FPnhg" /></td><td>- 点击保存按钮，新增 mock demo 并保存数据<br />默认使用商品名称</td></tr></tbody></table>

## 自动从 Tea 捞取商品

<table data-lark-table="docx-table" data-block-id="Bdh8dAdsPoqp3fxoDh1crMdVn7e"><tbody><tr><td>1. 进入场景详情页，编辑场景规则</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/0f8ed983f92086ed1fbd449b4c387314f3e51ccb38edd665d1a6cf2994f9d7c9.png" alt="KEOjblrKsoLr1vxdiKJcW6ntnhf" /></td><td>- 进入场景详情页<br />- 点击“编辑规则”</td></tr><tr><td>2. 填写埋点配置</td><td><img src="https://tosv.byted.org/obj/larkparser/lark_cache/901603d85e08847e2e4bcd3a7854c8eb0698a688e8aec0c7faa7e12f16f39fe1.png" alt="GGU3bo3xYojPTKxGdwecI8TnnLc" /></td><td>- 选择事件名称<br />- 填写事件属性规则<br />    - module_type: 模块名称<br />    - dito_node_id: dito 卡片 id<br />    - dito_node_type: dito 组件名称<br />    - enter_from<br />- 点击保存</td></tr><tr><td>3. 获取线上商品</td><td>| <img src="https://tosv.byted.org/obj/larkparser/lark_cache/ed07a661d1f7d55444fd2d5c6747c915eb8f7ecd9962dc16fe83fd56a32270c5.png" alt="S0H5bfNkCodqg4xbfCNc18dlnZg" /> | <img src="https://tosv.byted.org/obj/larkparser/lark_cache/3ec425c790e461c64567139bdff9605b459c95776e983677f46aba17efd66bce.png" alt="Rtr0bKIvgoKmxtxYJQQcQg9Dn0f" /> |<br />| --- | --- |</td><td>- 点击“自动获取测试商品”<br />- 基于埋点配置查询 tea 数据，依照 PV 降序，取前 3 个<br />查询时间较长，请耐心等待<br />- 自动添加到测试商品</td></tr></tbody></table>

# FAQ

## 创建 mock 数据失败，提示“缺少任意门权限”

联系[@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) [@陈柏昆(chenbokun)](mailto:chenbokun@bytedance.com) 添加权限。

## 无法同步设备屏幕

由于 chrome 安全限制，默认无法连接设备，需要设置允许。
1. 点击地址栏旁边按钮，打开“网站设置”
    ![Pqbdbc09gomeJBx8zFQckbiGnoh](https://tosv.byted.org/obj/larkparser/lark_cache/f5c8990a0c15948c4b213393407ec68d6289ddece194983852639f4435b6bbea.png)

1. 允许“不安全内容”

![YDBVbf7pbozCihxoQ3fc1pDantd](https://tosv.byted.org/obj/larkparser/lark_cache/e0b414edf28ed1d4372f1bbb9c4d45f72be921e34fc8a5861649609464294eea.png)

# 会议记录

[智能纪要：资产管理平台介绍 2025年4月16日](https://bytedance.larkoffice.com/docx/TIFxdp90lofVHCxnNWIclSKYn0e)

---

## 评论 (1条)

### 评论 #1 — 刘韬 · 2025-04-16 07:41
> 引用: "[画板]"

  **刘韬** · 2025-04-16 07:41: TODO:
自动分类场景 + 开发流程管理场景

**状态: 未解决**
