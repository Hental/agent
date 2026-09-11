# Clash Verge 代理自建与订阅运维

整理日期：2026-09-11。来源：2026-09-06 起关于现有 SS 订阅到期、Clash Verge 兼容性、自建方案及部署运维流程的会话。官方资料在原会话中查阅；本次仅归档，不代表重新验证价格或软件版本。

状态：方案与配置模板，尚未购买或部署 VPS，未修改 Mac 的 Clash Verge 配置，也未实施监控。原始订阅 URL、访问令牌、节点地址和密码均不保存。

后续选型补充：[网络代理方案深度对比与评分](2026-09-11-网络代理方案深度对比与评分.md)按稳定性优先比较协议、故障域和成本。本文保留 SS 入门部署模板；长期主线路应先评估 REALITY/TCP 与 Hysteria2/UDP，并通过本地实测决定是否增加跨云备份。这里的脱敏说明仅针对本文，同目录的 `example.json` 是另行保存的敏感节点数据，不属于可公开研究资料。

## 核心结论与已有证据

- 原会话直接读取用户提供的订阅，HTTP 返回 200；响应为 Base64 编码的节点链接列表，解码后识别到 37 个 `ss://` 链接。这是当次响应的结果，不代表现在仍然有效。
- 用户表示当前 Mac 的 Clash Verge 正在使用该订阅，但服务已到期。没有读取本机配置来核实客户端版本、实际导入方式或节点状态。
- Clash Verge Rev 的 Mihomo 内核支持 Shadowsocks（SS）。节点协议支持与订阅格式支持是两个问题：完整远程配置通常使用 Clash YAML；代理集合还可通过 `proxy-providers` 管理。
- 普通客户端请求返回 Base64，并不能证明 Clash Verge 请求同一 URL 时也返回相同格式；服务商可能按 User-Agent 返回不同内容。原会话没有测试这种协商行为。
- 自建订阅只是组织、更新和分发节点配置，不能让服务商已到期的节点恢复使用。完全自建需要自己控制的有效代理服务器。
- 只有一台 Mac 使用时，导入本地 YAML 即可，无须先搭订阅网站。多设备同步时再增加 HTTPS 订阅。

## 方案比较

| 方案 | 构成 | 适用情况 | 主要代价 |
| --- | --- | --- | --- |
| VPS + 本地配置 | 单台 VPS、SS 服务端、Clash YAML | 单人单机，先验证线路 | 参数变动需要手动更新 |
| VPS + HTTPS 订阅 | 上述方案加域名和配置托管 | 多设备同步、自动更新 | 维护 HTTPS、令牌和配置发布 |
| VPS + 管理面板 | 例如 3x-ui，管理节点和输出订阅 | 喜欢网页操作、多设备管理 | 增加面板升级和访问保护工作 |
| Sub-Store | 合并、筛选、重命名和转换已有节点/订阅 | 多来源统一入口 | 仍依赖有效上游节点，不提供线路 |
| 多台 VPS + 统一订阅 | 不同地区或服务商部署多个节点 | 故障切换、多个出口 | 多台服务器费用和运维工作 |

推荐实施顺序：单台 VPS + sing-box 的 SS 服务 → 本地 YAML 验证 → HTTPS 订阅 → 监控和备份 → 按需要增加第二家服务商。

同一台 VPS 上开多个端口仍共享相同主机和线路，不能替代跨服务器备份。3x-ui 可作为另一种部署路线，不必与下面的手工 sing-box 服务重复安装。

## 云服务商选择与预算

| 候选 | 选择思路 | 核对事项 |
| --- | --- | --- |
| DigitalOcean | 从零开始的候选，测试控制台可用区域 | 内存、出站额度、超额费用、公网 IPv4 |
| AWS Lightsail | 已有 AWS 账户时优先考虑套餐型实例 | 区域流量差异、IPv4、静态 IP、快照计费 |
| Vultr | 希望尝试不同地区的线路 | 当地库存、套餐、出站流量计费 |
| Hetzner | 比价或第二条备份线路候选 | 地区、IPv4 单独费用、区域流量政策 |

原会话查阅到 DigitalOcean Droplet 起价 $4/月，Lightsail 含公网 IPv4 的 Linux 1 GB 套餐标价 $7/月；这些只是当时的参考，采购时重新查官方页面与结算页。建议按每月 $5–15 做单台起步预算，不视作报价或总成本保证。

