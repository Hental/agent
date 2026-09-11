---
source:
  - "https://bytedance.larkoffice.com/wiki/FfGGw28hjipHeVkbhV8cTJ2jn7e"
source_title: "《[2024.08.20] ReactNative 点播播放器 - 技术评审》"
type: "document_snapshot"
summary: "点播 React Native 播放器技术评审。原文快照；目标、进展和实际结果按原文区分。"
---
<title>[2024.08.20] ReactNative 点播播放器 - 技术评审</title>

# 需求概述

## 术语解释

**ReactNative（简称RN）**: 是 Facebook 创建的开源UI软件框架，它能够用于开发 Android、iOS、macOS、  tvOS 、 Web 、 Windows 和UWP 多种跨平台应用，开发者能够使用 React 框架以及 Native 的原生能力，其组件渲染使用原生平台 UI 组件，能够使用原生组件的能力，使其能够获得与原生应用几乎一致的体验。



## 背景

BytePlus 东南亚和中东客户MBC，及火山客户特斯拉，对 ReactNative SDK均有需求。



## 相关文档

<cite doc-id="WtPxdOndhoTsrYxHXxccmoBFnYg" file-type="docx" title="【PRD】BytePlus VOD Player React Native SDK" type="doc"></cite>

<cite doc-id="WQo1drMOWoC3PexLYPycxUCGnue" file-type="docx" title="跨端SDK - 点播SDK API梳理" type="doc"></cite>



# 方案设计

## 基本原理

借助lux提供的SDK自动生成工具，在点播Native SDK已经接入SDKHub的情况下，能自动生成跨端SDK（包括ReactNative 和 Uni-app），运行时 IPC 通道发送 json 到 native hybrid 层，通过语言的反射机制动态调用 SDK 相关 API。

<whiteboard token="YCQAwcabghSbgibLiXNcpdmynRb"></whiteboard>

### 运行时架构

<whiteboard token="X2qow7eQ8hSwRQb7jcAcmOGGn5c"></whiteboard>

具体生成原理见<cite doc-id="NVnNwo9tqiGZX4k05s9cTDjMnDe" file-type="wiki" title="跨端 SDK 方案" type="doc"></cite>。通过接入运行时，以配置的方式及少量适配代码，可以抹平平台间的差异性，让开发者可以用同一套api统一开发iOS 或 android 应用。



## 生成方法

lux提供的工具可以直接生成其在sdkhub的api，但直接使用需要开发者感知不同的api差异，对开发有感知压力。所以需要对不同的差异性进行统一处理，以统一对外接口。

差异性处理主要为：api和类型，主要通过以下方式配置生产

- 直接通过lux的codegen生成方法、属性和类型，这类与skd在sdkhub透出的是一一对应的，只不过按平台会添加前缀。如ios_prepare

```JavaScript
  /** {zh}
   * @platform ios
   * @hidden (iOS)
   * @brief 预创建播放器。
   * @notes <br>调用本方法会提前触发播放准备工作，包括预建连等。
   * @param item 待播放的直播流信息。
   */
  /** {en}
   * @platform ios
   * @hidden (iOS)
   * @param item
   */
  ios_prepare(item: $p_i.TVLManager): void {
    const $ = () => ((this._instance as $p_i.TVLManager).prepare(item), void 0);
    return $();
  }
```



- Mapping 配置自动生成 class、 属性、方法及类型，统一为对外的ts语言类型的api

```JavaScript
{
      android: {
        name: 'VeVodPlayer',
      },
      ios: {
        name: 'TVLManager(VeVodPlayer)',
      },
      aim: {
        aimName: 'VeVodPlayer',
        aimType: 'class',
      },
      pack_member_description: [
        {
          ios: {
            name: 'playerView',
          },
          aim: {
            aimName: 'playerView',
            aimType: 'UIView',
          },
        },
      ],
      pack_function_description: [
        {
          android: {
            name: 'isPlaying',
          },
          ios: {
            name: 'isPlaying',
          },
          aim: {
            aimName: 'isPlaying',
            aimType: 'function',
            aimReturnType: 'boolean',
          },
        },
        {
          android: {
            name: 'setPlayerVolume',
          },
          ios: {
            name: 'volume',
          },
          aim: {
            aimName: 'setPlayerVolume',
            aimType: 'function',
            aimReturnType: 'void',
          },
        },
        {
          android: {
            name: 'setLogLevel',
          },
          ios: {
            name: 'setLogLevel:',
          },
          aim: {
            aimName: 'setLogLevel',
          },
        },
      ]
  }
```

