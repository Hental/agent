---
source:
  - "https://bytedance.larkoffice.com/wiki/YWQew6593i8zXgk2nvLc65dXnIg"
source_title: "《交接下跨端 2024年10月28日》"
type: "meeting_summary"
summary: "交接下跨端 2024年10月28日。会议记录，含智能纪要；不能单独证明实现或收益。"
---
<title>交接下跨端 2024年10月28日</title>

# 会议信息

会议主题：交接下跨端

会议时间：10月28号（周一） 15:59 - 16:40 （GMT+08）

参会人：<cite type="user" user-id="ou_39073565b6c86488cc7009ffd471d5ed"></cite><cite type="user" user-id="ou_35e5132a34b30b2a839f67fe182bda9f"></cite>

相关链接：[开发指南](https://bytedance.larkoffice.com/wiki/FS5owi10EiryzBkEcZIcQSlfn5b)

# 智能纪要

> 智能纪要依据会议录制内容生成，不代表平台立场，请谨慎甄别后使用

<callout emoji="📄"><h2><b>总结</b></h2><p>会议讨论了项目开发、代码思路、发布流程以及相关技术问题，具体如下：</p><ul><li><b>项目开发与代码合并</b>：基于之前项目，将张世泽负责部分的逻辑合入，处理了安卓和iOS类型到TS类型的转换及合并，如将JSON Adapter中被弃用的部分进行清理。</li><li><b>目录与仓库处理</b>：对于空目录和被弃用的仓库，如code Generator，进行删除。</li><li><b>调试与路径配置</b>：通过本地路径和项目配置进行调试，如在企业直播中使用SDK时可通过此方式调试。</li><li><b>代码生成逻辑</b>：介绍了安卓和iOS的代码生成逻辑，包括初始化、构建、处理import和export关系等，将JSON转成type并生成TS文件。</li><li><b>多平台支持与合并</b>：生成代码不关心平台，只生成原信息，通过将安卓和iOS映射成TS再合并，处理了合并class、方法、回调函数等逻辑。</li><li><b>发布流程</b>：测试阶段建议用4位版本号，正式发布用3位。安卓通过Maven手动发布到内网，iOS通过Git仓库管理，发布时需注意文件配置，公网发布在bits进行，要与分支绑定。</li></ul><h2><b>待办</b></h2><checkbox done="false">刘韬补充文档中关于其他几个adapt项目的内容<cite type="user" user-id="ou_39073565b6c86488cc7009ffd471d5ed"></cite></checkbox><checkbox done="false">刘韬评估合并pack的工作量<cite type="user" user-id="ou_39073565b6c86488cc7009ffd471d5ed"></cite></checkbox><checkbox done="false">刘韬发送相关代码仓库给张世泽<cite type="user" user-id="ou_39073565b6c86488cc7009ffd471d5ed"></cite></checkbox><h2><b>智能章节</b></h2><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=1000">00:01</a><b>  刘韬讲述项目开发思路、代码合并及发布，与张世泽讨论项目中的弃用内容</b></p><blockquote><p>本章节刘韬主要讲了两个方面，一是开发的代码思路，二是发布相关。项目基于之前的项目，他把张世泽逻辑合并进来，因有代码重叠。还提到JSON Adapter右上角的package要弃用并入core，code Generator空仓库应被弃用，刘韬提到某个逻辑为空未写，最后刘韬让张世泽查看他的文档。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=201000">03:21</a><b>  刘韬向张世泽讲解代码逻辑，包括runtime、库的作用、调试相关、mode的拼接方式以及code进里的函数</b></p><blockquote><p>本章节主要讨论了与调试相关的内容，提到runtime和几库用于调试，mode通过MJS model js动态引进且使用项目配置。还讲述了code进的逻辑，其中有三个主要函数涉及安卓和iOS相关操作，之后详细阐述了安卓方面的一些步骤，包括generator、build以及核心逻辑中的JSON转type等。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=427000">07:07</a><b>  代码生成的思路、平台通用性及相关逻辑处理</b></p><blockquote><p>本章节主要讨论代码处理相关内容。包括对之前手动写的seal处理方式的讨论，不同语言如Object C、Java等处理思路相似。还提到代码生成在架构设计中多平台共用，生成主要是元信息，不依赖平台。同时也阐述了程序执行过程中的类型处理、合并逻辑以及两个库的分工等内容。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=919000">15:19</a><b>  在process API中处理配置，可将类型从interface改为class并忽略不需要的配置</b></p><blockquote><p>本章节主要讨论了处理相关的操作，大概率是在process API里进行，而非在config.js里。提到原来类型可能是IRTC video（接口形式），可能需改成类的形式，还讲到大部分配置与目录相关，主要是配置类路径，要忽略一些不需要且用不上的部分。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=1002000">16:42</a><b>  原生对象数据传递需求未实现及项目相关技术讨论</b></p><blockquote><p>本章节先是讨论了原生对象（如图像帧数据、音频数据）的传递，有需求但目前还未实现。接着提到张世泽想获取adapt项目，刘韬表示会完善相关文档。然后对项目中的代码思路、边界条件、unit项目、flutter相关的代码改动、product相关以及flutter移动端的建议等内容也进行了交流探讨。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=1261000">21:01</a><b>  张世泽与刘韬讨论项目中的复用、工作量评估及unit转化相关问题</b></p><blockquote><p>本章节主要讨论了涉及election可能带来的问题，提到计算方面复用东西不多且工作量大。还谈及unit转化的状态，刘韬的learning项目API能调通但组件渲染有问题，unit整体实现基本没问题但代码复用较麻烦，最后阐述了runtime核心在于四个方面的功能。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=1447000">24:07</a><b>  自动生成层不受支持in和Uni版本的影响，runtime侧做兼容</b></p><blockquote><p>本章节主要讨论了对in和Uni版本的支持定义相关问题。提到在自动生成层不影响，在代码生成方面何静负责的部分未动，主要是runtime部分。还指出与客户相关联处在TS装饰器中，它只需定义必要信息，而on或uning以及兼容侧的东西都在runtime侧做兼容。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=1521000">25:21</a><b>  项目中低版本支持情况、代码结构与调试发布相关事宜</b></p><blockquote><p>本章节主要讨论了版本支持相关内容，低版本支持已合入组分，RN能支持到23。还提及iOS和安卓在入口时间代理、消息处理等方面逻辑相同，TS的逻辑在bridge文件夹下。同时阐述了调试方法、runtime相关的修改、依赖关系以及发布相关的内容，包括JS代码修改后的处理等。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=1859000">30:59</a><b>  软件发布相关流程与注意事项</b></p><blockquote><p>本章节主要讨论了发布相关内容。暂时没有自动发布需手动发布。测试阶段建议用4位版本号，正式发布改为3位。不同情况发布有所区别，如iOS发布时若新增文件需特殊处理，内网和公网发布有不同要求，公网发布需与分支绑定并选对应版本分支。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=2098000">34:58</a><b>  软件版本发布流程及业务对接进度</b></p><blockquote><p>本章节主要讨论了软件版本发布相关内容，测试版1.2.2会先在内网发布正式版，然后同步到公网。此外还提到企业直播业务的对接情况，计划Q4进行，他们上次简单聊过之后没再联系，进度似乎不快，安卓Demo已成功但iOS未调通，iOS目前还在试Demo。</p></blockquote><p><a href="https://bytedance.larkoffice.com/minutes/obcnk97me137l68q481115nt?t=2212000">36:52</a><b>  张世泽与刘韬关于项目开发规划与注意事项的讨论</b></p><blockquote><p>本章节主要讨论了工作中的一些事项。自动生成暂不支持UI映射，需看竞品情况。张世泽下季度要做electron、小程序、flutter三个方案，还涉及接Uni，开发量不大重点是模式跑通与最佳实践，此外刘韬会给张世泽发送相关代码仓库。</p></blockquote></callout>

<readonly-block type="isv"></readonly-block>

# 会议回顾

<readonly-block href="https://bytedance.larkoffice.com/minutes/embed/obcnk97me137l68q481115nt?from=ccm" type="iframe"></readonly-block>

# 会议议程