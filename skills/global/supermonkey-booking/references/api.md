# 青橙超级猩猩 API

基础地址：`https://yql.qingchengfit.cn`

所有接口都需要已登录飞书 WebView 的 Cookie。禁止将 Cookie 存储在本 Skill 中。

## 接口

| 操作 | 方法 | 路径 |
|---|---|---|
| 查询附近门店 | GET | `/api/corp/company/gyms/` |
| 查询门店详情 | GET | `/api/corp/company/partner/gyms/{gym_id}/` |
| 查询超级猩猩城市 | GET | `/api/corp/company/city-gyms/` |
| 查询课程排期 | GET | `/api/corp/company/supermonkey/schedules/` |
| 查询预约弹窗 | GET | `/api/mini_program_c/supermonkey/dialog/query/` |
| 查询可用补贴 | GET | `/api/corp/company/subsidy/available/` |
| 查询企业通用卡 | GET | `/api/saas/user/general/cards/` |
| 创建待支付订单 | POST | `/api/corp/company/supermonkey/order/` |

## 已观测标识

- 字节跳动企业 ID：`QC0DA3DA`
- 天府三街门店 ID：`9QqlGw2W`
- 示例排期 ID：`XPm6K3QL`
- 支付宝渠道：`ALIPAY_QRCODE`

这些标识和价格只是历史观测值，不是永久常量。创建订单前必须通过接口刷新。

## 创建订单请求体

```json
{
  "general_card_id": 189982,
  "sub_channel": "ALIPAY_QRCODE",
  "online_cost": 2900,
  "schedule_id": "XPm6K3QL"
}
```

`online_cost` 使用整数分。成功响应通常包含 `id`、`out_trade_no`、`total_fee`，以及支付宝 `url` 或 `qr_code`。

## 已知错误

- `个人支付金额不正确`：刷新课程和补贴，禁止使用过期的 `online_cost` 重试。
- `超猩用户关系不存在`：当前 Cookie 不属于已绑定飞书与超级猩猩关系的用户。
