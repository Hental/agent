---
source:
  - "https://code.byted.org/vcloud-fe/velive-react-native-sdk/tree/c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c"
source_title: "《直播 React Native SDK 历史代码核实》"
type: "code_reading_summary"
summary: "固定 2024-08-09 的 1.0.2 发布提交，核实生成代码与额外适配实现的关系；不将代码成员数量当原文 API 计数。"
---
# 直播 React Native SDK · 历史代码核实

阅读日期：2026-09-11。类型为代码阅读摘要，不是作者原文或生产统计。

## 版本与范围

仓库 `vcloud-fe/velive-react-native-sdk`，固定提交 `c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c`。该提交对应火山与 BytePlus 推流、拉流 `1.0.2` 标签，提交日期为 2024-08-09。当前 master 已更新至 2026 年，本摘要不使用当前分支计数解释 2024 年结果。通过 bytedcli 读取标签、目录及文件；未运行 SDK 或重新执行生成器。

本次查看两个 SDK 的 `lux-codegen.adpater.mjs`、`src/codegen/pack/` 中 api、callback、errorcode、keytype、types、index 文件，以及 `src/core/` 中 api、callback、keytype、player／pusher 实现。临时响应、源文件及 AST 明细保存在工作区 `.reports/resume-live-api-20260911/`。

## 生成与适配的具体证据

- 拉流 `src/core/api.ts:1` 直接从 `../codegen/pack/api` 导出 `VeLivePlayer`。
- 拉流 `src/core/player.ts:60` 定义 `initPlayer`，按 Android／iOS 分发初始化，处理视图和配置。
- 拉流 `src/core/keytype.ts:19、43、67、106、144` 使用 `extendsClassMember` 扩展 `format`、`protocol`、`mainStreamList`、`backupStreamList`、`bitrate` 五个属性。
- 推流 `src/core/api.ts:32、44、73、102` 使用 `extendsClassMethod` 扩展 `setWatermark`、`setAudioFrameFilter`、`setVideoFrameFilter`、`destroy` 四个方法。
- 推流 `src/core/keytype.ts:54` 使用 `extendsClassMethod` 扩展 `VeLiveVideoEncoderConfiguration.initWithResolution`。

上述路径均以 `modules/react-native-live-pull/` 或 `modules/react-native-live-push/` 为前缀，链接固定到以下提交：

- [modules/react-native-live-pull/src/core/api.ts](https://code.byted.org/vcloud-fe/velive-react-native-sdk/blob/c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c/modules/react-native-live-pull/src/core/api.ts)
- [modules/react-native-live-pull/src/core/player.ts](https://code.byted.org/vcloud-fe/velive-react-native-sdk/blob/c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c/modules/react-native-live-pull/src/core/player.ts)
- [modules/react-native-live-pull/src/core/keytype.ts](https://code.byted.org/vcloud-fe/velive-react-native-sdk/blob/c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c/modules/react-native-live-pull/src/core/keytype.ts)
- [modules/react-native-live-push/src/core/api.ts](https://code.byted.org/vcloud-fe/velive-react-native-sdk/blob/c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c/modules/react-native-live-push/src/core/api.ts)
- [modules/react-native-live-push/src/core/keytype.ts](https://code.byted.org/vcloud-fe/velive-react-native-sdk/blob/c15469592fe8b0ee80bfde70ed9bac0a86bb0b6c/modules/react-native-live-push/src/core/keytype.ts)

## 计数结论与限制

生成目录同时包含业务方法、属性 getter／setter、回调接口、两端回调代理、枚举转换及 `__init`、`__new_instance` 等辅助成员。AST 枚举只证明该固定版本中的代码结构，不等于原文“涉及 API”的统计范围。

生成代码可以再被适配扩展，“有生成产物”与“存在适配代码”并非互斥分类；不能从 69／242 中直接扣除扩展方法、属性和初始化数量，得到所谓纯自动生成数量。

2024 月报与年度总结中的拉流 69、推流 242 仍按原文“涉及 API”使用。本次未发现能把这两个数字逐项对应到自动生成、适配与未生成状态的同版本统计清单，不把 311 改写为“自动生成 311 个 API”，也不发布自选计数规则得到的替代数字。
