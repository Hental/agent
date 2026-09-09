# lark-cli 多 profile 与消息发送限制

记录日期：2026-09-07。核对版本：本机 `lark-cli 1.0.80`。
来源：本次实际命令结果、已安装的 `lark-shared` / `lark-im` / `lark-event` / `lark-contact` 技能，以及 Botmux 的已核实会话映射。

本文中的登录状态、权限、默认 profile 和监听状态均为当时快照，执行前应重新查询。不要将邮箱解析失败写成“该用户不存在”或“无法向其已有私聊发送消息”。

## 多 profile 配置

当时有 3 个 profile：

| Profile | AppID | 状态与用途 |
|---|---|---|
| `飞书CLI` | `cli_a9735e676e389bc4` | 当前默认 profile；曾记录用户“刘韬”，此前验证显示该应用未安装、用户 token 缺失 |
| `刘韬的智能助手` | `cli_aaf0527777b8dcdb` | 应用机器人身份验证通过；默认身份为 `auto` |
| `user` | `cli_aaf0527777b8dcdb` | 复用“刘韬的智能助手”的应用配置；默认身份为 `user`，用户授权成功 |

没有名为 `bot` 的 profile。“bot”是身份类型，不会自动创建同名 profile。

常用命令：

```bash
lark-cli profile list
lark-cli --profile user whoami
lark-cli --profile user auth status --json --verify
lark-cli --profile user config default-as user
lark-cli --profile '刘韬的智能助手' config default-as
```

`--profile` 只为本次命令选择配置。需要改变默认 profile 时使用 `lark-cli profile use user`；新增配置或执行一次命令不代表用户要求切换默认配置。

CLI 新增 profile 的标准入口：

```bash
lark-cli profile add --name '<名称>' --app-id '<AppID>' --brand feishu --app-secret-stdin
```

此命令从 stdin 接收应用密钥；不要把密钥放进命令参数、日志或知识库。`--use` 会在新增后切换到该 profile。

本次 `user` 的实际创建方式：`profile add` 要求提供应用密钥，随后在本机 `~/.lark-cli/config.json` 中新增配置项，复用已有应用的 Keychain 引用，并通过 CLI 设置、验证默认身份。未导出密钥明文。此处记录实际操作，不将手工复制配置作为通用初始化方案。

Profile 名称、应用和身份是不同概念。同一应用可用于 bot 和 user 身份；两个 profile 复用同一 AppID，也不能仅凭名称认定它们的 token 存储完全隔离。

## user / bot 与授权

- `--as bot` 使用应用身份（tenant access token）；不通过用户扫码取得 bot 身份。
- `--as user` 使用用户授权（user access token），访问能力同时受应用权限、用户授予的 scope 和用户自身可见范围限制。
- OAuth 页面显示“刘韬的智能助手”，表示接受用户授权的应用名称，不表示当前正在授权 bot 身份。
- `user` 登录成功只证明某个用户完成授权；名字“刘韬”不能证明账号邮箱为 `liutao.fe@bytedance.com`。

本次申请 `--domain calendar` 后，最终仅获授 `auth:user.id:read offline_access`，日历权限未获授予。认证结果已保存且 token 验证有效，但授权命令因为缺少请求的 scope 返回了非零退出码。因此要区分“已登录”和“所需业务权限齐全”。

之后实际查询仍缺少：

- 邮箱搜索：`contact:user:search`。
- 用户基础资料：`contact:user.basic_profile:readonly`。
- 用户枚举私聊：`im:chat:read`。

授权使用 split-flow：先通过 `auth login --scope '<所需权限>' --no-wait --json` 生成新链接和二维码，用户完成后再用同一个 profile 执行 `auth login --device-code '<本次返回值>'`。不要保存或复用过期二维码、device code、token；不要因为业务权限未获授予而反复请求相同授权。

## 发送消息的限制与实际结果

发送前明确应用身份与目标账号。机器人发送需要相应应用的 `im:message:send_as_bot` 权限，以及目标会话的可达性。用户发送使用 user 身份及对应的发送权限；不能把用户登录成功等同于拥有发消息权限。

已知本应用的用户 open_id 时，可直接发送；已知 chat_id 时，可按会话发送：

```bash
lark-cli --profile '刘韬的智能助手' im +messages-send \
  --as bot --user-id '<本应用下已核实的用户 open_id>' --text '<正文>'

lark-cli --profile '刘韬的智能助手' im +messages-send \
  --as bot --chat-id '<已核实的私聊 chat_id>' --text '<正文>'
```

发送交互卡片使用 `--msg-type interactive --content '<完整卡片 JSON>'`。发送成功需核对 `ok: true` 和返回的 `message_id` / `chat_id`；结果不明确时先查询历史，避免重复发送。邮箱、open_id、chat_id 不能互相替代，`--user-id` 接受的是用户 open_id。

本次按邮箱调用发送接口，参数为 `receive_id_type=email`、收件人 `liutao.fe@bytedance.com`，返回 `230001 / invalid receive_id`。这只证明该次应用与邮箱组合未能完成投递，不能据此断言目标私聊不存在，也不能断言必须安装到同一个企业才能发送。

