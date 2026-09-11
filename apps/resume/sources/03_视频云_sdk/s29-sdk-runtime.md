---
source:
  - "https://bytedance.larkoffice.com/wiki/AmjzwtggMi2amTk9JescrQBrnFf"
source_title: "《跨平台方案运行时设计》"
type: "document_snapshot"
summary: "跨平台方案运行时设计。原文快照；目标、进展和实际结果按原文区分。"
---
<title>跨平台方案运行时设计</title>

<blockquote><p>本文参考：<cite doc-id="doccnqyheffn2ErZ9qb2yWAadjd" file-type="doc" title="怎么做好技术评审" type="doc"></cite> <cite doc-id="wikcnxgdZtyXNM4iplqgVQNyZ8d" file-type="wiki" title="【官方唯一】RTC通用技术评审例子" type="doc"></cite></p><p><b>核心点：</b></p><ol><li seq="1">严格严格严格按照模板来</li><li>写文档的时候要足够的细致</li><li>讲文档的时候，只讲你认为大家关注的点和你认为有风险的点</li><li>多画图，少写字。尤其是讲的时候，要对着图讲，不要对着文字讲</li></ol></blockquote>



# 变更记录

> 记录设计文档的修改记录，方便读者了解变更历史

<table><colgroup><col/><col/><col/><col/></colgroup><thead><tr><th><b>更新时间</b></th><th>报告人</th><th><b>版本</b></th><th><b>更新内容</b></th></tr></thead><tbody><tr><td>2024.03.28</td><td> <cite type="user" user-id="ou_39073565b6c86488cc7009ffd471d5ed" user-name="刘韬"></cite><cite type="user" user-id="ou_4982d31ec79442619cc4197637c5a4f0" user-name="窦雅宁"></cite><br/><cite type="user" user-id="ou_91a64ee6dfac4ea183149211ee81ee93" user-name="王威"></cite></td><td>v1.0</td><td>第一稿</td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>



# 背景

> 详细描述此次评审涉及到的系统的变更背景，为什么要做这次变更，当下遇到的问题是什么，变更的目标是什么以及应该怎样衡量结果
> 
> 请附上相应的参考文档，强制需要输出的是需求文档、meego链接等。

