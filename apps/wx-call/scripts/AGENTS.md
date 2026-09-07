# Midscene 桌面控制脚本

从本次微信操作中整理出的截图和坐标点击脚本。使用 Midscene `ComputerDevice` 的截图与输入能力，不需要配置视觉模型；由操作者查看截图后决定下一步。

## 安装

在项目根目录执行：

```sh
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --prefix apps/wx-call/scripts
```

固定使用本次成功运行的 `@midscene/computer@1.12.3`。上述环境变量使 sharp 使用预编译依赖，避免本机全局 libvips 导致安装失败。桌面会话需要解锁，运行进程需要屏幕录制与辅助功能权限。

也可以通过 `MIDSCENE_COMPUTER_MODULE` 指向已经安装的 `@midscene/computer` 包目录。脚本不依赖某个固定的 npm 缓存或临时目录。

## 使用

```sh
export PATH="/usr/sbin:/usr/bin:/bin:/sbin:$PATH"

# 只截图，并输出当前桌面逻辑尺寸
node apps/wx-call/scripts/control.cjs current

# 点击指定坐标，然后截图；坐标必须来自当前界面
node apps/wx-call/scripts/control.cjs after-click 376 213
```

每次运行会创建独立的 `.reports/midscene-desktop/<name>-<随机后缀>/` 目录，保存截图与 Midscene 日志。执行结束释放桌面控制对象，不会退出微信或挂断通话。

坐标使用桌面逻辑像素。Retina 截图的像素尺寸可能为逻辑尺寸的两倍；应根据输出的桌面尺寸换算，不能直接套用缩放后的预览坐标。每一步点击完成后查看截图，再决定下一步；脚本不会自动判断接听状态，也不会自动重拨。

## 本次微信操作记录

2026-09-07 的桌面逻辑尺寸为 1920×1080。以下坐标仅记录当时布局，使用前必须核对当前截图：

| 操作 | x | y |
| --- | ---: | ---: |
| 打开“退款”群聊 | 376 | 213 |
| 打开多人通话成员选择 | 1220 | 831 |
| 勾选“余生” | 426 | 441 |
| 点击“完成”，发起通话 | 1001 | 747 |

最后一步会真正呼叫联系人。群聊位置、窗口位置、分辨率或成员顺序改变后，应重新定位。原始执行脚本及截图保留在 `.reports/wechat-call-20260907/`。