起步规格：Ubuntu 24.04 LTS、1 vCPU、1 GB 内存、20 GB 磁盘、公网 IPv4。运行管理面板或较多附加服务时可考虑 2 GB 内存。

先按小时或短期购买，使用自己的宽带和手机热点测试，至少覆盖两个晚高峰。重点比较丢包、请求成功率和持续吞吐，不能仅凭机房位置、CPU 或单次测速判断。核对实例、流量、IPv4、备份和税费；预算通知通常不是硬性消费上限。

## 部署流程

### 1. 账户、SSH 和防火墙

1. 云账户开启双因素认证，创建 VPS 并上传 Mac 的 SSH 公钥。
2. 保留私钥在 Mac，若创建专用密钥可用 `ssh-keygen -t ed25519 -f ~/.ssh/selfhost_proxy`，不要覆盖已有文件。
3. 按服务商提供的初始用户登录，创建或确认可用的普通 sudo 用户。
4. 更新系统，安装 `curl`、`ca-certificates`、`openssl`、`ufw`、`vnstat`。
5. 同时配置云防火墙与主机防火墙。

| 入站端口 | 用途 | 范围 |
| --- | --- | --- |
| TCP 22 | SSH | 当前管理 IP；变化时通过云控制台更新 |
| TCP / UDP 8443 | SS 服务 | 客户端来源；移动网络使用需考虑动态地址 |
| TCP 80、443 | HTTPS 订阅及证书验证 | 需要订阅时再开放 |

防火墙默认拒绝入站、允许出站。保留当前 SSH 会话，在第二个终端验证新连接后再收紧登录设置。密钥登录确认可用后关闭 SSH 密码认证和 root 直接登录，修改后用 `sudo sshd -t` 验证，保留云控制台恢复入口。

### 2. 安装 sing-box

按官方 APT 文档添加 SagerNet 软件源并安装稳定版，不使用 beta 作为初次部署基线：

```bash
sudo install -d -m 0755 /etc/apt/keyrings
sudo curl -fsSL https://sing-box.app/gpg.key -o /etc/apt/keyrings/sagernet.asc
sudo chmod 644 /etc/apt/keyrings/sagernet.asc
sudo tee /etc/apt/sources.list.d/sagernet.sources >/dev/null <<'EOF'
Types: deb
URIs: https://deb.sagernet.org/
Suites: *
Components: *
Enabled: yes
Signed-By: /etc/apt/keyrings/sagernet.asc
EOF
sudo apt update
sudo apt install -y sing-box
```

用 `openssl rand -base64 32` 生成随机密码并存到密码管理器。将以下模板保存到 `/etc/sing-box/config.json`，替换占位符：

```json
{
  "log": { "level": "warn", "timestamp": true },
  "inbounds": [
    {
      "type": "shadowsocks",
      "tag": "ss-in",
      "listen": "0.0.0.0",
      "listen_port": 8443,
      "method": "chacha20-ietf-poly1305",
      "password": "REPLACE_WITH_RANDOM_PASSWORD"
    }
  ],
  "outbounds": [{ "type": "direct", "tag": "direct" }]
}
```

这是 IPv4 监听模板。检查服务运行用户，只授予它所需的配置读取权限；不要把含密码的文件改为所有人可读。

```bash
sudo sing-box check -c /etc/sing-box/config.json
sudo systemctl enable --now sing-box
sudo systemctl status sing-box --no-pager
sudo ss -lntup
sudo journalctl -u sing-box -n 100 --no-pager
```

### 3. 导入 Mac 本地配置

保存为 `selfhost.yaml`，替换 IP 与密码，在 Clash Verge 的订阅/配置页面导入并激活，选择 `My-SS`：

```yaml
mixed-port: 7890
allow-lan: false
mode: rule
log-level: warning

proxies:
  - name: My-SS
    type: ss
    server: VPS_IP
    port: 8443
    cipher: chacha20-ietf-poly1305
    password: "REPLACE_WITH_RANDOM_PASSWORD"
    udp: true

proxy-groups:
  - name: Proxy
    type: select
    proxies:
      - My-SS
      - DIRECT

rules:
  - IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
  - IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
  - IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
  - MATCH,Proxy
```

这是最小验证模板，并非完整分流、DNS 或 IPv6 配置。进入 Clash 的流量除列出的本地地址外走所选策略。先测试系统代理，再按应用需求测试 TUN；Clash Verge 可能覆盖混合端口等设置，测试时以应用实际配置为准。

