---
source:
  - "https://bytedance.larkoffice.com/wiki/EHFvwx70fiJ3KhkxrRzcVL1anwX"
source_title: "《【技术方案】交易研发资产卡片端到端采集》"
type: "document_snapshot"
summary: "交易研发资产卡片端到端采集方案。原文快照；目标、进展和实际结果按原文区分。"
---
<title>【技术方案】交易研发资产卡片端到端采集 </title>

# 背景

<cite doc-id="FSBkd8CYoodPUvxcW2eceOcjnOh" file-type="docx" title="【WIP】资产信息采集 OnePage" type="doc"></cite>

<cite doc-id="GjZXduhf1oX7KQxk2L5cFIManlf" file-type="docx" title="【FE技术方案】卡片资产信息上翻" type="doc"></cite>



# 整体流程

<synced_reference src-block-id="JYfCdaczFsooNIbARajc6jBKnBe" src-token="FSBkd8CYoodPUvxcW2eceOcjnOh"></synced_reference>



# 卡片埋点 

<blockquote><p><cite doc-id="AGKHweTZpiJ1FykYy3PcWmEgn7g" file-type="wiki" title="【技术方案】卡片/组件流量监控机制" type="doc"></cite></p><p>复用埋点 <code>life_poi_card_usage_log</code></p></blockquote>

<callout emoji="🎯">
结论：结合方案二和方案三，编译时注入 card-route 和 card-scene，运行时上报卡片曝光埋点
</callout>

