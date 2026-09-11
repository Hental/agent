---
source:
  - "https://bytedance.larkoffice.com/wiki/PDJdwIU0Di468KkWxescaZKEnHf"
source_title: "《RN适配层设计》"
type: "document_snapshot"
summary: "适配层设计原文；描述自动合并、Mapping 和手动处理方法，不提供直播自动生成 API 总数。"
---
> 本文参考：[怎么做好技术评审](https://bytedance.feishu.cn/docs/doccnqyheffn2ErZ9qb2yWAadjd) 
> **核心点：**
> 1. 严格严格严格按照模板来
> 2. 写文档的时候要足够的细致
> 3. 讲文档的时候，只讲你认为大家关注的点和你认为有风险的点
> 4. 多画图，少写字。尤其是讲的时候，要对着图讲，不要对着文字讲
> 细分方向的评审模板：
> [【技术评审】RTC服务端技术评审模板（信令派生）](https://bytedance.feishu.cn/wiki/wikcnSeuhhO00BBpYwl22cL5zoh) 
> [【技术评审】xx功能【MediaServer】](https://bytedance.feishu.cn/wiki/wikcn8agUZEt0TcDW8a21DEuKkh)
> [【技术评审】RTC服务端技术评审模板（媒体处理）](https://bytedance.feishu.cn/docs/doccnlP0fRnEpiwRq5cf2ErOc0c#) 
> 注意：以上模板至少是本文档模板的父级。
*Version: 0.1*
> 请 Copy 本文档并放置在 相应的目录 下
<table data-lark-table="docx-table" data-block-id="doxcnToMrMAP6G6gygY3UqpR3oc"><tbody><tr><td>版本</td><td>报告人</td><td>评审人（至少4人）</td><td>记录人</td></tr><tr><td>V1.0</td><td><a href="mailto:douyaning@bytedance.com">@窦雅宁(douyaning)</a> <a href="mailto:zhangshize.f@bytedance.com">@张世泽(zhangshize.f)</a></td><td>PM(必填)：<br />QA(必填)：<br />RD(必填)：<br />研发架构师(必填):</td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></tbody></table>

> 注意：请各位评审人在投票部分给出意见。
# 适配层技术评审

## 背景

> 在[跨平台方案](https://bytedance.larkoffice.com/wiki/AmjzwtggMi2amTk9JescrQBrnFf)跨平台框架的设计当中未涉及到适配层相关的评审，因此增加了适配层相关设计，以减少开发的工作量，能通过适配层完成整体的设计，减小整体的工程量。
- 需求文档：[MyClip POC Documentation ](https://bytedance.sg.larkoffice.com/docx/OmTddF5ISo4NaKxA3DClTuQqgQe)
- meego链接：

## 方案概述

>

> 简要描述你的方案，至少包含以下重点：
> - 方案思路
> - 方案优点
> - 方案缺点
>
> 如果涉及到多个方案，还应该有优缺点对比。
## 方案思路

1. 通过工具内置逻辑，解决同名同语义的问题。
1. 通过配置层来解决能通过配置适配两端差异的问题

## 架构设计

![```mermaid\nflowchart TD\n    o1_20(\["ReactNative SDK"\])\n    o1_16(\["IOS SDK"\])\n    o1_19(\["API Defination JSON"\])\n    o1_21(\["Export Defination\nclass\nfunc\ninterface\nconstant"\])\n    o1_17(\["Android SDK"\])\n    o1_22(\["Platform Defination\nIOS Defination\n Android Defination"\])\n    o1_23(\["IPC Manager\nIOS Call&Sub\n Android Call&Sub"\])\n    o1_24(\["Native SDK\nIOS SDK\nAndroid SDK"\])\n    o1_18(\["SDKHub DocTool"\])\n    o43_2(\["adptorjson"\])\n\n    o43_2 -->|adapt&IOC| o1_21\n    o1_16 --> o1_18\n    o1_17 --> o1_18\n    o1_23 <--> o1_24\n    o1_21 --> o1_20\n    o1_18 --> o1_19\n    o1_22 <--> o1_23\n    o1_22 -->|transfrom json| o43_2\n```\n\n> 模块链路\n\n> 数据前置准备](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/62dea8f6-284e-4a50-a289-c88d6b669055.png)

## 流程设计

### 配置文件生成适配层JSON [@张世泽(zhangshize.f)](mailto:zhangshize.f@bytedance.com)

#### JSON 生成流程

对于可以自动处理的子项（类型/值一致），自动进行合并，对于无法判断是否可以合并项时，通过配置文件的方式，将相同含义的子项进行合并处理
合并前
```typescript
// ios
{
    apis: [{
        name: "TVManager(VeLivePlayer)",
        type: "interface"
        ...
    }]
}
// anroid
{
    apis: [{
        name: "VeLivePlayer",
        type: "class"
        ...
    }]
}
```

合并后
```typescript
{
    apis: [{
        aimName: "VeLivePlayer",
        aimType: "class",
        anroid: {
            name: "VeLivePlayer",
            ...
        },
        ios: {
            ...
        }
    }]
}
```

![```mermaid\nflowchart TD\n    o1_1437(\["读取 Android 源文件"\])\n    o1_1517(\["Native adapter 生成的 JSON 产物"\])\n    o1_1456(\["读取 iOS 源文件"\])\n    o1_1435\["开始"\]\n    o1_1498\["输出最终  JSON"\]\n    subgraph o1_1511 \["&nbsp;"\]\n        o1_1486(\["生成携带 Plaform 前缀 member 配置的 JSON"\])\n        o1_1505(\["生成配置项的 JSON"\])\n        o1_1447(\["生成 JSON"\])\n        o1_1476(\["member"\])\n        o1_1477(\["function/static function"\])\n        o1_1442(\["获取 another platform 对应源文件信息（name+type+level）匹配"\])\n        o1_1470(\["enum"\])\n        o1_1506{"是否匹配到对应子项"}\n        o1_1482(\["生成携带 Plaform 前缀枚举配置的 JSON"\])\n        o1_1479{"enum key/value 相同？"}\n        o1_1508(\["生成携带 Plaform 前缀的配置信息的 JSON"\])\n        o1_1445(\["获取配置项信息"\])\n        o1_1488(\["生成携带 Plaform 前缀的 function 配置的 JSON"\])\n        o1_1480{"有用户配置子项？"}\n        o1_1485{"name/type 相同？"}\n        o1_1487{"name/ return type/param type相同？"}\n    end\n\n    o1_1506 --> o1_1470\n    o1_1511 --> o1_1517\n    o1_1479 -->|N| o1_1482\n    o1_1470 --> o1_1479\n    o1_1445 -->|enum/member/function/static function| o1_1447\n    o1_1487 -->|Y| o1_1505\n    o1_1480 -->|Y| o1_1445\n    o1_1476 --> o1_1485\n    o1_1487 -->|N| o1_1488\n    o1_1506 -->|Y| o1_1477\n    o1_1506 --> o1_1476\n    o1_1480 -->|N| o1_1442\n    o1_1485 -->|Y| o1_1505\n    o1_1517 --> o1_1498\n    o1_1435 --> o1_1437\n    o1_1506 -->|N| o1_1508\n    o1_1442 --> o1_1506\n    o1_1477 --> o1_1487\n    o1_1479 -->|Y| o1_1505\n    o1_1437 --> o1_1511\n    o1_1485 -->|N| o1_1486\n    o1_1456 --> o1_1511\n    o1_1480 <--- o1_1511\n```](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/40bd68ad-1a32-4bb7-a004-18e274863342.png)

#### Class 配置文件

Class 使用 name + type 匹配需要修改的子项
```typescript
// 源文件 -- Android
{
    name: 'VeLivePlayer',
    type: 'class',
}
// 源文件 -- iOS
{
    name: 'TVManager(VeLivePlayer)'
    type: 'interface'
}
// 配置项
{
    android: {
        name: 'VeLivePlayer',
        type: 'class',
    }
    ios: {
        name: 'TVManager(VeLivePlayer)'
        type: 'interface'
    },
    aim: {
        aimType: 'class'
        aimName: 'VeLivePlayer'
        platform_type: 'both',
    }
    child
}
// JSON 产物
{
    aimType: 'class',
    aimName: 'VeLivePlayer',
    platform_type: 'both',
    android: {...},
    ios: {...}
 }
```

#### Enum 配置文件

Enum 使用 enum 名匹配需要修改的子项，通过 pack_enum_key_description 映射目标项
```typescript
// 源文件 -- Android
{
    name: "VeLivePlayerRotation",
    type: "enum",
    enums: [
        {value: "0",name: "VeLivePlayerRotation0"},
        {value: "1",name: "VeLivePlayerRotation90"},
        {value: "2",name: "VeLivePlayerRotation180"},
        {value: "3",name: "VeLivePlayerRotation270"},
    ]
}

// 源文件 -- iOS
{
    name: "VeLivePlayerRotation",
    type: "enum",
    enums: [
        {value: "0",name: "VeLivePlayerRotation0"},
        {value: "90",name: "VeLivePlayerRotation90"},
        {value: "180",name: "VeLivePlayerRotation180"},
        {value: "270",name: "VeLivePlayerRotation270"},
    ]
}
// 配置项
{
    android: {
        name: "VeLivePlayerRotation",
        type: "enum",
    },
    ios: {
        name: "VeLivePlayerRotation",
        type: "enum",
    },
    aim: {
        aimType: "enum",
        aimValue: "VeLivePlayerRotation",
        ...
    },
    pack_enum_key_description: [
        ...
        {
            android: { name: "VeLivePlayerRotation90", value: "1" },
            ios: { name: "VeLivePlayerRotation90", value: "90" },
            aim: { aimName: "VeLivePlayerRotation90", aimValue: "1" }
        }
        ...
    ]
}
// JSON 产物
{
    aimType: "enum",
    aimName: "VeLivePlayerRotation"
    enums: [
        {aimValue: "0",aimName: "VeLivePlayerRotation0"},
        {aimValue: "1",aimName: "VeLivePlayerRotation90"},
        {aimValue: "2",aimName: "VeLivePlayerRotation180"},
        {aimValue: "3",aimName: "VeLivePlayerRotation270"},
    ],
    android: {...},
    ios: {...}
}
```

#### Member 配置文件

```typescript
// 源文件 -- Android
{
    name: "mErrorCode",
    type: "int",
}
// 源文件 -- iOS
{
    name: "[errorCode](#VeLivePlayerError-errorcode)",
    type: "NSInteger",
}
// 配置项
{
    android: {},
    ios: {},
    aim: {
        aimType: "int",
        aimName: "errorCode"
    }
}
// JSON 产物
{
    aimName: "errorCode",
    aimType: "number",
    android: {...}
    ios: {...}
}
```

#### Interface 配置文件

Interface 分为 callback 与 函数生成，callback 需要配置标识 is_need_listen；函数声明与函数保持一致
#### Function/Static Function 配置文件

```typescript
// 源文件 -- Android
{
    name: "setLogLevel",
    params: [{name: "logLevel", type: "VeLivePlayerLogConfig.VeLivePlayerLogLevel"}],
    return_type: "static void"
}
// 源文件 -- iOS
{
    name: "setLogLevel",
    params: [{name: "logLevel", type: "VeLivePlayerLogLevel"}],
    return_type: "void"
}
// 配置项
{
    android: {    
        name: "setLogLevel",
    },
    ios: {
        name: "setLogLevel"
    },
    aim: {
        is_static: false,
        ...
        aimName: "setLogLevel",
        aimReturnType: "void",
    },
    pack_function_params_type: [
        {
            android: {name: "logLevel", type: "VeLivePlayerLogConfig.VeLivePlayerLogLevel"},
            ios: {name: "logLevel", type: "VeLivePlayerLogLevel"},
            aim: {aimName: "logLevel", aimType: "VeLivePlayerLogLevel"}
        }
    ]
}     
// JSON 产物
{
    aimName: "setLogLevel",
    aimReturnType: "void",
    ...
    params: [
        {aimName: "logLevel", aimType: "VeLivePlayerLogLevel"}
    ],
    android: {...},
    ios: {...}
}
```

#### 类型不一致的处理方式

```typescript
// 源文件 -- android
{
    name: "isPlaying",
    params: [],
    return_type: "Bool"
}
// 源文件 -- iOS
{
    name: "isPlaying",
    type: "member",
}
// 配置文件
{
    android: {    
        name: "isPlaying",
        type: "method",
    },
    ios: {
        name: "isPlaying",
        type: "member",
    },
    aim: {
        is_static: false,
        ...
        aimName: "isPlaying",
        aimType: "method",
        aimReturnType: "boolean",
    },
    pack_function_params_type: []
}   
// json 产物
{
    aimName: "isPlaying",
    aimType: "method",
    aimReturnType: "boolean",
    platform_type: "both",
    android: {...},
    ios: {...}
}

```

#### 无配置文件，无法自动生成处理

```typescript
// 源文件 -- android
{
    name: "A",
    ...
}
// 生成 JSON
{
    aimName: "A",
    platform_type: "android"
    android: {name: "A", ...}
}
```

#### 类型映射规则

在配置文件当中的基础类型会手动的转化为TS当中的基础类型，对于自动合并的，会使用Typescript的alias，以下是各自的规则。
- iOS

<table data-lark-table="docx-table" data-block-id="AKVddFmJZonU64xk3sycxn3Nn7c"><tbody><tr><td>Native 类型</td><td>TS 类型</td></tr><tr><td>NSString/NSString*</td><td>string</td></tr><tr><td>NSMutableString</td><td>string</td></tr><tr><td>NSArray&lt;T&gt;</td><td>Array&lt;T&gt;</td></tr><tr><td>type NSMutableArray&lt;T&gt;</td><td>Array&lt;T&gt;</td></tr><tr><td>NSNumber</td><td>number</td></tr><tr><td>NSValue</td><td>number</td></tr><tr><td>NSNull</td><td>null</td></tr><tr><td>NSDate</td><td>Date</td></tr><tr><td>NSObject</td><td>Object</td></tr><tr><td>NSMutableDictionary</td><td>Object</td></tr><tr><td>CGfloat</td><td>number</td></tr><tr><td>BOOL</td><td>boolean</td></tr><tr><td>int</td><td>number</td></tr><tr><td>NSDictionary</td><td>Object</td></tr><tr><td>float</td><td>number</td></tr><tr><td>UIView</td><td>unknown</td></tr><tr><td>NSInteger</td><td>number</td></tr><tr><td>int64_t</td><td>number</td></tr><tr><td>CVPixelBufferRef</td><td>any</td></tr><tr><td>CMSampleBufferRef</td><td>any</td></tr><tr><td>CMTime</td><td>&#123;<br />    value: number;<br />    timescale: number;<br />&#125;</td></tr><tr><td>NSData/NSData*</td><td>Object</td></tr><tr><td>NSURL/NSURL*</td><td>string</td></tr><tr><td>long</td><td>number</td></tr><tr><td>id&lt;T = any&gt;</td><td>T | string</td></tr></tbody></table>

- Android

<table data-lark-table="docx-table" data-block-id="HCFUdFCkEouwpfxt7yOcAmYWnYp"><tbody><tr><td>Native 类型</td><td>TS 类型</td></tr><tr><td>int</td><td>number</td></tr><tr><td>String</td><td>string</td></tr><tr><td>Boolean</td><td>boolean</td></tr><tr><td>Void</td><td>void</td></tr><tr><td>float</td><td>number</td></tr><tr><td>double</td><td>number</td></tr><tr><td>long</td><td>number</td></tr><tr><td>list&lt;T&gt;</td><td>Array&lt;T&gt;</td></tr><tr><td>map</td><td>Object</td></tr><tr><td>set&lt;T&gt;</td><td>Set&lt;T&gt;</td></tr><tr><td>struct</td><td>Object</td></tr><tr><td>Integer</td><td>number</td></tr><tr><td>Double</td><td>number</td></tr><tr><td>byte&lt;T&gt;</td><td>Array&lt;T&gt;</td></tr><tr><td>List&lt;T&gt;</td><td>Array&lt;T&gt;</td></tr><tr><td>Bitmap</td><td>number[][] | number[]</td></tr><tr><td>SurfaceHolder</td><td>&#123; readonly $type: unique symbol &#125;</td></tr><tr><td>Surface</td><td>&#123; readonly $type: unique symbol &#125;</td></tr><tr><td>EGLContext</td><td>unknown</td></tr><tr><td>ByteArray</td><td>number</td></tr><tr><td>ByteBuffer</td><td>unknown</td></tr><tr><td>static void</td><td>void</td></tr></tbody></table>

### 代码生成

![LuPLb47i6oqVyBxws8zcaCo2nVg](https://tosv.byted.org/obj/larkparser/lark_cache/38f6749935daec64e0ab9d07e50e145f7acc90dcdf7205f23298a518d738f767.png)

1. 遍历整个树，按照不同的类别生成，也按照从顶到下依次生成。

#### constructor处理

1. 使用函数的形式-initialize
- 不使用TS当中的constructor而是使用函数的形式，IOS和android的constructor当中的参数都作为函数的参数。
- 在调用所有的功能之前，强制调用initRNParams。
- 因为生成的json当中没有options参数相关声明，因此需要手动处理options的差异。

```javascript
initialize(options: OptionsProp) {
  if (Platform.OS === 'ios') {
        // do android init
        this.ios = new xx()
      } else if (Platform.OS === 'android') {
       this.android = new xx()
      } else {
        throw new Error('Platform not supported');
      }
}
```

#### class生成

1. 是否对外暴露由于is_need_export控制。
1. 是否有前缀由platform_type控制。
1. 内部不同的类别由不同的函数生成。

```javascript
// 包装class
const packClass = (classInfo: ClassDesc)=> {
    return `
      ${returnExport(classInfo.is_need_export)} class ${returnNativePreFix(classInfo.platform_type)}${classInfo.name}extends EventEmitter {
        constructor() {
            super();
        }
        ${packMembers(classInfo.member_descriptions)}
        ${packRNInitFunctions(classInfo)}
        ${packFunctions(classInfo)}
      }
    `
}
```

#### interface生成

1. interface生成分两种情况
    1. Callback，会由业务方单独的is_need_listen标识为需要监听。
    1. 声明

- Callback的情况，会根据is_need_listen标识，会在函数体内追加预定义好的函数字符串。

```javascript
// 封装callback
export enum Observer {
  onError = "onError"
}

/**
 * call back
 */
const player = new VeLivePlayer();
player.on(Observer.onError, (player, error)=> {
    player.emit(player, error);
});

```

- 声明的情况同正常的函数声明。

```javascript
        private __registerPluginEventHandlers() {
            for (const eventName of ${emitNameArray}) {
                this.Instance.on(eventName,(...args: any[]) => {
                    this.safeEmit(eventName, ...args);
                })
            }
        }

        safeEmit(event: string, ...data: any[]) {
            super.emit(event, ...data);
        }
```

#### enum的生成

1. IOS-ts, Android-ts 需要按照前缀的规则生成名称
1. 转换规则同class，不同的在于enum要包装的是key。

```javascript
import { IOS_VeLivePlayerProtocol } from './ios/enum'；

export enum VeLivePlayerProtocol {
  /**
   * TCP 协议
   */
  VeLivePlayerProtocolTCP: 'xxx';
}

VeLivePlayerProtocol.VeLivePlayerProtocolTCP = Platform.select({
    ios: IOS_VeLivePlayerProtocol.VeLivePlayerProtocolTCP,
    android: Android_AndroidVeLivePlayerProtocol.VeLivePlayerProtocolTCP
});

doSome(VeLivePlayerProtocol.VeLivePlayerProtocolTCP);
doSome('xxx') {
    let result = Platform.select({
        ios: IOS_VeLivePlayerProtocol.VeLivePlayerProtocolTCP,
        android: Android_AndroidVeLivePlayerProtocol.VeLivePlayerProtocolTCP
    });
}
```

#### function生成

函数的生成使用is_static区分静态mehtod和常规method
- Static method使用函数名调用
- 常规method使用this.Instance调用
- IOS-ts, Android-ts 需要按照前缀的规则生成名称

```javascript
Platform.select(({
    ios: ${isStatic ? className: 'this.Instance'}.${functionInfo.name}();
    android: ${isStatic ? className: 'this.Instance'}.${functionInfo.name}();
}))();
```

#### member生成

```javascript
class Test {
  member: number = 1;
  this.member = 'xx';
}
```

TS当中的member分两部分
- 声明部分

声明部分和常规的声明一致。
```javascript
const packMembers = (member_descriptions: MemberDesc[])=> {
    return member_descriptions.map(member=> {
        return `${member.name}:${member.type};`
    }).join('\n');
}

```

- 初始化部分

初始化部分会放在packRNInitFunctions当中。
```javascript
const memberInitCodeStr = classInfo.member_descriptions.map(member=> {
        return `
            this.${member.name} = Platform.select({
                ios: this.Instance?.${member.name},
                android: this.Instance?.${member.name} 
            })
        `
    }).join('\n');

```

###

## 自测测试用例

> 时长建议：15分钟
> 在这里列出测试人员如何测试该功能，包括如何构建测试场景，如何观测日志、埋点。

## 研发计划

> 上线流程的先后顺序需要严格遵守
<table data-lark-table="bitable" data-table-id="tblm6hCsLLf8cYQs" data-table-name="tblm6hCsLLf8cYQs"><thead><tr><th data-field-id="fld7isxoIF" data-field-type="1" data-ui-type="Text">任务名</th><th data-field-id="fldjxlY20T" data-field-type="3" data-ui-type="SingleSelect">任务状态</th><th data-field-id="fldMP4owDf" data-field-type="1" data-ui-type="Text">备注</th><th data-field-id="fld4EKc2My" data-field-type="5" data-ui-type="DateTime">开始日期</th><th data-field-id="fldITT57fy" data-field-type="5" data-ui-type="DateTime">截止日期</th></tr></thead><tbody><tr><td data-field-id="fld7isxoIF" data-field-type="1">codeTransFormer</td><td data-field-id="fldjxlY20T" data-field-type="3">未开始</td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-04-28</td><td data-field-id="fldITT57fy" data-field-type="5">2024-04-30</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">适配层联调</td><td data-field-id="fldjxlY20T" data-field-type="3">进行中</td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-05-07</td><td data-field-id="fldITT57fy" data-field-type="5">2024-05-08</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">全部API联调输出</td><td data-field-id="fldjxlY20T" data-field-type="3">已完成</td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-04-19</td><td data-field-id="fldITT57fy" data-field-type="5">2024-04-26</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">json adapter</td><td data-field-id="fldjxlY20T" data-field-type="3"></td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-04-22</td><td data-field-id="fldITT57fy" data-field-type="5">2024-04-25</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">Native Component 封装</td><td data-field-id="fldjxlY20T" data-field-type="3"></td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-04-28</td><td data-field-id="fldITT57fy" data-field-type="5">2024-04-29</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">Android + iOS 应用demo</td><td data-field-id="fldjxlY20T" data-field-type="3"></td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-05-13</td><td data-field-id="fldITT57fy" data-field-type="5">2024-05-13</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">RN SDK 封装，手动处理方法实现</td><td data-field-id="fldjxlY20T" data-field-type="3"></td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-05-09</td><td data-field-id="fldITT57fy" data-field-type="5">2024-05-10</td></tr><tr><td data-field-id="fld7isxoIF" data-field-type="1">提测跟测</td><td data-field-id="fldjxlY20T" data-field-type="3"></td><td data-field-id="fldMP4owDf" data-field-type="1"></td><td data-field-id="fld4EKc2My" data-field-type="5">2024-05-16</td><td data-field-id="fldITT57fy" data-field-type="5">2024-05-16</td></tr></tbody></table>

## 补充文档

### 映射规则

![```mermaid\nflowchart TD\n    o1_25(\["手动抹平"\])\n\n    z1_80 --> o1_25\n    z1_10 --> o1_25\n    z1_69 --> o1_25\n    z1_37 --> o1_25\n```\n\n思维导图:\n- **工具转换**\n  - a. 同语义\n    - a.a name不同，提供name映射选项\n      - a.a.aname所属类型不同(enum, class,interface)\n      - a.a.bname所属类型相同(enum, class,interface),做名称类别映射\n    - a.b  name相同\n      - a.b.aname type相同，无需处理\n      - a.b.b name type不同\n- **对外能力**\n  - Func\n    - 1 FuncName一致\n      - 1.1 params完全一致\n      - 1.2 params不一致\n      - 1.1.3 return一致，不做处理\n      - 1.1.4 return不一致\n    - 2 FuncName不一致\n      - 2.1功能一致，配置Mapping见x.x，转 1.1\n      - 功能不一致\n  - Class\n    - 2.1 className\n      - 2.1 className不一致\n      - 2.1.2className名称一致\n    - 2.2member\n      - 2.1.1 member名称一致\n      - 2.1.2 memer名称不一致\n    - 2.3 function\n      - 2.3.1 functionName一致\n      - 2.3.2 functionName不一致\n  - Constant\n  - Type declaration\n    - 1enum\n      - 1.1 enum Name 一致\n      - 1.2 enum Name 不一致\n    - 4.2interface\n      - 4.2.1 interface名称一致\n      - 4.2.2 interface名称不一致\n  - 5 特殊映射\n    - 5.1 成员变量 和function业务语义等价， 见转换规则a.a.a\n    - 5.2 enum和class语义想同，见转换规则a.a.a，转4.1](https://tosv.byted.org/obj/larkparser/image/document_parsing_model/9e90673e-5f28-46be-9613-0897182a64b0.png)

### 映射map设计

[详细映射规则梳理](https://bytedance.larkoffice.com/docx/OsvUd742Qoa7UmxcM4UcVF1onof)
## 问题记录

> 时长建议：15 分钟
1.

> 此模块由问题记录人在评审过程中进行记录，当然最后的 QA 环节也需要记录：
## 评审日志

> 包含变更总结和投票两个模块，按时间倒序展现。

## 2019-08-22

### 投票

> 由评审人投票，评审不通过的人需要给出具体原因，超过 2/3 的通过率即通过技术评审。
[Unsupported block: type=999, id=doxcn3f14SZsro5017XIp4QQpEi]

### 评审环节研发架构师签字确认（必填）

> [!CAUTION]
> 需要架构师打字确认，如下所示：
>
架构师**确认该方案通过
### 验收

> 由评审人投票，评审不通过的人需要给出具体原因，超过 2/3 的通过率即通过技术评审。
bugList：@QA 负责 或者 方向负责人

## MileStone

> 大于2周的需求需要明确里程碑，两个里程碑之间的间隔不能大于一周
- [ ] **月**日前，完成**部分。实现**功能。

## 验收结项

- 输出实际效果与预期目标的对比说明
- 输出性能监控大盘
- 输出QA测试报告