### 已发现但不能当作目标邮箱的会话

- 应用：`刘韬的智能助手`，`cli_aaf0527777b8dcdb`。
- 用户 open_id：`ou_e84558035c3f852aa400828453c3d099`。
- 私聊 chat_id：`oc_b56801cc4a0d75c8a0765f8a21bff580`。
- 实际历史消息中的用户显示名：`刘韬(杉间科技)`；会话接口返回 `p2p`、`external: false`。
- 2026-09-07 15:30 的测试卡片成功发送到此会话，message_id 为 `om_x100b66d2ce775494c2807b4ad27c4e7`。

该账号与 `liutao.fe@bytedance.com` 的对应关系未核实。不要将这个会话写入目标邮箱映射，也不要因同名而继续向它投递目标邮箱的消息。

### 为什么 Botmux 能发

Botmux 使用另一应用和已确认的跨租户私聊：

| 字段 | 已核实值 |
|---|---|
| 机器人 | `Mini`（原名 `Botmux Codex`） |
| app_id | `cli_aa149e4ed9389cb5` |
| 目标邮箱 | `liutao.fe@bytedance.com` |
| 用户 open_id | `ou_0de0382daf0b601518c6eb63486207d3` |
| 私聊 chat_id | `oc_558e971f498438280d88ec1372df95c2` |

映射来自用户提供的含邮箱私聊截图与该应用的消息记录，不是通讯录按邮箱查询成功的结果。Botmux 通过已建立并核实的私聊投递，无需每次查询邮箱。

`open_id` 是应用相关标识，不能将 Mini 的 open_id 直接放进“刘韬的智能助手”的配置使用。使用已有 chat_id 也必须确认当前应用能访问对应会话。lark-cli 若配置为同一 Mini 应用并具备所需权限，可以使用相同的目标会话进行投递；本次尚未实测该配置下的 lark-cli 发送。

结构化元数据见 `../../../skills/global/lark-card/meta.json`，Botmux 流程见 `../../../skills/global/lark-card/SKILL.md`。

## 搜索与定位私聊

bot 身份不能通过 `im +chat-list` 枚举私聊。用户身份可用 `--types p2p`，但本次因缺少 `im:chat:read` 未能执行。已知 chat_id 时，bot 可以在权限允许范围内直接读取该会话历史。

如果邮箱查询不可用，可让目标账号向目标机器人发送一个特定测试文本，再通过消息事件获取该应用下的 `sender_id` 和 `chat_id`，结合用户确认核验邮箱归属。

务必先启动监听，看到 stderr 的 `[event] ready event_key=im.message.receive_v1` 以及连接成功，再请用户发消息：

```bash
lark-cli --profile '刘韬的智能助手' event consume im.message.receive_v1 \
  --as bot --timeout 10m \
  --jq 'select(.chat_type == "p2p" and (.content | contains("私聊定位测试")))'
```

实时监听不等于历史搜索，不保证能补收监听启动前的消息。本次曾先让用户发送、后启动监听，导致未获得定位事件；当时已请用户重发。截至此记录，目标邮箱与“刘韬的智能助手”的私聊仍未核实。

## 卡片 callback 支持与限制

- lark-cli 支持 `card.action.trigger`，仅支持 bot 身份。
- 应用后台需在“事件与回调 → 回调配置”启用卡片回调，采用 WebSocket 长连接，无需额外公网回调 URL。消费者成功启动并不证明后台已正确启用回调。
- Card 2.0 按钮需配置 `behaviors: [{"type":"callback","value":{...}}]`；纯跳转按钮不产生服务端业务回调。
- 监听输出包含操作人、消息 ID、`action_value`、表单值以及延迟更新 token。业务脚本需要自行读取、去重并处理，CLI 不会自动执行按钮对应的业务。
- 自动应答与业务完成、卡片更新是不同步骤。回调延迟更新 token 有效 30 分钟，最多使用 2 次；更新接口需要完整的新卡片 JSON。
- 自动获取原卡片内容需要 `im:message:readonly`。卡片发送成功、WebSocket 已连接都不证明收到过按钮回调。

```bash
lark-cli --profile '刘韬的智能助手' event consume card.action.trigger \
  --as bot --timeout 10m
```

本次实测：监听曾连接成功，测试卡片发送成功，但没有确认收到目标用户的按钮回调。不要将该次测试记录为回调端到端成功。

## 后续操作约束

- 回答查询问题时仅查询，不顺带发送测试消息、切换默认 profile 或改写应用配置。
- 以用户最新明确指定的邮箱、应用和消息内容为准；不同企业的同名用户不可混用。
- 优先检查当前 `--help` / `schema`。本机技能文档与 CLI 版本可能有差异，例如部分文档中的自动分页参数未出现在当前命令帮助中。
- 不把 App Secret、访问 token、refresh token 或 OAuth device code 写入本目录。