<table><colgroup><col/><col/><col/><col/></colgroup><thead><tr><th></th><th>方案一</th><th>方案二</th><th>方案三</th></tr></thead><tbody><tr><td>思路</td><td>在所有卡片手动添加<ul><li>非标准化卡片，在 entry 组件手动添加 data-usage-logger</li></ul><img name="image.png" alt="图片展示的是在代码编辑界面中一段代码内容，代码位于`apps/life_trade_order - detail/src/cards/groupons/GoodsCard/entry/index.tsx`文件内。画面中被红色框线突出显示的代码部分，是在`render`函数内的`view`标签中手动添加`data - usage - logger`的相关代码，包括`mark_value`和`card_router_key`的赋值操作等。此代码示例对应文档中交易研发资产卡片端到端采集方案一中，在所有卡片手动添加非标准化卡片，在`entry`组件手动添加`data - usage - logger`的思路。" mime="image/png" scale="1.000000" src="H51ebt5ORoE52Mxp8phckLqlnCd"/><ul><li>增加 CR 规则，后续强制添加  data-usage-logger</li><li>可通过 AI 生成代码</li></ul></td><td>扩展 <code>PoiCardUsageRatePlugin</code> lynx-speedy 插件，在编译时给每个卡片注入曝光埋点<ul><li>增加配置</li></ul><pre caption="&#xA;" lang="TypeScript"><code>cards: [{<br/>    card_dito_type: "xxx",<br/>    path: "xxx",<br/>}]</code></pre><ul><li>通过 AI 自动生成相关配置</li></ul></td><td>运行时，遍历 lynx dom 找到展示的卡片，统一上报<whiteboard token="N65Zwy3LPhkXS3bo7njcAUSZnKg"></whiteboard><ul><li>上报时机：fmp 后</li><li>过滤逻辑<ol><li seq="1">通过 dito 返回的 data 获取到所有卡片 id</li><li>遍历所有 diot 卡片<ol><li seq="1">通过 id 查找 查询 element</li><li>获取宽高，过滤出高度 &gt; 0 的卡片</li></ol></li><li>使用 lynx <a href="https://lynx-doc.cn.goofy.app/docs/frontend/lynx-api/selector-query/selector-query">SelectorQuery</a> api</li></ol></li><li>标准化卡片 scene<ul><li>TradeCardSceneLoader 增加 data-card-scene 属性</li><li>使用 lynx <a href="https://lynx-doc.cn.goofy.app/docs/frontend/lynx-api/selector-query/selector-query-fields">selector-query-fields</a> api</li></ul></li><li>非标准化卡片 router_key<ul><li>手动添加 data-route 属性</li></ul></li><li>性能优化，批量查询，一次性查询多个卡片</li></ul><pre caption="&#xA;" lang="TypeScript"><code>let q = lynx.createSelectorQuery();<br/>targetIds.forEach(id =&gt; {<br/>  q = q.select(`#${id}`).invoke({ method: 'boundingClientRect' });<br/>});<br/>q.exec(() =&gt; {<br/> console.log('selector batch ms:', performance.now() - t0);<br/>});</code></pre></td></tr><tr><td>代码示例</td><td></td><td><pre caption="&#xA;" lang="TypeScript"><code> getMarkValue(t, path) {<br/>    // 1. 向上查找 class<br/>    const classPath = path.findParent((parentPath) =&gt; {<br/>      return t.isClass(parentPath);<br/>    });<br/><br/>    let renderMethodPath = null;<br/><br/>    // 2. 遍历类的所有方法，找到 render 方法<br/>    classPath.traverse({<br/>      ClassMethod(childPath) {<br/>        if (childPath.node.key.name === 'render') {<br/>          renderMethodPath = childPath;<br/>          // 找到后停止遍历，提升性能<br/>          childPath.stop();<br/>        }<br/>      },<br/>    });<br/><br/>    const methodPath = path.findParent((parentPath) =&gt; {<br/>      // 判断是否是类的 render 方法<br/>      return t.isClassMethod(parentPath);<br/>    });<br/><br/>    // 2. 判断是否在 render 函数内<br/>    if (methodPath.node.key.name !== 'render') {<br/>      console.log(`该 JSX 节点不在 render 函数内，在函数 ${methodPath.node.key.name}`);<br/>    }<br/><br/>    // 3. 获取 render 函数的作用域，检测 routerKey 是否存在<br/>    const { scope } = methodPath;<br/>    const routerKeyBinding = scope.getBinding('routerKey');<br/><br/>    if (routerKeyBinding) {<br/>      console.log('✅ render 函数内存在 routerKey 变量');<br/>      console.log('routerKey 声明位置:', routerKeyBinding.path.node.loc);<br/>      return t.objectExpression([<br/>        t.objectProperty(t.identifier('routerKey'), routerKeyBinding.path.node),<br/>      ]);<br/>    } else {<br/>      console.log('❌ render 函数内不存在 routerKey 变量');<br/>    }<br/>  }</code></pre></td><td><pre caption="&#xA;" lang="TypeScript"><code>function queryShownCard(order_detail_dito: DitoPage) {<br/>  const MAGIC_MIN_SIZE = 10;<br/>  Object.keys(order_detail_dito.nodes || {}).forEach((cardId) =&gt; {<br/>    const card = order_detail_dito.nodes[cardId];<br/>    // 过滤 dito 组件，只处理业务卡片<br/>    if (card.type === 'component') {<br/>      lynx<br/>        .createSelectorQuery()<br/>        .select(`page &gt;&gt;&gt; #dito-page &gt;&gt;&gt; #${cardId}`)<br/>        .invoke({<br/>          method: 'boundingClientRect',<br/>          success(res) {<br/>            const isShown = res.height &gt; MAGIC_MIN_SIZE &amp;&amp; res.width &gt; MAGIC_MIN_SIZE;<br/>            if (isShown) {<br/>              console.log(`[life_poi_card_usage_log] card ${cardId} is shown`, res);<br/>            }<br/>          },<br/>          fail(res) {<br/>            console.warn(`[life_poi_card_usage_log] get card ${cardId} rect fail`, res.code, res.data);<br/>          },<br/>        })<br/>        .exec();<br/>    }<br/>  });<br/>}</code></pre><img name="image.png" alt="图片展示了交易研发资产卡片端到端采集中方案三的运行时采集代码示例。在DevTools的Elements面板中，选于交易的交易卡片被选选，其代码被 addCriterion被高亮显示。。代码中包含了多个组件标签，如`&lt;div class=&#34;local_payment_complete_title_card_co&#34; style=&#34;width:100%&#34; &gt;`等，以及`&lt;div class=&#34;local_payment_complete_title_card_co&#34; style=&#34;width:100%&#34; &gt;`等，还包含`&lt;div classimage_id&gt;" mime="image/png" scale="1.000000" src="Iva9bIlDmoBLIzxNjXAc91m9nAe"/><img name="image.png" alt="图片展示了交易速卖通APP中交易研发资产卡片端的调试界面。左侧为APP界面，显示“购买成功”及二维码等信息。右侧是DevTools调试窗口，左侧为Elements、Console等选项卡，右侧是Console区域，显示了“lite_pei_card_usage_log”相关代码，如“init success”等信息，还呈现了“card”对象，包含“card-scene”" mime="image/png" scale="1.000000" src="DXKHbk2Ixo0jIyxVmAbcZLGEnTd"/></td></tr><tr><td>优点</td><td><ul><li>稳定性风险低</li></ul></td><td><ul><li>无侵入，开发体验好</li></ul></td><td><ul><li>无侵入，开发体验好</li><li>通用性强，适配所有 dito 架构</li></ul></td></tr><tr><td>缺点</td><td><ul><li>依赖人工，维护成本高</li></ul></td><td><ul><li>非标准化卡片 routerKey 取值逻辑需要适配，如果编译逻辑错误可能导致卡片渲染失败</li></ul></td><td><ul><li>无法采集到非标准化卡片的 router_key，依赖人工添加 dataset 属性</li><li>标准化卡片只能采集到枚举值，缺乏语义</li></ul></td></tr></tbody></table>



# 采集方案

## 流量采集

<whiteboard token="NqyMwvXeyhOj4UbQqa7cS5NYnSb"></whiteboard>

<table><colgroup><col/><col/></colgroup><thead><tr><th>事项</th><th>思路</th></tr></thead><tbody><tr><td>曝光埋点上报业务身份</td><td><ul><li>埋点通参增加业务身份</li></ul><pre caption="埋点参数&#xA;" lang="TypeScript"><code>log_id: string<br/>biz_identity_main_type: string<br/>biz_identity_combo_biz: string<br/>biz_identity_first_industry: string<br/>biz_identity_second_industry: string<br/>biz_identity_third_industry: string</code></pre></td></tr><tr><td>查询 tea 埋点<br/>查询接口回放数据<br/>保存到任意门</td><td>通过 open api 查询</td></tr><tr><td>数据格式</td><td><pre caption="&#xA;" lang="JSON"><code> {<br/>  "log_id": "20251227174736139AA3F299C705E5518E",<br/>  "anywhere": {<br/>    "arenaId": "23127224491581"<br/>    "nodeId": "645077495986592",<br/>  },<br/>  "biz_identity": {<br/>    "main_type": "times_card",<br/>    "combo_biz": [],<br/>    "industry_identity": {<br/>      "first_industry": "food",<br/>      "second_industry": "null",<br/>      "third_industry": "null"<br/>    }<br/>  }<br/>}</code></pre></td></tr></tbody></table>

曝光埋点说明

<callout emoji="🎯">
像订单头卡这类复杂卡片有多种不同样式的 UI，这些 UI 通常由多个接口字段控制，仅根据业务身份维度，很难涵盖所有的情况。因此增加了卡片曝光埋点来作为补充，扩大采集的数据范围，以覆盖所有的卡片场景。
优先使用页面曝光埋点，卡片曝光埋点作为补充（仅针对复杂卡片）
</callout>

<table><colgroup><col/><col/><col/></colgroup><thead><tr><th>分类</th><th>埋点字段</th><th>使用说明</th></tr></thead><tbody><tr><td>页面曝光埋点</td><td><ul><li>logid</li><li>业务身份</li></ul></td><td><ul><li>取不同业务身份维度下 k 条数据 </li><li>采集这个业务身份下有展示哪些卡片，卡片的 scene</li></ul></td></tr><tr><td>卡片曝光埋点</td><td><ul><li>logid</li><li>业务身份</li><li>卡片场景 scene</li></ul></td><td><ul><li>基于埋点分析出卡片场景和业务身份的关联关系</li><li>先取卡片场景，在某个卡片场景下再下钻取不同业务身份维度下 k 条数据 </li><li>采集卡片信息</li></ul></td></tr></tbody></table>



## 卡片内容采集

<synced-source><whiteboard token="UJjgwLji4h4jC0bCpAdchGL2nVd"></whiteboard><table><colgroup><col/><col/><col/><col/><col/></colgroup><thead><tr><th>采集内容</th><th>说明</th><th>实现思路</th><th>实现参考</th><th>示意</th></tr></thead><tbody><tr><td>卡片截图</td><td>卡片在不同业务身份下的渲染效果</td><td><ol><li seq="1">获取整个页面的截图</li><li>获取页面下的所有 dito 卡片<ol><li seq="1">获取整个页面的 dom 树</li><li>遍历，找出展示的 dito 卡片（通过 id 过滤）</li></ol></li><li>截取卡片截图<ol><li seq="1">获取到卡片的盒模型（x、y、width、height）</li><li>裁剪图片（基于 <a href="https://github.com/jimp-dev/jimp">jimp</a> 库)</li></ol></li></ol></td><td><ol><li seq="1">截图页面</li></ol><pre caption="&#xA;" lang="TypeScript"><code> await pagepass.device.screenshot({<br/>    name: filename,<br/>    type: "png",<br/>    quality: 80,<br/> });</code></pre><ol><li>查找 dito 卡片</li></ol><pre caption="&#xA;" lang="TypeScript"><code>function buildAttr(attributes: string[]) {<br/>  return Object.fromEntries(_.chunk(attributes, 2));<br/>}<br/><br/>const nodes: DomNode[] = [];<br/><br/>function parseNode(node: DomNode) {<br/>  const attr = buildAttr(node.attributes || []);<br/><br/>  if (attr.idSelector?.startsWith("lynx_local_")) {<br/>    nodes.push(node);<br/>  }<br/><br/>  // 递归遍历子节点<br/>  for (const child of (node.children || [])) {<br/>    parseNode(child);<br/>  }<br/>}<br/><br/>async function main() {<br/>  parseNode(getRootNode());<br/>  const shownNodes = nodes.filter((node) =&gt; {<br/>    const pos = node.position;<br/>    return pos.width &gt; 10 &amp;&amp; pos.height &gt; 10;<br/>  });<br/>}<br/></code></pre><br/>html 解析库：<a href="https://www.npmjs.com/package/htmlparser2">htmlparser2</a></td><td><grid><column width-ratio="0.500000"><figure view-type="Preview"><source name="lynx.html" mime="text/html" size="123819" token="Eeb0bdQZQoOeVyxmuBhcGpDWnmc"/></figure></column><column width-ratio="0.500000"><figure view-type="Preview"><source name="lynx.node.json" mime="application/json" size="1792127" token="Ka0JbWo6fosAIZxfavEc0jWCnAc"/></figure></column></grid><img name="image.png" alt="图片展示了一张交易相关的卡片内容，标题为【9.9吃堡】饭点优选三件套-可配送C121，价格为9.9元，数量1份，实付9.90元。下方标注随心团，支持在线点单，周一至周日可用，过期自动退，右侧还有&#34;使用须知&#34;链接。此图片与文档中卡片内容采集相关的上下文对应，可作为标准化或非标准化卡片场景示例，用于说明卡片内容采集方案中，运行时获取完整dom树、解析组件及反查场景等采集过程可能涉及的卡片样式及信息呈现形式。" mime="image/png" scale="1.000000" src="JDRXbBgqjovH3mxBbHgc212qnIg"/></td></tr><tr><td>卡片场景</td><td>标准化卡片：scene<br/>非标准化卡片：router_key</td><td><ul><li>代码静态分析，分析卡片组件和卡片场景的关联关系</li><li>运行时获取到卡片的完整 dom 树，解析出卡片渲染使用的组件，反查出卡片场景</li></ul></td><td></td><td></td></tr></tbody></table></synced-source>



## 采集内容

<synced_reference src-block-id="LyjEduJOrsyeLBbmEflcZcTQnad" src-token="GjZXduhf1oX7KQxk2L5cFIManlf"></synced_reference>



## 数据存储结构

<synced-source><p>基于 server 的存储方案<cite doc-id="BLZ4wds6yiR5tpk3g3wchwcGnad" file-type="wiki" title="【技术方案】-资产平台存储与检索方案" type="doc"></cite>，存储卡片截图和卡片场景</p><whiteboard token="X8fQwRB5dhJLD8bKkuecjCZsnod"></whiteboard><ul><li>新增 asset_type = 2（卡片） 3（卡片场景）</li><li>asset_type = 3 和业务身份 1:n 关联</li></ul></synced-source>



## 数据保鲜

<callout emoji="🎯">
定时任务更新数据
</callout>

<whiteboard token="WVebwUxexhCRSIbdxvDc04VTn0f"></whiteboard>

<table><colgroup><col/><col/><col/></colgroup><thead><tr><th>任务</th><th>内容</th><th>频率</th></tr></thead><tbody><tr><td>更新业务身份</td><td><ul><li>【当前】基于页面埋点（order_detail_show），分析出所有业务身份</li><li>【未来】follow server 方案，研发流程增加卡点，从 server 获取</li></ul></td><td>每天一次</td></tr><tr><td>更新接口数据</td><td><ul><li>各个业务身份捞取最新 x 条数据，按照 PV 降序排序</li></ul></td><td>每天一次</td></tr><tr><td>更新截图</td><td><ul><li>创建更新任务，触发 bytest 任务，执行采集逻辑</li></ul></td><td>每周一次</td></tr></tbody></table>



# 渲染方案



## 方案选型

<table><colgroup><col/><col/><col/></colgroup><tbody><tr><td></td><td>方案一</td><td>✅ 方案二</td></tr><tr><td>方案介绍</td><td>截图 + position 定位</td><td> lynx web 构建 H5</td></tr><tr><td><b> 优势</b></td><td><ul><li>还原度高</li></ul></td><td><ul><li>可交互，支持弹窗</li><li>可实时调整数据，渲染</li></ul></td></tr><tr><td><b>劣势</b></td><td><ul><li>无法交互</li></ul></td><td><ul><li>还原度现对较低</li></ul></td></tr><tr><td>参考</td><td></td><td><a href="https://code.byted.org/life_service/life_trade_c_fe_mono/compare/master...feat%2Fh5-bundle?dv_filepath=libs%2Ftrade_marketing_point%2Fsrc%2Fconfirm_order%2FVip%2Fpoints%2FFreeMemberCard%2Fcontainers%2FFreeMemberContainer%2Findex.tsx">code.byted.org</a></td></tr></tbody></table>

方案细节

<table><colgroup><col/><col/></colgroup><tbody><tr><td>如何渲染</td><td><ul><li>裁切接口的 dito 数据，只保留需要展示的卡片</li><li>lynx  web 渲染</li></ul></td></tr><tr><td>如何交互</td><td><ul><li>监听 hover 事件</li><li>仅处理文字/图片元素(text/img)</li></ul></td></tr></tbody></table>

## h5 渲染

<synced-source><whiteboard token="OyLdwYl2shqSpGbZAJ9cCCNhnff"></whiteboard></synced-source>

## 交互

- 当鼠标 hover 到“文字/图片”上时，高亮对应元素
- 当鼠标点击元素时，联动 CO 组件展示



## 组件设计

> 在线体验地址：https://life-sre.gf.bytedance.net/example/card
> 
> ppe_lt 环境

<synced_reference src-block-id="B4Ojd0mRosMo09biHyPcSQtvnRc" src-token="GjZXduhf1oX7KQxk2L5cFIManlf"></synced_reference>



## 组件使用

```TypeScript
function PageInspectCardExamples() {
  // order_detail 接口数据
  const data = getOrderDetail();

  return (
      <InspectCard 
          response={data} 
          // 只渲染目标卡片
          ditoCardType="lynx_local_order_detail_groupon_goods_card" 
      />
  );
}

```

# 进度

<synced-source><table><colgroup><col/><col/><col/></colgroup><thead><tr><th></th><th>埋点接入</th><th>采集</th></tr></thead><tbody><tr><td>订单/购完</td><td><checkbox done="true">自动动化采集接入</checkbox><checkbox done="true">data-card-route 补充</checkbox></td><td><checkbox done="true">测试 case </checkbox><checkbox done="true">接口联调</checkbox></td></tr><tr><td>提单</td><td><checkbox done="true">自动化采集接入</checkbox><checkbox done="true">data-card-route 补充</checkbox></td><td><checkbox done="true">测试 case </checkbox><checkbox done="true">接口联调</checkbox></td></tr><tr><td>商详</td><td></td><td><checkbox done="true">测试 case </checkbox><checkbox done="true">接口联调</checkbox></td></tr></tbody></table></synced-source>