- 需求文档：<cite doc-id="OmTddF5ISo4NaKxA3DClTuQqgQe" file-type="docx" title="MyClip POC Documentation" type="doc"></cite>
- meego链接：[[产研需求（PM/RD/QA）]Video One Renact Native SDK需求](https://meego.feishu.cn/byteplus_videoone/story/detail/3001056558?parentUrl=%2Fbyteplus_videoone%2Fstory%2Fhomepage)

 

# 方案概述

> 简要描述你的方案，至少包含以下重点：
> 
> - 技术调研 - 公司内部or行业竞品有没有遇到类似的问题，都是怎么解决的，有没有可以借鉴的方案，附上必要的文档或者链接
> - 方案思路
> - 方案优点
> - 方案缺点
> 
> 如果涉及到多个方案，还应该有优缺点对比。

## 需求分析

1. React Native SDK API 需要对齐 Native，手动封装所有接口 ，开发量大。

<callout emoji="📌">
参考：互动白板跨端项目设计 4 位同学（3个 Native + 1 个 web 开发）20+ 天的开发时间。
</callout>

1. 封装层逻辑简单，主要是参数的转换和 API 的适配，API 注释也能复用 Native 的接口注释。 

<callout emoji="📌">
参考：互动白板跨端项目在测试过程中大部分的问题都是 API 传入参数类型错误导致的。比如 number 类型传入字符串。
</callout>

1. [SDKHub](https://sdkhub.bytedance.net/sdk/versionlist?sceneId=13&sdkId=75) 已收录 API 相关信息，支持自动生成文档。

由此可见，可以复用 [SDKHub](https://sdkhub.bytedance.net/sdk/versionlist?sceneId=13&sdkId=75) 收录的 API 信息，自动生成  android/ios SDK。



## 方案思路

1. 基于 SDKHub 数据，自动生成 SDK，可以通过 js 调用  Android/iOS  SDK。
2. 业务方二次封装，处理业务逻辑。



# 详细方案

## 架构设计

> - 明确涉及的系统范围和职责边界
> - 明确各系统之间的关系
> - 最好以图的方式来呈现

<whiteboard token="OLvGwFs7MhQkdZbyRMLcKO4Nn7g"></whiteboard>

技术架构上我们设计成五层

- 在 native 层处理来自 js/dart 的消息，动态调用 android/ios SDK 方法。
- 中间是消息通信层，适配 React Native/Uni/Flutter 等框架，使用框架提供的能力进行消息通信。
- 在 js/dart 的消息代理层，负责拼装消息并和 native 交换信息。
- 自动生成层，基于 android/ios 接口信息，自动生成对应的 ts，包含完整的类型信息，自动拼装相关参数。
- 最上层是业务层，处理不同端的差异。



## 流程设计

> 模块设计可以是整体架构的子模块设计
> 
> 时序请求图
> 
> 或者逻辑流程图
> 
> 异常处理

### 消息通信和动态调用

<cite doc-id="EFiowLXyninMS3k4PyTcBbf0nZq" file-type="wiki" title="RN 通信消息协议" type="doc"></cite>



#### API 调用

先看一个直播 SDK 初始化的例子

```Python
 Env.init(new Config.Builder()
      .setAppID("appId")
      .setAppName("com.xx")
      .setAppChannel("TTSDKDemo")
      .setLicenseUri("assets:///license/live.lic")
      .build());
```

包含三种典型的方法调用

- 一种是静态方法的调用
- 一种是实例化对象
- 一种是对象方法的调用

1. 静态方法调用和实例化对象

 class 和静态方法在初始化的时候就知道了，因此可以通过 class name 直接查找。

<readonly-block type="isv"></readonly-block>

1. 对象方法调用

消息通信无法传输实例引用，因此我们使用 `instanceId` 替代对象，关联真正的实例。

<readonly-block type="isv"></readonly-block>



#### 参数映射

<table><colgroup><col/><col/><col/><col/></colgroup><tbody><tr><td></td><td>json</td><td>android</td><td>ios</td></tr><tr><td>基础类型</td><td></td><td><img name="image.png" mime="image/png" scale="1.000000" src="OAkhbFZxLorYFIxhIEBcEBD7nPh"/></td><td><img name="image.png" mime="image/png" scale="1.000000" src="QgcgbEjj3oudN4xUNeHcspLynOc"/></td></tr><tr><td>枚举</td><td><pre lang="JSON"><code>{<br/>  "_type": "enum",<br/>  // 枚举类名称<br/>  "_enumName": "",<br/>  // 枚举值名称<br/>  "_name": "",<br/>  "_value": "2"<br/>}</code></pre></td><td>java 的 enum 是一种特殊的 class，需要动态构造<pre lang="Java"><code>Class&lt;?&gt; clazz = Class.<em>forName</em>("_enumName");<br/>var isEnumClass =  clazz.isEnum();<br/>if (isEnumClass) {<br/>  Class&lt;? extends Enum&gt; enumClass = clazz.asSubclass(Enum.class);<br/>  // 动态获取枚举实例<br/>  Enum&lt;?&gt; enumConstant = Enum.<em>valueOf</em>(enumClass, "_name");<br/>}</code></pre></td><td>object-c 的枚举通常就是 int 类型<br/>可以直接使用 _value</td></tr><tr><td>运行时参数</td><td><pre lang="JSON"><code>{<br/>  "_type": "var",<br/>  "_varName": "",<br/>}<br/><br/>{<br/>  "_type": "var",<br/>  // android 运行时上下文<br/>  "_varName": "ApplicationContext",<br/>}</code></pre></td><td><pre lang="Java"><code>public interface VariableGetter&lt;T&gt; {<br/>  T get();<br/>}<br/><br/>HashMap&lt;String, VariableGetter&lt;?&gt;&gt; varMap = new HashMap&lt;&gt;();<br/>var runtimeVar = varMap.get("_varName").get();</code></pre></td><td></td></tr></tbody></table>

回调函数

和 API 调用类似，消息通信无法传输函数，需要在消息传输中携带实例 `callbackId`，关联实际的回调函数。

<readonly-block type="isv"></readonly-block>



#### 事件

<readonly-block type="isv"></readonly-block>

1. js 侧维护所有的事件的 listener。

   1. 如果 listener 超过 1，通知 native 监听对应事件
   2. 如果 listener 为 0，通知 native 取消监听对应事件
2. native 侧动态构建 observer，接收 native SDK 触发的所有事件。
3. 当事件触发后，native 侧把事件参数发送给 js 侧，js 侧再派发给该事件的所有 listener。



举个直播播放器的例子

<table><colgroup><col/><col/><col/><col/></colgroup><thead><tr><th></th><th>android</th><th>oc</th><th>js</th></tr></thead><tbody><tr><td>使用方式</td><td><pre lang="Java"><code>var player = new VideoLiveManager(null);<br/>player.setObserver(new VeLivePlayerObserver() {<br/>  @Override<br/>  public void onError(VeLivePlayer veLivePlayer, VeLivePlayerError veLivePlayerError) {<br/>    <br/>  }<br/>});</code></pre></td><td><pre lang="Objective-C"><code>@interface VeLivePullStreamViewController () &lt;VeLivePlayerObserver&gt;<b><br/></b>@property (nonatomic, strong) TVLManager *livePlayer;<br/>@end<b><br/><br/></b>@implementation VeLivePullStreamViewController<br/><br/>- (void) init <br/>{<br/>    self.livePlayer = [[TVLManager alloc] initWithOwnPlayer:YES];<br/>    [self.livePlayer setObserver:self];<br/>}<br/><br/>- (void)onError:(TVLManager *)player error:(VeLivePlayerError *)error {<br/>    NSLog(@"VeLiveQuickStartDemo: Error %ld, %@", error.code, error.errorMsg);<br/>}<br/>@end</code></pre></td><td><pre lang="JavaScript"><code>const player =  new VideoLiveManager(null);<br/><br/>player.on('onError', (player, err) =&gt; {<br/>});</code></pre><br/><del>方案一</del><pre lang="JavaScript"><code><del>const player =  new VideoLiveManager(null);</del><br/><del>const observer = new VeLivePlayerObserver({</del><br/><del>    onError</del><br/><del>});</del><br/><br/><del>observer.on('onError', (player, err) =&gt; {</del><br/><del>});</del><br/><br/><del>player.setObserver(</del><del>{ onError, onSuccess }</del><del>);</del></code></pre><br/><del>方案二(声网)</del><pre lang="TypeScript"><code><del>class MyObserver implements VeLivePlayerObserver {</del><br/><del>    onError(player, err) {</del><br/><del>        //</del><br/><del>    }</del><br/><del>}</del><br/><br/><del>const player =  new VideoLiveManager(null);</del><br/><del>const observer = new MyObserver();</del><br/><del>player.setObserver(observer);</del></code></pre></td></tr></tbody></table>

Android 使用 Proxy 动态代理回调函数。

```Java
Object dynamicObserver = Proxy.newProxyInstance(
  clazz.getClassLoader(), // 使用Observer接口的类加载器
  new Class[]{clazz}, // 指定要代理的接口
  (proxy, method, args) -> {
    System.out.println("Dynamic observer: " + method);
    return null;
  });
```

ios 使用 NSProxy 动态实现 protocol

```Objective-C
@interface ProxyObserver : NSProxy
@end

@implementation ProxyClass

- (instancetype)init {
    return self;
}

- (void)forwardInvocation:(NSInvocation *)invocation {
  NSString *methodName = NSStringFromSelector(invocation.selector);  
  NSLog(@"method is %@ arg", methodName);
}

@end
```



#### View

<whiteboard token="MoSTwB4PLhdr0DbyBvnc9Cp2n6g"></whiteboard>

1. 组件必须要 `viewId` `viewType` 属性。
2. Native 依据 `viewType` 创建相关 view 并注册 view。
3. 当 js 需要使用 view 的时候，传入 viewId 给 native.
4. Native 基于 viewId 查找



### 类型检查

https://gitHub.com/gristlabs/ts-interface-checker



### SDK 自动生成

#### 用户使用链路

> 通过 SDKHub 作为 Native 模块的数据源，经过cli自动生成最终的 React Native 项目。
> 
> 本期只做简化实现，cli 会在后续版本补充。

<whiteboard token="ThGwwY0BYh2HoHbH0FjcMLa2ntf"></whiteboard>

#### 模块组成

> Transformer Toolkit 作为核心的转换模块封装了统一封装了一套对外的接口，根据语言的类型不同，自助选择转换为不同语言。
> 
> 本期只实现了 Typescript  

<whiteboard token="Rck5wzTSShnI1IbRzGDc2dNznRb"></whiteboard>

#### Transformer Toolkit 的实现

1. transformer 会根据输入分别调用 android transformer 和 ios transformer。
2. 每个 transformer 内部会通过 ES6 template 的方式手动完成代码转换，最终会为每个平台生成一份 Typescript 的代码。
3. 完成转换后会写入到指定的文件夹当中。

<whiteboard token="Sug6wWQSxhPJWEbVpy1c9nRUnJe"></whiteboard>

#### 参数和返回值的类型映射

参数和返回值映射会别名：Typescript 别名：复杂类型正则难以处理的会使用 Typescript 当中的别名处理

举个例子：

- 如果是复杂类型例如 Android 当中的 List<String> 会分别在对应的 Typescript 当中的做 type 声明

```JavaScript
type String = string;
type List<T> = Array<T>;
....

export class xxx {
 
}
```

这些声明会追加到各个 Typescript 代码文件当中。

#### 处理 Import 关系引用

<whiteboard token="HJNHwymEuhQmMib2i66cW5kKnzd"></whiteboard>

1. 每一份Typescript文件是根据 SDKHub 生成的声明分析对象生成的，SDKHub 会分析 SDK 的源码声明得到一份 json 对象。按照下面这份代码，工具会生成两份 Typescript 文件分别为 API 和 errorcode。

```JavaScript
{
   "zh": {
      "API": {
         ....
       },
       "errorcode": {
          ....
       }
   }
}
```

1. 在 Native Type 到 Typescript Type 的转换过程当中，会收集两份数据：文件暴露了哪些 API，文件除却基础类型外，引用了哪些类型。

描述每个文件暴露 API 的对象

```JavaScript
const requireObject = {
   API: ['a', 'b', ....],
   ....
}
```

描述每个文件引用了哪些 API 的对象

```JavaScript
const providerObject = {
   API: ['d', 'e', ....],
   ....
}
```

1. 把 requireObject 和 providerObject 文件分别遍历，根据文件名做匹配，最终生成一份描述每个文件依赖的数据

```JavaScript
const genCodeMap = {
   API: {
      'errorCode': ['d', 'e', ....],
      'xxx': ['x', 'y', 'z']
   }
   ....
}
```

然后遍历生成最终的数据。

```JavaScript
// 生成最终引用图
const genImportCodeMap = (requireGraph: Record<string, Record<string, Set<string>>>): Record<string, string> => {
    const importCodeMap: Record<string,string> = {};
    Object.entries(requireGraph).map(([requireFileName, providerObject])=> {
        Reflect.set(importCodeMap, requireFileName, generateImportCodeStr(providerObject))
    })
    return importCodeMap;
}

// 生成最终的引用关系代码
const importCodeMap = genImportCodeMap(genRequireGraph(requireObject, providerObject));
```



## 接口定义

> 1，有新增/更改接口的需要有接口定义的描述：通讯方式，报文定义（IDL 或者 API 字段定义）
> 
> 2，接口安全措施（比如验签、接口鉴权、敏感信息脱敏和保护）
> 
> 3，接口幂等性考虑

<cite doc-id="EFiowLXyninMS3k4PyTcBbf0nZq" file-type="wiki" title="RN 通信消息协议" type="doc"></cite>





# 测试用例

<blockquote><p>在这里列出测试人员如何测试该功能，包括如何构建测试场景，如何观测日志、埋点。</p><p>用例设计方法参考：<cite doc-id="wikcn09E5A7pd3qT3RkJlK5Ka7f" file-type="wiki" title="RTC服务端-测试用例设计方法" type="doc"></cite> </p></blockquote>

<sheet sheet-id="LqLkEq" token="M9jdsGgSbhPMPBtalIxcQkrBnXe"></sheet>





# 验收结项

- 输出实际效果与预期目标的对比说明
- 输出性能监控大盘
- 输出QA测试报告



# 排期

> 大于2周的需求需要明确里程碑，两个里程碑之间的间隔不能大于两周

<cite doc-id="Zk2jw0Thwi0aYCknJI6cgHpjnNh" file-type="wiki" title="直播 ReactNative 工时统计" type="doc"></cite>



# 评审日志

## 评审问题记录

> 由评审人记录会上相关问题 TODO



## 投票

> 由评审人投票，评审不通过的人需要给出具体原因，超过 2/3 的通过率即通过技术评审。

<poll name="技术评审是否完备"></poll>





# 其他参考文档

<cite doc-id="OPFpdU8tQoUI3IxYhd7cUmMOnIe" file-type="docx" title="BytePlus Video Cloud跨平台SDK方案" type="doc"></cite>

<cite doc-id="S3nCdzWm1otwDrxT2WEcq8yfnIc" file-type="docx" title="跨平台SDK技术方案" type="doc"></cite>

<cite doc-id="Mut3dl6RxoJEZSxepPtcMUFvnad" file-type="docx" title="RN直播SDK技术调研" type="doc"></cite>

https://github.com/react-native-video/react-native-video

<cite doc-id="PMKIdXeaCoGYSBxBAAYcnU2unSb" file-type="docx" title="Flutter and React Native" type="doc"></cite>