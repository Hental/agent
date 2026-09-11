# 跨端 SDK 自动生成

整理日期：2026-09-11。仅归纳原文明确记录；“方案”不视为完成，“代码阅读摘要”不视为运行收益。个人补充与纠正另见 [用户确认记录](../user-confirmed.md)。

## 背景与问题

### sdk-01

客户提出 React Native／UniApp SDK 需求；从零建设涉及大量 API，开发周期长，且大量工作是简单 API 封装。

证据类型：原文记录。

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 34 行。摘录：

  > 从 0 到 1 建设会涉及大量的 API，开发周期长，时间风险高。

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 35 行。摘录：

  > 大量的工作只是 API 的简单封装，roi 低。

## 时间与职责

### sdk-02

旧简历标明项目从 2024.03 开始；运行时设计首稿日期为 2024.03.28；另有 2024 年 10 月 28 日的跨端交接会议记录。

证据类型：原文记录。

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 29 行。摘录：

  > 跨端 SDK⾃动⽣成（2024.03 ~ 至今）

- [s29 · 跨平台方案运行时设计](../../sources/supplemental/s29-sdk-runtime.md)，原文第 18 行。摘录：

  > 2024.03.28

- [s30 · 交接下跨端 2024年10月28日](../../sources/supplemental/s30-sdk-handover.md)，原文第 8 行。摘录：

  > 交接下跨端 2024年10月28日

使用边界：10 月是交接事件，不能单凭它推断项目结束或本人之后没有参与；当前简历展示周期为 2024.03—2024.10，应理解为已采用的展示范围。独立负责范围见用户确认。

## 关键技术与实施状态

### sdk-03

旧简历记录基于 Doxygen 提取 Android／iOS API 信息、转换为 JSON，再生成 TypeScript；运行时经 IPC 传输 JSON，由 Native 反射调用 SDK。

证据类型：原文记录。

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 46 行。摘录：

  > 基于开源的 doxygen 工具二次开发，解析出 API 信息

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 49 行。摘录：

  > 按照一系列的规则转换成对应的 ts 代码。

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 50 行。摘录：

  > 在 native 侧通过语言提供的反射机制调用 android/ios sdk。

### sdk-04

运行时设计以 instanceId 关联原生对象、callbackId 关联回调，描述了 JS 与 Native 之间的事件监听和派发。

证据类型：方案记录。

- [s29 · 跨平台方案运行时设计](../../sources/supplemental/s29-sdk-runtime.md)，原文第 134 行。摘录：

  > 消息通信无法传输实例引用，因此我们使用 `instanceId` 替代对象，关联真正的实例。

- [s29 · 跨平台方案运行时设计](../../sources/supplemental/s29-sdk-runtime.md)，原文第 146 行。摘录：

  > 在消息传输中携带实例 `callbackId`，关联实际的回调函数。

使用边界：设计文档支持具体机制，不证明每个设计分支都已实现。

## 结果与指标

### sdk-05

旧简历记录 2024 Q2 完成生成方案从零到一，在直播 React Native 场景落地；拉流涉及 69 个 API，推流涉及 242 个 API。

证据类型：原文记录。

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 55 行。摘录：

  > 直播  ReactNative 拉流SDK，涉及API 69  个

- [s4 · 本人旧简历](../../sources/00_公共资料/04-old-resume.md)，原文第 56 行。摘录：

  > 直播  ReactNative 推流SDK，涉及API 242个

使用边界：69+242=311 是两类 SDK 计数之和，不是跨 SDK 去重数，不自动等于全部自动生成数。

### sdk-06

点播工时总结记录开发加测试 19 人天，手写开发测试预估 39 人天；Roadmap 的业务工作负责人为熊雄。

证据类型：原文记录。

- [s25 · 点播 ReactNative SDK 工时统计](../../sources/supplemental/s25-sdk-vod-effort.md)，原文第 14 行。摘录：

  > 开发 + 测试：19pd

- [s25 · 点播 ReactNative SDK 工时统计](../../sources/supplemental/s25-sdk-vod-effort.md)，原文第 15 行。摘录：

  > 预估手写开发时间：39

- [s25 · 点播 ReactNative SDK 工时统计](../../sources/supplemental/s25-sdk-vod-effort.md)，原文第 31 行。摘录：

  > 熊雄

使用边界：属于方案复用后的业务团队投入，不是本人单独完成的全部开发测试。

## 统计边界与冲突

### sdk-07

点播工时的 54 个 API 分类包括手写 API、7 个自动生成 API、手写回调和初始化；技术评审另有 Native 方法／属性／类型直接生成与 Mapping 生成。

证据类型：原文记录。

- [s25 · 点播 ReactNative SDK 工时统计](../../sources/supplemental/s25-sdk-vod-effort.md)，原文第 51 行。摘录：

  > 7：自动生成 api

- [s27 · 点播 React Native 播放器技术评审](../../sources/supplemental/s27-sdk-vod-design.md)，原文第 54 行。摘录：

  > 直接通过lux的codegen生成方法、属性和类型

- [s27 · 点播 React Native 播放器技术评审](../../sources/supplemental/s27-sdk-vod-design.md)，原文第 77 行。摘录：

  > Mapping 配置自动生成 class、 属性、方法及类型

使用边界：不能把 7 解释为整个生成工具的全部产出，也不能据此猜一个更大数量。简历不展示 54／7。

### sdk-08

直播推流工时写明 50 人天预估对比 36 人天基建加自动化生成人力；拉流标题写 13 人天，下面另列其他人员投入。

证据类型：原文记录。

- [s24 · 直播 ReactNative 工时统计](../../sources/supplemental/s24-sdk-live-effort.md)，原文第 24 行。摘录：

  > 50d（非自动方案评估人力） -> 36d

- [s24 · 直播 ReactNative 工时统计](../../sources/supplemental/s24-sdk-live-effort.md)，原文第 60 行。摘录：

  > 45d（非自动方案评估人力） -> 13d

使用边界：不把旧简历 13／19 人天当完整项目总投入；拉流总口径未厘清，简历不采用直播工时提效。
