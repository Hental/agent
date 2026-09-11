---
source:
  - "https://bytedance.larkoffice.com/docx/VEqedXzgEojTDGxafKQcREx6nOd"
source_title: "《简历》"
type: "document_snapshot"
summary: "本人旧简历。原文快照；目标、进展和实际结果按原文区分。"
---
# 个人信息

[@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) 
- 刘韬/男/1995
- 本科/四川大学/信息管理与信息系统/2017年毕业
- 工作年限：7年

# 工作经历

## 字节跳动 - 视频云前端（2022.10 ~ 至今）

### 业务背景

视频云提供点播、直播、实时音视频等 Pass 产品，支持内部抖音、飞书客户，外部 ToB 客户。
视频云前端其中负责；
- 火山引擎控制台/内部运营平台：PC 中后台应用，for 外部客户和内部运营使用，提供管理应用、查看账单等功能。
- Web SDK：封装音视频的能力，以 SDK 的方式提供给内外部客户使用。
- Web 解决方案：支持客户的接入和售后，帮忙客户接入，处理 oncall 问题，输出最佳实践等。

我在团队中主要负责互动白板 SDK 和 WebRTC 解决方案。 

### 项目：跨端 SDK⾃动⽣成（2024.03 ~ 至今）

#### 业务背景

在商业化进程中，不少外部客户提出 ReactNative/Uniapp SDK 的诉求，同时竞品也都有提供  ReactNative/Uniapp SDK ，因此火山引擎也需要建设 ReactNative/Uniapp SDK，但是遇到了以下问题
1. 从 0 到 1 建设会涉及大量的 API，开发周期长，时间风险高。
1. 大量的工作只是 API 的简单封装，roi 低。

因此，我们开始探索自动生成方案，在满足客户的前提下提升效能。

#### 技术设计