## 分层测试和验收

| 层次 | 检查 | 能证明什么 |
| --- | --- | --- |
| 进程 | systemd 状态与日志 | 服务启动成功 |
| 端口 | Mac 上 `nc -vz VPS_IP 8443` | TCP 可达，不代表代理认证成功 |
| 代理链路 | 经 Clash 请求 HTTPS | 客户端、SS 认证与转发能够工作 |
| 出口 | 经代理查询公网 IP | 流量实际从预期 VPS 出口发出 |
| 业务 | 常用网站、应用、持续下载 | 是否满足实际需求 |
| 稳定性 | 多网络、多时段、重启后复测 | 线路适用性与恢复能力 |

Mac 请求测试，假设混合端口为 7890：

```bash
curl --noproxy "" --proxy http://127.0.0.1:7890 \
  --connect-timeout 5 --max-time 20 \
  -o /dev/null -sS \
  -w 'HTTP=%{http_code} total=%{time_total}s\n' \
  https://example.com

curl --noproxy "" --proxy http://127.0.0.1:7890 \
  --max-time 20 https://api.ipify.org
```

使用这些命令前确认策略选中 `My-SS`，避免 DIRECT 回退掩盖故障。公网 IP 查询会联系外部查询服务；出口应与 VPS 实际公网出口相符，NAT 环境不能只比较网卡地址。

验收要求：

- 白天、晚高峰各连续请求至少 20 次，记录成功率和耗时。
- 在日常宽带、手机热点分别测试；持续下载使用自己拥有或允许测速的文件，控制流量。
- 检查真实业务；特定网站拒绝数据中心 IP 不等于代理整体故障。
- HTTP `curl` 只验证 TCP 路径，DNS、UDP、TUN 和 IPv6 按实际使用场景独立验证。
- 重启 VPS 后服务自动启动，重启 Mac/Clash 后配置仍生效。
- 连续晚高峰不满足需求时优先换线路，不盲目叠加面板或调参。

## HTTPS 订阅发布

1. 域名如 `sub.example.com` 的 A 记录指向 VPS；没有可用 IPv6 时不要保留错误 AAAA。
2. 放行 TCP 80、443，按官方方法安装 Caddy。
3. 创建 `/srv/subscription`，仅允许管理用户写入、Caddy 服务用户读取。
4. 将已验证的 YAML 放到 `/srv/subscription/clash.yaml`。
5. 用 `openssl rand -hex 32` 生成独立订阅令牌，不与 SS 密码复用。

`/etc/caddy/Caddyfile` 示例：

```caddyfile
sub.example.com {
    @subscription path /REPLACE_WITH_RANDOM_TOKEN/clash.yaml
    handle @subscription {
        rewrite * /clash.yaml
        root * /srv/subscription
        header Cache-Control "no-store"
        file_server
    }
    handle {
        respond "Not found" 404
    }
}
```

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
```

Caddy 在域名解析和验证端口满足条件时管理 HTTPS 证书。订阅形式为 `https://sub.example.com/随机令牌/clash.yaml`，设置每 6–24 小时更新即可。

这属于持有 URL 即可访问的凭证方案，并非用户登录。不要公开 URL、提交公共订阅转换站或在访问日志中保存完整令牌。验证正确令牌返回 YAML、错误令牌返回 404、证书有效，且客户端不依赖失效代理也能获取订阅。

配置变更先校验，再原子替换线上文件。保留本地已知可用配置以便恢复。将来可把节点拆成 `proxy-providers`，使节点更新与客户端分流规则独立。

## 监控与告警

| 层次 | 实施方式 | 起步阈值 |
| --- | --- | --- |
| 主机资源 | 云监控、systemd、磁盘和内存检查 | CPU >80% 持续 10 分钟；磁盘 >80%；OOM |
| 流量与费用 | 云账单告警，vnStat 辅助趋势 | 月额度 50%、80%、95% |
| 服务可达性 | 独立设备的 Uptime Kuma 检查 TCP 8443 与 HTTPS | 60 秒一次，连续失败 3 次 |
| 订阅内容 | HTTP 200 且正文含 `proxies:` | 下载失败或内容错误 |
| 真实代理链路 | 使用网络内的常开设备经代理请求 HTTPS | 连续失败 3 次，恢复通知 |

资源阈值是起步建议，应按实际负载调整。监控订阅会接触凭证，只使用可信监控系统；不要把唯一监控放在被监控 VPS 上。

