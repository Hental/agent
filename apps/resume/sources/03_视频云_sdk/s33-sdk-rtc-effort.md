---
source:
  - "https://bytedance.larkoffice.com/wiki/BV64wtuY4it3QWkPXHPcxf01nvy"
source_title: "《RTC ReactNative SDK 工时统计》"
type: "document_snapshot"
summary: "RTC API 生成数量、开发测试投入与手写预估；保留开发阶段与开发加测试两种口径。"
---
## 总结

- 涉及 api: 185
- 自动生成 api：165，占比 89%
- 开发 + 测试：38pd
- 开发：24 pd = SDK 开发 5pd + demo 开发  14pd + 联调 5pd
- 预估手写开发时间 44 = SDK 开发 5pd  * 3 + demo 开发  14pd + 联调 5pd * 3
- 效率提升 83%

## 背景

<table data-lark-table="docx-table" data-block-id="DDdmdRF27obi7mxytMdc2PvnnVf"><tbody><tr><td>meego</td><td></td></tr><tr><td>技术方案</td><td><a href="https://bytedance.larkoffice.com/wiki/X49gwEeqaibzW1k5zNbcGq0Qnqf">BytePlus RTC RN SDK 开发技术评审</a></td></tr></tbody></table>

## Roadmap

<table data-lark-table="bitable" data-table-id="tblIyzcBOCLcqpl0" data-table-name="tblIyzcBOCLcqpl0"><thead><tr><th data-field-id="fldXWUQKAS" data-field-type="1" data-ui-type="Text">任务名</th><th data-field-id="fldxgEERsR" data-field-type="1" data-ui-type="Text">备注</th><th data-field-id="fldnCa3MNn" data-field-type="5" data-ui-type="DateTime">开始日期</th><th data-field-id="fldV2NZaxt" data-field-type="5" data-ui-type="DateTime">截止日期</th></tr></thead><tbody><tr><td data-field-id="fldXWUQKAS" data-field-type="1">技术评审</td><td data-field-id="fldxgEERsR" data-field-type="1"></td><td data-field-id="fldnCa3MNn" data-field-type="5">2024-08-02</td><td data-field-id="fldV2NZaxt" data-field-type="5">2024-08-02</td></tr><tr><td data-field-id="fldXWUQKAS" data-field-type="1">开发</td><td data-field-id="fldxgEERsR" data-field-type="1"></td><td data-field-id="fldnCa3MNn" data-field-type="5">2024-08-06</td><td data-field-id="fldV2NZaxt" data-field-type="5">2024-09-06</td></tr><tr><td data-field-id="fldXWUQKAS" data-field-type="1">测试</td><td data-field-id="fldxgEERsR" data-field-type="1"></td><td data-field-id="fldnCa3MNn" data-field-type="5">2024-09-09</td><td data-field-id="fldV2NZaxt" data-field-type="5">2024-09-27</td></tr><tr><td data-field-id="fldXWUQKAS" data-field-type="1">上线</td><td data-field-id="fldxgEERsR" data-field-type="1"></td><td data-field-id="fldnCa3MNn" data-field-type="5">2024-10-08</td><td data-field-id="fldV2NZaxt" data-field-type="5">2024-10-08</td></tr></tbody></table>

24 + 14 = 38
<table data-lark-table="docx-table" data-block-id="TFzud5SN6oOSAmxmM75cgMAsnUe"><tbody><tr><th></th><td>工时</td></tr><tr><th>SDK 开发</th><td>5pd</td></tr><tr><th>Demo 开发</th><td>14pd</td></tr><tr><th>联调</th><td>5pd</td></tr><tr><th></th><td>24</td></tr></tbody></table>

独立开发人力预估
44 + (14 * 2)
<table data-lark-table="docx-table" data-block-id="HcuQdTY1mo2kgCxW6GEcusqWn3b"><tbody><tr><th></th><td>工时</td></tr><tr><th>SDK 开发</th><td>5pd * 3 = 15</td></tr><tr><th>Demo 开发</th><td>14pd     = 14</td></tr><tr><th>联调</th><td>5pd * 3 = 15</td></tr><tr><th></th><td>44</td></tr></tbody></table>

## 生成统计

<table data-lark-table="docx-table" data-block-id="H7dgd8DZOoc4uTxFeWAcfGQCn6b"><tbody><tr><td>api 数量</td><td>185<br />(235  - 6 - 5 - 3 - 38  + 2)<br />- 235：prd 涉及 api<br />- -6: audioDevice 相关 api<br />- -5: screenFrame 相关 api<br />- -3：<a href="https://www.volcengine.com/docs/6348/70080#IMediaPlayer-registeraudioframeobserver">registerAudioFrameObserver</a>/<a href="https://www.volcengine.com/docs/6348/70080#IMediaPlayer-pushexternalaudioframe">pushExternalAudioFrame</a>/<a href="https://www.volcengine.com/docs/6348/70080#IMediaPlayer-openwithcustomsource">openWithCustomSource</a><br />- -38：自定义流处理<br />- +2：start/stopVodCapture</td></tr><tr><td>非自动生成数量</td><td>20</td></tr><tr><td>自动生成占比</td><td>(185 - 20) / 185 = 89%</td></tr></tbody></table>

非自动生成
<table data-lark-table="docx-table" data-block-id="T8WCdzLizoNHKqxNOZBcf6e4nWe"><tbody><tr><td>RTCManager</td><td>createRTCEngine</td><td></td></tr><tr><td></td><td>destroyRTCEngine</td><td></td></tr><tr><td></td><td>setLogConfig</td><td></td></tr><tr><td>proxyEngine</td><td>setLocalVideoCanvas</td><td></td></tr><tr><td></td><td>setRemoteVideoCanvas</td><td></td></tr><tr><td></td><td>setCellularEnhancement</td><td></td></tr><tr><td></td><td>enableAudioPropertiesReport</td><td></td></tr><tr><td></td><td>setScreenVideoEncoderConfig</td><td></td></tr><tr><td></td><td>startScreenCapture</td><td></td></tr><tr><td></td><td>requestRemoteVideoKeyFrame</td><td></td></tr><tr><td></td><td>sendStreamSyncInfo</td><td></td></tr><tr><td>proxyRoom</td><td>joinRoom</td><td></td></tr><tr><td></td><td>setRemoteVideoConfig</td><td></td></tr><tr><td>proxyAudioEffectPlayer</td><td>start</td><td></td></tr><tr><td>proxyMediaPlayer</td><td>open</td><td></td></tr><tr><td>RTCRoomEventHandler</td><td>onStreamRemove</td><td></td></tr><tr><td>RTCVideo</td><td>feedback</td><td></td></tr><tr><td></td><td>setRemoteAudioPlaybackVolume</td><td></td></tr><tr><td></td><td>startVodPlayerCapture</td><td></td></tr><tr><td></td><td>stopVodPlayerCapture</td><td></td></tr></tbody></table>