- 对于差异非常大的api，则需要通过 lux 提供的修饰器定义相应的类、属性、api和类型。以安卓的Env模块为例。

```JavaScript

@NativeClass('com.pandora.common.env.Env')
export class Env {
  @NativeStaticMethodSync()
  static init(cfg: any) {
    throw new Error('');
  }

  @NativeStaticMethodSync()
  static openAppLog(cfg: any) {
    throw new Error('');
  }

  @NativeStaticMethodSync()
  static getApplicationContext(): ApplicationContext {
    throw new Error('');
  }
}
```

## 差异性API 设计

### **initEnv: 初始化配置 P0**

初始化配置，为一个静态的异步方法，对全局所有播放器实例均生效。

**类型**

```TypeScript
(config: EnvConfig) => Promise<void>
```

**参数**

**config: EnvConfig**

| 名称 | 类型 | 是否必填 | 默认值 | 说明 |
|-|-|-|-|-|
| AppID | string | 是 | - | 应用 ID，可在视频点播控制台**应用管理**页面获取。详情请见[创建应用](https://www.volcengine.com/docs/4/79594)。 |
| AppName | string | 是 | - | 应用英文名，可在视频点播控制台**应用管理**页面获取。详情请见[创建应用](https://www.volcengine.com/docs/4/79594)。 |
| AppVersion | String | 是 | - | App 版本号。合法版本号应包含大于或等于 2 个.分隔符，如 "1.3.2"。 |
| AppChannel | String | 是 | - | 渠道号。由您自定义，如小米应用商店 (xiaomi)、华为应用市场 (huawei) 等。 |
| PackageName | string | 否 | - | Android 应用唯一标识  |
| BundleID | string | 否 | - | iOS 应用唯一标识 |
| LicenseUri | string | 是 | - | 证书路径 |
| OpenLog | boolean | 否 | true | 是否开启日志 |
| UserUniqueID | string | 否 |  | 用户UniqueId |
| MaxCacheSize | number | 否 | *100M* | 最大缓存，单位byte |

**示例：**

```JavaScript
import {initEnv} from '@volcengine/react-native-vevod';

initEnv({
    ....
})
```



### **initPlayer: 初始化播放器 P0**

初始化配置，为一个静态的异步方法，对全局所有播放器实例均生效。

**类型**

```TypeScript
(options: InitOptions) => Promise<VeVodPlayer>
```

**示例**

```JavaScript
import {initPlayer} from '@volcengine/react-native-vod-player';

const vodPlayer = await initPlayer({
  viewId: 'vod-view'
});
```



### 组件：NativeViewComponent： 配置渲染视图 P0

为了方便将视图与播放器绑定，通过requireNativeComponent提供播放器的视图

> Surface 会自动选择，安卓默认TextureView

```JavaScript
import {NativeViewComponent} from '@volcengine/react-native-vod-player';

const PullView = () => {
  return (
    <NativeViewComponent
      id="pull-view"
      onViewLoad={onViewLoad}
      style={{width: '100%', height: '100%'}}
    />
  );
};
```



### 事件绑定 P0

##### onPlaybackStateChanged：播放状态事件监听

**类型**

```JavaScript
(engine, playbackState: VeVodPlayerPlaybackState) => any
```

##### **onLoadStateChanged**： 下载状态事件监听

**类型**

```JavaScript
(engine, loadState: VeVodPlayerLoadState) => any
```



##### **onPrepared: 播放器各个模块完成初始化，即将开始播放。**

**类型**

```JavaScript
(engine) => any
```

##### onReadyToDisplay: 显示视频首帧回调

**类型**

```JavaScript
(engine) => any
```

##### onDidFinish: **播放结束的回调**

类型

```JavaScript
(engine) => any
```



##### onError: **播放错误**

类型

```JavaScript
(message: string, code: number) => any
```



### API

#### 静态方法

<callout emoji="❗">
策略控制和预加载策略暂时一期不支持
</callout>

<sheet sheet-id="mo93Uo" token="FK9bsvYy3hiWWEtbyAwcSXVqnGb"></sheet>



#### 实例方法

<sheet sheet-id="HGzmZB" token="FK9bsvYy3hiWWEtbyAwcSXVqnGb"></sheet>



### 其他扩展类或模块

#### VidSource P0

静态函数init，生成 VidSource对象

`VidSource.init(config: VidSourceInitProps) => VidSource`

#### DirectUrlSource P0

静态函数init，生成 `DirectUrlSource`对象

`DirectUrlSource.init(config: DirectUrlSourceInitProps) => DirectUrlSource`





#### ~~PreloaderVIDItem P1 （一期暂不支持）~~

生成VID预加载任务

`PreloaderVIDItem.urlItemWithVideoSource(source: `**`VidSourceInitProps`**`) => PreloaderVIDItem`

#### ~~PreloaderURLItem P1 （一期暂不支持）~~

生成DircetUrl 预载任务

`PreloaderURLItem.urlItemWithVideoSource(source: `**`VidSourceInitProps`**`) => PreloaderURLItem`

#### ~~预加载任务监听 P1（一期暂不支持）~~

取消： `PreLoaderItem.onPreloadCance : () => void`

结束：`PreLoaderItem.onPreloadEnd : () => void`



### 类型

#### interface **EnvConfig**

播放环境初始化配置类型

| 名称 | 类型 | 是否必填 | 默认值 | 说明 |
|-|-|-|-|-|
| AppID | string | 是 | - | 应用 ID，可在视频点播控制台**应用管理**页面获取。详情请见[创建应用](https://www.volcengine.com/docs/4/79594)。 |
| AppName | string | 是 | - | 应用英文名，可在视频点播控制台**应用管理**页面获取。详情请见[创建应用](https://www.volcengine.com/docs/4/79594)。 |
| AppVersion | String | 是 | - | App 版本号。合法版本号应包含大于或等于 2 个.分隔符，如 "1.3.2"。 |
| AppChannel | String | 是 | - | 渠道号。由您自定义，如小米应用商店 (xiaomi)、华为应用市场 (huawei) 等。 |
| PackageName | string | 否 | - | Android 应用唯一标识  |
| BundleID | string | 否 | - | iOS 应用唯一标识 |
| LicenseUri | LicenseConfig | 是 | - | 证书路径 |
| OpenLog | boolean | 否 | false | 是否开启日志 |
| UserUniqueID | string | 否 | - | 用户UniqueId |
| MaxCacheSize | number | 否 | *100M* | 最大缓存，单位byte |

#### **interface InitOptions**

播放器初始化配置类型

| 名称 | 类型 | 是否必填 | 默认值 | 说明 |
|-|-|-|-|-|
| viewId | string | 是 | - | View 的id，view由SDK通过NativeViewComponent 生成 |

#### **enum PlayerPlaybackState**

> 播放状态

| 枚举key | 值 | 说明 |
|-|-|-|
| STOP | 0 | 播放停止。 |
| PLAYING | 1 | 播放中。 |
| PAUSE | 2 | 播放暂停。 |
| ERROR | 3 | 播放错误 |

#### **enum PlayerLoadState**

> 加载状态

| 枚举key | 值 | 说明 |
|-|-|-|
| PLAYABLE | 1 | 播放器加载完成，可开始或恢复播放 |
| STALLED | 2 | 播放器发生卡顿，正在加载数据。 |
| ERROR | 3 | 播放器加载数据报错。 |
| UNKNOWN | 4 | 未知 |

#### **interface VeVodPlayerError**

> 错误信息

| 名称 | 类型 | 说明 |
|-|-|-|
| code | number | 错误码 |
| message | string | 错误信息 |

#### **enum ResolutionType**

> 视频清晰度

| 枚举key | 值 | 说明 |
|-|-|-|
| Undefine | Undefine | 未知 |
| Standard | Standard | 标清 360p |
| High | High | 高清 480p |
| HighH | HighH | 540p |
| SuperHigh | SuperHigh | 超清 720p |
| ExtremelyHigh | ExtremelyHigh | 1080p |
| TwoK | TwoK | 2K |
| FourK | FourK | 4k |
| Auto | Auto | 自动调节。该选项仅适用于 DASH 视频，表示根据网速动态调节清晰度。 |

#### **enum EncodeType**

| 枚举key | 值 | 说明 |
|-|-|-|
| H264 | h264 | h264 |
| H265 | h265 | h265 |
| H266 | h266 | h266 |

**type MediaSource = VidSource | DirectUrlSource**

> 视频源

#### interface **VidSourceInitProps**

> Vid 视频源

| 名称 | 类型 | 是否必选 | 说明 |
|-|-|-|-|
| vid | string | 是 | 视频vid |
| playAuthToken | string | 是 | 视频playAuthToken |
| resolution | ResolutionType | 否 | 默认清晰度 |
| encodeType | EncodeType | 否 | 编码格式 |

#### **Interface DirectUrlSourceInitProps**

> DirectUrl 播放源。

| 名称 | 类型 | 是否必选 | 说明 |
|-|-|-|-|
| url | string | 否 | 视频地址 |
| urls | string[] | 否 | 视频地址组，第一个地址作为主要播放地址，其余地址为 |
| vid | string | 是 | 视频vid |
| cachekey | string | 是 | 缓存key |
| encodeType | EncodeType | 否 | 编码格式 |
| UrlExpires | string[] | 否 | HLS格式视频的过期时间 |

#### enum FillModeType

填充模式

| 枚举key | 值 | 说明 |
|-|-|-|
| FillModeNone | 1 | 无拉伸，不会变形，可能有黑边。 |
| FillModeAspectFit | 2 | *等比例适配，不会有变形，按照视频宽高等比适配画面，可能有黑边* |
| FillModeAspectFill | 3 | *等比例填充，不会有变形，按照视频宽高等比充满画面，可能有画面裁切* |
| FillModeFill | 4 | *拉伸填充，视频宽高比例与画面比例不一致，会导致画面变形* |

#### enum  RotationType = 0 | 90 | 180 | 270

旋转角度

| 枚举key | 值 | 说明 |
|-|-|-|
| *RotationTypeNone* | 0 | 0 |
| *RotationType90* | 90 | 90度 |
| *RotationType180* | 180 | 180度 |
| *RotationType270* | 270 | 270度 |

#### Enum StrategyType

策略类型

| 枚举key | 值 | 说明 |
|-|-|-|
| STRATEGY_TYPE_PRELOAD | 0 | 预加载策略 |
| STRATEGY_TYPE_RENDER | 1 | 预渲染策略 |

#### Enum StrategyScen

| 枚举key | 值 | 说明 |
|-|-|-|
| STRATEGY_SCENE_SMALL_VIDEO | 0 | 短视频场景，类似抖音的推荐页 |
| STRATEGY_SCENE_SHORT_VIDEO | 1 | 中视频场景，类似西瓜的推荐页 |



## TODO

<task status="success" task-id="6e0897bb-dd66-46ca-805a-bc212062cf35"></task>





## 依赖

依赖于接入SDKhub 的分支：

iOS：wzy/doc/engine_1.10.146，android：wzy/doc/engine_1.10.146_1.41.1

SDK 版本均是：iOS: 1.41.1 , android: 1.41.1



## DEMO

测试的DEMO将提供以下功能测试：

1. 播放器初始化
2. 多协议支持：Mp4、HLS、DASH
3. Vid 和 driceUrl播放
4. 清晰度设置及切换
5. 私有加密
6. 播控： seek、播放、暂停、纯音频、音量调节、指定时间起播、循环播放、销毁
7. 视频效果：填充、镜像、旋转、截图
8. 获取播放信息： 当前时间点、总时长、已缓冲时长、视频宽高、播放状态、加载状态
9. 预加载策略
10. 自定义预加载
11. 播放源过期自刷新
12. 日志上报，及日志配置，uuid、tag、subTag
13. 日志打印



# 排期

工作量

<table><colgroup><col/><col/><col/></colgroup><tbody><tr><td>模块</td><td>工作量</td><td>负责人</td></tr><tr><td>mapping配置自动化生成</td><td>1 天/人</td><td rowspan="5"><cite type="user" user-id="ou_5f75c63cb7baebc73ea316ff8586607a" user-name="熊雄"></cite></td></tr><tr><td>差异化处理</td><td>3 天/人</td></tr><tr><td>联调</td><td>3 天/人</td></tr><tr><td>demo开发</td><td>5 天/人</td></tr><tr><td>总计</td><td>12 天/人</td></tr></tbody></table>









## 测试