端到端探测核心命令：

```bash
curl --noproxy "" --proxy http://127.0.0.1:7890 \
  --connect-timeout 5 --max-time 15 \
  --fail --silent --show-error --output /dev/null \
  https://example.com
```

Mac 可通过 launchd 定时执行，若设备会休眠则换常开设备。原会话未实现调度文件、连续失败计数或消息发送。自动通知接入本项目的飞书卡片时应通过 Botmux / lark-card，不能新建旧版 lark-bot 直发链路。

启用 `vnstat` 并通过 `vnstat -m` 观察月流量，最终计费以云账单为准。配置监控后实际暂停、恢复 SS 服务，验证告警与恢复通知；外部端口在线不能代替本地端到端验证。

## 运维、备份与回滚

| 周期 | 工作 |
| --- | --- |
| 每天自动 | 可达性、真实链路、资源、流量告警 |
| 每周 | 检查失败趋势、异常流量、磁盘和安全更新 |
| 每月 | 检查软件更新、账单、域名续费与备份 |
| 每次升级 | 保存版本与配置，校验，维护窗口升级，端到端复测 |
| 每季度 | 新机器恢复演练 |

常用检查：`systemctl status sing-box caddy`、`journalctl -u sing-box --since "1 hour ago"`、`journalctl -u caddy --since "1 hour ago"`、`df -h`、`free -h`、`vnstat -m`。

建议限制 journald 日志总量，例如 200 MB，避免占满磁盘。备份应覆盖 sing-box 配置、Caddyfile、订阅 YAML、防火墙规则、DNS 记录、部署步骤和软件版本，包含凭证的备份需加密并存到 VPS 之外。

升级先阅读迁移说明、备份并保留可恢复的软件包或快照；安装选定稳定版后校验、重启、从 Mac 复测。失败时恢复相互匹配的旧软件与配置。系统安全更新可自动化，代理软件大版本升级单独验证。

## 故障定位与迁移

| 症状 | 优先检查 |
| --- | --- |
| 订阅失败、现有节点正常 | DNS、证书、Caddy、令牌 |
| 订阅正常、代理超时 | SS 进程、两层防火墙、线路 |
| 端口通、代理请求失败 | 密码、加密方式、服务端出网、日志 |
| 白天正常、晚上慢 | 拥塞、丢包、套餐限速 |
| 特定网站异常 | 出口 IP/地区限制、网站策略 |
| UDP 或部分应用异常 | UDP 防火墙、TUN、MTU、应用接管 |
| 流量突增 | 凭证泄露、共享设备、持续测速、异常进程 |

迁移顺序：新 VPS 部署并测试 → 订阅同时提供新旧节点 → 客户端更新验证 → 稳定后移除旧节点 → 删除旧资源并核对残留磁盘、IP、快照费用。若订阅与代理同机，迁移 Caddy 并更新 DNS；多节点阶段可独立托管订阅。

上线标准：重启自动恢复、晚高峰满足需求、订阅能更新、告警实际触发并恢复、备份可恢复、账单和流量告警生效。

## 官方资料

- [DigitalOcean Droplet 价格](https://www.digitalocean.com/pricing/droplets)
- [AWS Lightsail 价格](https://aws.amazon.com/lightsail/pricing/)
- [Vultr 流量计费](https://docs.vultr.com/support/platform/billing/how-is-bandwidth-usage-calculated)
- [Hetzner 地区](https://docs.hetzner.com/cloud/general/locations/) / [计费](https://docs.hetzner.com/cloud/billing/faq/)
- [sing-box 安装](https://sing-box.sagernet.org/installation/package-manager/) / [SS 入站](https://sing-box.sagernet.org/configuration/inbound/shadowsocks/)
- [Mihomo SS](https://wiki.metacubex.one/config/proxies/ss/) / [VLESS](https://wiki.metacubex.one/config/proxies/vless/) / [代理集合](https://wiki.metacubex.one/config/proxy-providers/)
- [Clash Verge Rev 配置导入](https://www.clashverge.dev/guide/profile.html)
- [Caddy 安装](https://caddyserver.com/docs/install) / [自动 HTTPS](https://caddyserver.com/docs/automatic-https)
- [3x-ui](https://github.com/MHSanaei/3x-ui)
- [Sub-Store](https://github.com/sub-store-org/Sub-Store)
- [Uptime Kuma](https://github.com/louislam/uptime-kuma)
