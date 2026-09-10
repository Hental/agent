# 会议信息

会议主题：交接 RTC & 白板
会议时间：10月30号（周三） 14:19 - 15:13 （GMT+08）
参会人：[@刘韬(liutao.fe)](mailto:liutao.fe@bytedance.com) [@赖博雅(laiboya)](mailto:laiboya@bytedance.com) [@阙名毅(quemingyi.wudong)](mailto:quemingyi.wudong@bytedance.com) [@王威(wangwei.shihai)](mailto:wangwei.shihai@bytedance.com) 
相关链接：[ 【技术方案】Flutter 适配 Web/PC](https://bytedance.larkoffice.com/wiki/FU1CwMFPOi7iESkRUNOc15cGnXb), [RTC & 互动白板交接文档](https://bytedance.larkoffice.com/docx/KGsYdrCYdolfygx5UKnc4NQrnyd), [RTC Flutter Web](https://bytedance.larkoffice.com/wiki/JgkRwDvu8iXAjek1af4cDYabnlh)
# 智能纪要

> 智能纪要依据会议录制内容生成，不代表平台立场，请谨慎甄别后使用
> [!NOTE]
> ## **总结**
> 会议讨论了关于work、Uni APP、白板等项目的进展和相关问题，具体如下：
> - **work项目**：上个Q有在发的web上适配work PC的需求，目前本地业务的bug待修复，修复进度需确认。新增Web文件夹，通过在window上挂载变量和回调方法实现与flutter的交互，开发方式是根据时间和传参数据结构做对应实现。
> - **Uni APP项目**：目前只有老版本，未上common，有SDK和记录文档。客户较小，问题不多，通过oncall群解答。注意Uni APP编译成不同应用可能需不同SDK，常见问题如room ID传参类型错误。
> - **白板项目**：与WPS合作，通过在Web Demo上传PPT复现问题，获取file ID和talking补充在反馈文档，由WPS确认问题和给出修复排期。目前环境配置存在测试限制，WPS应用与自身环境数量不匹配。
> - **项目交付时间**：work项目因native还在修bug，未确定交付时间，需等bug修复并重新提测后再定。
> - **项目人员分工**：REC native由名毅负责，flutter由王威负责，Uni APP由赖博雅负责。
> - **WPS合作相关**：通过给WPS文件获取file ID，WPS内部转码，前端用file ID加载。转码服务通过top TIER提前检测文件能否打开，缓存作用在于加快第二次打开和渲染时依赖内容的加载。NODE服务主要检测文件能否打开及一些相关问题。WPS授权费分档位，QPS按同一文档同时打开人数计算。
> ## **待办**
> - [ ] 将WPS应用和自身环境数量少一个的问题补充在文档
> ## **智能章节**
> [00:13](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=13000)**  项目中的web、全unit APP和白板相关工作的进展、方案及后续安排**
> 本章节主要分为三块内容，分别是web、全unit APP和白板。针对web这块，讲述了项目相关内容，包括目录结构、新增Web文件做SDK分装、Web与其他端交互的方式、开发方式、组件相关以及后续提测可能的情况等。
> [07:07](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=427000)**  项目交接中的相关事项讨论，包括交付时间、APP支持方式、白板问题反馈等**
> 本章节首先提到交付时间待定，因为native在修bug且未确定排期。然后进行工作交接，赖博雅选择负责Uni APP，王威负责flutter。接着讲述了Uni APP相关的支持方式、注意事项等，最后还对白板的相关工作如动态转码等进行了说明。
> [18:29](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=1109000)**  典型OK LPS的使用方式及相关资源获取、转码与进度显示**
> 本章节主要讨论典型的OK LPS的使用。提到会给WPS提供应用ID、文件ID，WPS通过ID从租户获取对应资源，转码由SDK内部进行，SDK会将网页链接拼出给自身服务，转码完成后用文件ID加载在线PPT文件，SDK会给前端提供部署进度，遇到问题反馈后可通过重新上传或升级SDK解决。
> [24:47](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=1487000)**  白板上渲染icon与iPhone相关操作及文件转码服务的讨论**
> 本章节主要讨论了几个技术相关的问题。一是将icon直接渲染在白板上的操作方式；二是选择WPS路线的原因是其兼容性较好；三是关于文件上传到task的流程，涉及存储ID、转码、缓存等相关操作，以及转码服务与top tier的关系。
> [30:32](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=1832000)**  top TR的作用及缓存相关问题探讨**
> 本章节主要探讨了top TR的作用，其用于在用户使用前检测文件能否打开对齐，WPS提供的SDK可检测文件是否损坏，失败会抛出错误。还提及top TIER与Web SDK、API的关系。另外探讨了缓存，缓存可在文件转码后加快再次打开的速度，还涉及前端显示内容时与PUB tier访问链接的关系。
> [33:55](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2035000)**  关于WPS文件转码、缓存及相关服务端功能的讨论**
> 本章节主要讨论了资源的缓存与服务相关的问题。提到资源缓存于服务上，API相关内容，如open API在全端且是统一出口，NODE服务主要检查文件是否能打开及相关检测，缓存触发时机是加载PPT时发现无缓存或缓存过期，而渲染PPT时会触发其依赖东西的缓存等内容。
> [37:52](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2272000)**  主播用LPS SDK渲染时缓存判断及相关功能下前端显示与iPhone访问地址的讨论**
> 本章节主要讨论了主播使用LPS SDK渲染时缓存判断相关内容，明确由XPS自己判断是否有缓存。还提及若PS能提供检测文件是否能打开的功能则可以进行后续操作，另外对于iPhone访问地址相关进行了交流，提到iPhone由其本身提供服务，只需告知APP ID token等内容。
> [40:19](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2419000)**  关于服务配置（如NODE服务的核数）及动态转码相关问题的讨论**
> 本章节主要围绕服务配置展开讨论。说话人2好奇服务的配置情况，提到动态转码次数多、NODE服务要对齐启动件等内容，还提及多个tab会出错的情况，说话人1表示对于tab新开就好，并且提到因为是内部人员，时效性要求不高等内容。
> [42:02](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2522000)**  关于预览服务、PS服务的工具开发及相关配置讨论**
> 本章节主要围绕预览服务展开讨论。说话人1提到这是自己开发的工具，PS服务正常测试后会全部播出。说话人2询问配置相关问题，还提到是否可以直接复制的问题，说话人1表示低配的配置为0.5C、0.5CEC，一台EC1G的可能用一个核、1G内存。
> [43:37](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2617000)**  关于机房实体数量的讨论，认为60个偏多且低配，提及成本不用自己掏钱**
> 本章节主要讨论了相关配置的高低配问题，提及两核两g内存属于很低配，常驻实体有60个，可发展南方20个等情况，还讨论了机房实体数量为60个，提到某种情况比TCE便宜一点，最后表示不用自己掏钱，感觉运维成本可由收入覆盖。
> [44:38](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2678000)**  WPS收费标准及QPS计算对业务的影响**
> 本章节主要讨论了WPS的收费情况，其一年授权费8万，售卖价6万，最低档一年2万。同时提到了QPS限制，QPS按同一文档被多少人同时打开算转码，转码为一分钟，即便很多人上课，只要一人打开文档观看只算一次，这个数据量变化不大，最初最高好像是400 - 500人。
> [45:45](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2745000)**  转码成本与收入、RTC平台相关及转码中的问题讨论**
> 本章节主要讨论了转码相关的成本与收入问题，提到平台RTC下成本可约、收入可忽略不计。还谈及转码的必要性，如代码搬到Web上需要做处理，过程中可能会遇到协议未考虑到Web情况而产生的问题，但目前有些问题没有想象中复杂，也提到区域化以及自研效率的相关调研等内容。
> [47:46](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2866000)**  WPS客户端竞争力强，其他产品多选择与其对齐**
> 本章节主要讨论了一些办公软件相关内容。提到有产品标准一样但效果不佳，在目标接入方面探讨了WPS客户端相关实现对齐成本等，认为在WPS竞争力上难以超过它，还提及飞书的在线场景转码情况，以及腾讯有文档、编码、备用编码且主推发PS内容的情况。
> [48:56](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2936000)**  公式编辑器使用开源库后的存储与转换问题**
> 本章节主要围绕公式编辑器展开讨论。公式编辑器是找开源库，编辑后的结果存储类似于图形处理，需将会议内容转换为数据结构存储再反解渲染。对于公式要转换为标准文本格式存储在后端，最后还提及公司内的复杂活动，但未深入探讨转换方式。
> [49:59](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?t=2999000)**  高校场景下服务号支持不足及白板绘制相关问题的讨论**
> 本章节主要围绕服务号支持不足的问题展开，涉及高校场景下前沿科学内容可能未入标准的情况。还讨论了画笔绘制相关，如mouse move事件的记录、基线算法等，并且对画布相关问题进行了交流，包括画幅尺寸、单位换算、画面与画布比例等。最后提及会议未关闭的情况。
>
> **[文档小组件]**
> - 类型: blk_605344f606400001a416289a
> - docTenantID: 1
> - meetingID: 7431448895061032961
> - sourceChapter: 1
> - sourceSummary: 4
> - sourceTodo: 1

# 会议回顾

[Iframe](https://bytedance.larkoffice.com/minutes/obcnmkbvpz9175kc8b7q449g?from=ai_minutes)

# 会议议程

# **RTC  Flutter Web **[@王威(wangwei.shihai)](mailto:wangwei.shihai@bytedance.com)

## 需求背景

[Flutter跨平台SDK适配PC/Web - [需求同步群]](https://applink.larkoffice.com/client/chat/open?chatId=oc_76f738647069b4a3db6e57511a4f485a)

[RTC Flutter Web](https://bytedance.larkoffice.com/wiki/JgkRwDvu8iXAjek1af4cDYabnlh)
[ 【技术方案】Flutter 适配 Web/PC](https://bytedance.larkoffice.com/wiki/FU1CwMFPOi7iESkRUNOc15cGnXb)
RTC Flutter SDK 是基于 android/ios/web sdk 接口的封装
本次需求需要基于 vertc-web sdk 封装，支持 flutter web

## 现状

开发完成，待 native 待重新提测

## TODO

- 跟进测试，完成交付

# RTC uni-app [@赖博雅(laiboya)](mailto:laiboya@bytedance.com)

[RTC uni-app SDK](https://bytedance.larkoffice.com/wiki/NtZmwiSmpiAlfckaftxcfZKLnEf)

# 互动白板 [@阙名毅(quemingyi.wudong)](mailto:quemingyi.wudong@bytedance.com)

[VeWhiteboard Solution](https://bytedance.larkoffice.com/wiki/JMOew1MsbiyAlckQuhecdIRcn6e?chunked=false)
[RTC SDK & Demo & Example前端支持OnePage](https://bytedance.larkoffice.com/docx/QmVSdARjtoeW5lxKsXRccwTHn8b)
[互动白板排查相关总结](https://bytedance.larkoffice.com/docx/OdUSdTyF7o0j8oxKIUNcXWelnhf)
<table data-lark-table="docx-table" data-block-id="RROid3qY2oJ6rHxiwwLcDYK6nch"><thead><tr><th></th><th>说明</th><th>相关文档</th></tr></thead><tbody><tr><th>web SDK</th><td></td><td><a href="https://bytedance.larkoffice.com/wiki/Fjy2wp3nxiA4c4klry2cWReAn9f?chunked=false">互动白板快速开始</a></td></tr><tr><th>android/ios SDK</th><td>webview 套壳<br />native <a href="mailto:zhuhongshuyu@bytedance.com">@朱红姝雨(zhuhongshuyu)</a></td><td><a href="https://bytedance.larkoffice.com/wiki/A3yowcJX9ilsOrkNVPZc4H7cnZc?chunked=false">移动端 SDK 开发</a></td></tr><tr><th>动态转码服务</th><td><a href="https://bytedance.larkoffice.com/wiki/WRgtwphAAi9HZPkIeD2cNlNFn8X">WPS</a></td><td></td></tr><tr><th>快速开始 demo</th><td></td><td><a href="https://bytedance.larkoffice.com/wiki/XqtOwhUnIiZjllkx5v9cYM9mnZe?chunked=false">互动白板快速开始 Demo</a></td></tr><tr><th>微信小程序</th><td>for “小鹅通”，但是没有接入，目前没有人使用</td><td></td></tr></tbody></table>