[跨端 SDK 自动生成方案设计](https://bytedance.larkoffice.com/wiki/NVnNwo9tqiGZX4k05s9cTDjMnDe)
![```mermaid\nflowchart TD\n    o1_2(\["提交代码"\])\n    o1_11(\["cli 工具"\])\n    o1_12(\["跨端SDK\n(TS)"\])\n    o1_3\["SDKHub"\]\n    o1_9\["Maven\nCocopod"\]\n    subgraph o1_18 \["Native 环境"\]\n        o1_13(\["Hybrid\nRuntime"\])\n        o1_14(\["Native SDK"\])\n    end\n\n    p1_2 --> o1_2\n    o1_11 <-->|拉取 API 信息| o1_3\n    o1_2 -->|推送 Native SDK| o1_9\n    o1_11 -->|自动生成| o1_12\n    o1_2 -->|推送 API\n（JSON）| o1_3\n    o1_12 <-->|ipc(json)| o1_13\n    p1_4 --> o1_11\n    o1_9 --> o1_14\n    o1_13 <-->|Reflect 动态调用| o1_14\n```\n\n> Native 开发\n\n> 跨端 SDK 开发](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/fa9121eb-db9a-47a2-8542-179059a73e9a.png)

1. 获取 Android/iOS SDK 中的 API 信息。

基于开源的 doxygen 工具二次开发，解析出 API 信息，存储在 tos 中。
1. 自动生成 ts 代码

基于步骤 1 获取到 json，按照一系列的规则转换成对应的 ts 代码。
1. 在运⾏时 ts 侧通过框架提供的 ipc 机制传递 json 给 native，在 native 侧通过语言提供的反射机制调用 android/ios sdk。

#### 业务进度

2024Q2完成了跨端 SDK 自动生成方案从 0 到 1的建设，覆盖 React Nativr 框架，在直播场景落地。
 - 直播  ReactNative 拉流SDK，涉及API 69  个，能效提升 45d（非自动方案评估人力） -> 13d
 - 直播  ReactNative 推流SDK，涉及API 242个，能效提升 50d（非自动方案评估人力） -> 19d

### 项目：火山互动⽩板（2022.10 - 2024.03）

#### 业务背景

[VeWhiteboard Solution](https://bytedance.larkoffice.com/wiki/JMOew1MsbiyAlckQuhecdIRcn6e)
互动白板是一个实时在线的的共享空间，允许多人同时协作和实时互动，团队成员可以同步书写、绘制、突出显示、标记文档。
火山互动白板是火山引擎旗下的一款 Pass 产品，基于实时信令网络，提供一整套完整的互动白板解决方案，客户端 SDK 覆盖 iOS、Android、Web 、小程序等主流平台，同时提供完整的服务端配套功能，可用于在线教育、云端会议、游戏娱乐、金融面签等场景。

#### 技术设计

![```mermaid\nflowchart TD\n    subgraph o13_16 \["稳定性"\]\n        o13_22(\["Trace"\])\n        o13_20(\["埋点上报"\])\n        o13_21(\["日志系统"\])\n        o1_494(\["CI/CD"\])\n    end\n    subgraph o5_22 \["光标"\]\n        o13_37(\["光标展示"\])\n        o5_23(\["同步光标"\])\n    end\n    subgraph o1_49 \["房间回放"\]\n        o13_31(\["跳转进度"\])\n        o1_51(\["播放/暂停"\])\n    end\n    subgraph o1_499 \["&nbsp;"\]\n        subgraph o1_495 \["&nbsp;"\]\n            o1_496(\["白板服务"\])\n            o1_497(\["静态转码服务"\])\n            o1_498(\["动态转码服务"\])\n        end\n        subgraph o1_484 \["&nbsp;"\]\n            o1_486\["RDS"\]\n            o1_487\["Redis"\]\n        end\n    end\n    subgraph o1_492 \["&nbsp;"\]\n        o1_31(\["微信小程序 SDK"\])\n        subgraph o5_14 \["&nbsp;"\]\n            subgraph o13_33 \["快照"\]\n                o13_34(\["保存当前页快照"\])\n            end\n            subgraph o13_46 \["富交互内容"\]\n                o13_47(\["动态 PPT"\])\n                o13_48(\["音视频"\])\n            end\n        end\n        o13_5(\["兼容适配"\])\n        subgraph o13_38 \["&nbsp;"\]\n            o5_4(\["proto 数据处理"\])\n            o13_39(\["发送队列"\])\n            o1_500(\["数据一致性监测"\])\n            o5_3(\["冲突处理"\])\n            o5_2(\["图形数据转换"\])\n        end\n        subgraph o5_6 \["小程序 Canvas"\]\n            o2_7(\["缩放"\])\n            o1_493(\["图形绘制"\])\n        end\n        o5_10(\["Android/iOS SDK"\])\n        subgraph o5_9 \["Web Canvas"\]\n            o13_12(\["鼠标"\])\n            o13_10(\["快捷键"\])\n            o13_9(\["时间穿梭"\])\n            o13_11(\["Input 事件"\])\n            o13_8(\["图形绘制"\])\n            o13_14(\["图形控制"\])\n            o13_13(\["缩放"\])\n        end\n        subgraph o5_11 \["Hybrid 桥接层"\]\n            o13_4(\["JSBridge"\])\n        end\n        o5_8(\["Web SDK"\])\n        o13_6(\["Native 代理"\])\n    end\n    subgraph o13_23 \["&nbsp;"\]\n        o13_24(\["RTS"\])\n        o13_25(\["WebSocket"\])\n        o13_30(\["HTTP"\])\n    end\n    subgraph o5_19 \["网络质量"\]\n        o5_20(\["网络监控"\])\n        o13_26(\["断网处理"\])\n    end\n    subgraph o5_26 \["时间"\]\n        o5_27(\["时间校准"\])\n    end\n    subgraph o13_43 \["缩放"\]\n        o13_44(\["同步缩放"\])\n        o13_45(\["事件响应"\])\n    end\n    o13_3(\["协议处理"\])\n\n    o13_38 --> o5_14\n    o1_31 <--- o5_6\n    o5_6 <--- o5_14\n    o13_38 --> o5_14\n    o5_8 <--- o5_9\n    o1_495 --> o13_23\n    o1_484 --> o1_495\n    o5_10 <--- o5_11\n    o1_484 --> o1_495\n    o5_11 <--- o5_9\n    o1_495 --> o13_23\n    o5_9 <--- o5_14\n    o13_23 --> o13_38\n```\n\n> 通用模块\n\n> 网络层\n\n> 数据层\n\n> 数据同步\n\n> 客户端\n\n> 渲染\n\n> 服务层\n\n> Server](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/c715bd4b-a292-451b-9fd4-8faafef74544.png)

- 数据层：选用关联性数据库 RDS/Redis 存储绘制数据。
- 服务层：提供持久化存储，消息转发，文件转码的能力。
- 网络层：使用 RTS 或者 WebSocket 提供全双工数据能力， 优先使用 RTS  传输数据，在环境中降级到 WebSocket 协议。
- 数据同步：收发数据，编解码数据，处理数据冲突。
- 通用模块：把能力封装成单独的模块，模块之间彼此独立，通过模块组合串联的方式解决业务诉求，
- 渲染：抽象出通用的接口设计，分别适配微信小程序 Canvas 和标准 Canvas。

低延迟通信
依托于完善 RTS 信令网络，用户通过 ice 协议和最近的边缘节点建立低延时的全双工网络通道，数据传输时还会通过 Protobuf 序列化来压缩消息体大小，端到端延迟 p95 在 100ms 以内。

多人协作
![```mermaid\nflowchart TD\n    o1_151\["Redis"\]\n    o22_4(\["白板用户A"\])\n    o1_148\["同步修改"\]\n    o1_143\["白板服务"\]\n    o13_3(\["白板用户  B"\])\n\n    o1_143 -->|5. 同步修改给其他用户| o1_148\n    o1_148 --> o13_3\n    o1_143 -->|2. 存储锁| o1_151\n    o22_4 -->|3. 修改元素| o1_143\n    o22_4 -->|1. 申请对图形上锁| o1_143\n    o13_3 -->|1. 申请修改元素| o1_143\n    o1_143 -->|2. 没有权限，返回 Conflict| o13_3\n```](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/d571ad8a-55b3-4fc7-bd58-aa6a611de7a5.png)

由于互动白板的业务特点：
- 画板是由图形元素组成，各图形元素独立互不影响。
- 通常1-2人操作，其他用户观看。

因此采用了悲观锁的方式保证数据不冲突。
锁粒度：
- 白板元素：在白板绘制时锁定当前绘制的白板元素，其他元素不影响。
- 白板：在白板维度上操作时会锁定整个白板，比如：新增、删除、切换白板页。

#### 业务进度

- 完成产品能力的建设，支持 android/ios/web/小程序多个端，功能基本对齐竞品。
- 内部接入 2 个客户，外部接入 3 个客户。

## 字节跳动  - 广告落地页前端（2020.10 - 2022.10）

### 业务背景

在广告投放中落地页承载了广告内容，比如：应用下载落地页，汽车预约试驾落地页。
橙子建站是专注服务于广告主的落地页制作工具，提供无代码搭建落地页工具和丰富的组件物料，帮助广告主无需设计能力也能通过拖拽的方式快速搭建落地页。
### 项目：落地页移动端编辑器

#### 业务背景

落地页移动端编辑器是专注于移动端的落地页制作工具，帮助中小用户在移动端快速搭建落地页用于广告投放。
⽤⼾使⽤模板新建落地⻚，通过编辑器⼆次编辑。
#### 技术设计

![```mermaid\nflowchart TD\n    o1_14\["落地页编辑器"\]\n    o1_15\["生成落地页"\]\n    o1_501\["新增服务"\]\n    o1_1\["组件管理服务\nad.tetris.compontent_amin"\]\n    o1_16\["橙子工作台"\]\n    o1_20\["CDN"\]\n    o1_167\["bff 服务 \n\[ad.tetris.selfcreative\](http://cloud-boe.bytedance.net/paas/services/165213?module=cluster)"\]\n    o1_168(\["落地页渲染服务"\])\n    o1_12\["模板管理服务\nad.tetris.intellect_template"\]\n    o2_3(\["广告"\])\n    o1_18(\["组件开发"\])\n\n    o1_15 -.->|广告投放| p2_2\n    o1_167 -.-> o1_14\n    p1_2 --> o1_16\n    p2_2 -->|抖音访问| o2_3\n    o2_3 --> o1_168\n    o1_14 --> o1_167\n    p1_1 -->|dou+ 入口| o1_14\n    o1_18 -.->|资源上传到 Tos 和 CDN| o1_20\n    o2_3 <---|动态加载组件| o1_20\n    p1_3 -->|组件开发工具| o1_18\n    o1_167 -->|拉取模版| o1_12\n    o1_12 -.-> o1_167\n    o1_1 -.-> o1_168\n    o1_167 --> o1_15\n    o1_16 -->|录入模版| o1_12\n    o1_18 -->|发布组件| o1_1\n    o1_168 -.->|落地页| o2_3\n    o1_168 -->|拉取\n组件\n资源| o1_1\n```\n\n> 组件开发者\n\n> 用户\n\n> 广告主\n\n> 设计师\n\n> 图例](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/7d0edfcb-d0a6-4a28-8918-90369e5f2af5.png)

1. 设计师通过橙子工作台服务录入落地页模版
1. 组件开发者通过组件开发工具提供组件资源
1. 广告主通过自助创意工具创建落地页，在广告进行投放
1. 用户在使用抖音过程中，访问落地页，完成广告转化。

#### 业务进度

1. 完成移动端落地⻚编辑器的设计和开发，在 dou+ 平台落地，落地页生成日均有消耗站点数87，日均消耗1.7w+。
1. 搭建落地页模版管理后台，管理模版 300+。

## 携程 (2018/06 ~ 2020.10.19 )

### 业务背景

隶属于 IBU 国际事业部公共前端开发组，负责[携程国际化](https://www.trip.com/)站点的相关开发维护工作。
### 项目：Foxpage 页面搭建平台

#### 业务背景

给内部运营使用，提供低代码营销⻚⾯工具，帮助运营快速搭建酒店、机票促销页面。
#### 职责

主要负责前端组件化、前端工程化、页面可视化搭建等工作。
- 负责 C 端渲染的设计和实现。
- 负责组件开发⼯具的设计和实现。

#### 成果

⽀持携程国际 95% 营销⻚⾯的搭建。 1 年内上线了 1200+ ⻚⾯，营销⻚⾯开发时间从 40h 缩短⾄ 2h。