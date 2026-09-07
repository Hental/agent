# 成都兴隆湖—高新区互联网岗位调研

## 项目用途

本目录保存成都兴隆湖—高新区 Web、前端、全栈、Agent 与技能相近岗位的最终报告、结构化数据和可复现脚本。当前数据快照为 **2026-08-10**。

岗位数量统一解释为“公开可验证有效岗位数（市场下限）”，不等同于招聘平台宣称的结果数或成都全市场岗位总量。

## 当前结论

- 本地主样本为 **37 个有效岗位、19 家去重企业**；另有 **6 个有效远程样本**，不计入成都总量。
- 严格核心区（兴隆湖、成都科学城、鹿溪智谷）本次核到 **0 个有效主样本**；37 个本地岗位均位于高新南区扩展范围。这表示公开检索未核到，不表示核心区没有隐性招聘。
- 岗位结构为前端 22 个、Agent 10 个、AI 应用 3 个、全栈 2 个。
- 36 个岗位可标准化薪资；月薪中点中位数为 **27.3K**，P25–P75 为 **22.3K–35.6K**。
- 35K 强匹配岗位 3 个；仅薪资上限达到 35K 的可谈岗位 18 个；未达 35K 的岗位 15 个；薪资缺失 1 个。
- 美团和腾讯合计提供 20 个本地主样本，占 **54.1%**，岗位供给有明显头部集中。
- 高频技能为 React、TypeScript（各 20 次）、Python（9 次）和 Agent（8 次）；随后是小程序、性能优化、Node.js、RAG、工程化和 React Native。
- 公开投递人数覆盖率为 0%，不得生成数值供需指数；现有供需判断均为低置信度。
- 当前优先机会集中在腾讯 AI 应用后台与 Agent 平台、中彦医疗 Agent 基础设施、美团 Web 前端专家及闪购高级前端岗位。

## 文件结构

```text
apps/job/
├── AGENTS.md
├── report/
│   └── chengdu-internet-jobs-report.html
├── outputs/
│   ├── chengdu_internet_jobs_20260810/
│   │   ├── chengdu_internet_jobs.csv
│   │   ├── collection_log.csv
│   │   ├── report_data.json
│   │   ├── artifact.json
│   │   └── qa_results.json
│   ├── lark_recruiting_channel_sources.xml
│   └── xinglonghu_35k_job_screening/
└── scripts/
    ├── build_chengdu_job_report.mjs
    ├── build_chengdu_artifact.mjs
    └── build_chengdu_html_report.mjs
```

主要入口：

- 本地报告：`report/chengdu-internet-jobs-report.html`
- 公网报告：<https://liutao-mac.x.ddnsto.com/chengdu-internet-jobs-report.html>
- 岗位明细：`outputs/chengdu_internet_jobs_20260810/chengdu_internet_jobs.csv`
- 自动校验：`outputs/chengdu_internet_jobs_20260810/qa_results.json`

## 已确认的研究口径

1. 有效岗位必须有可访问的职位页或可靠公开索引，并存在明确雇主、岗位、地点和活动证据；失效或无法验证的记录只作为线索。
2. 地域按核心区和扩展区分层；扩展区包含高新南区、天府软件园、天府一至五街、金融城和中和。
3. 时间窗口以采集日仍可投递或近 30 天存在可靠活动证据为主；旧索引必须二次核验。
4. 月薪下限不低于 35K 为“强匹配档”；下限不足、上限达到 35K 为“可谈档”，不得合并。
5. Worldwide/APAC 远程岗位必须核实中国常驻资格、用工主体、时区和远程方式，并与成都本地样本分开统计。
6. 每个岗位只设置一个主类别，跨类别能力使用技能标签表达，避免重复计数。
7. AI 应用、Web3 等相近岗位只有在核心职责与 Web、前端、全栈或 Agent 高度重叠时才纳入。
8. 薪资统一为税前 K RMB/月，同时保留原始区间、发薪月数、币种和汇率依据。
9. 薪资统计使用区间中点的中位数及 P25–P75；小样本类别不发布稳定结论。
10. 企业规模优先采用公司官网、年报或权威企业资料，其次采用招聘平台披露。
11. 高薪、高优先级、来源冲突或信息不完整的岗位优先进行公司官网或多来源复核。
12. 竞争或投递信号覆盖率达到 30% 才允许计算数值供需指数，否则只给带置信度的定性判断。
13. 社交平台只用于发现招聘线索、技能变化和市场情绪；没有职位级证据时不计为有效岗位。
14. 至少 8 个可靠时间点才绘制趋势线；不足时只展示证据时间线，不推断同比或环比。
15. 来源冲突时，公司官网或招聘系统优先于招聘平台，招聘平台优先于搜索摘要和社交讨论，并保留冲突记录。
16. 按雇主、标准化岗位、地点、职位 ID/链接、薪资和描述相似度综合去重。
17. 忽略外包和驻场岗位，不进入主样本。
18. 求职优先级权重为薪资 30%、技能匹配 25%、地点/远程 20%、公司质量 15%、真实性与可投性 10%。
19. 明细必须保留来源 URL、采集时间、纳入状态、排除原因和置信度。
20. 职位页直接可核为高置信度；多个可靠公开证据一致为中；仅搜索摘要或单一弱线索为低。
21. 核心关键词、地域和来源组合连续两轮不再产生新雇主或高价值岗位，且重点职位完成复核后，可停止一轮采集。
22. 定量结论、定性判断和线索必须分级表达，不把低置信度线索表述为确定事实。

## 数据处理流程

1. 建立岗位名称、地域、来源和远程条件的关键词矩阵。
2. 采集职位级公开证据，记录原始字段、URL、采集时间和活动状态。
3. 标准化岗位类别、地点、薪资、企业规模和技能标签。
4. 排除范围外、失效、重复、外包和驻场岗位。
5. 复核高薪和高优先级岗位。
6. 计算岗位数量、薪资分位数、35K 档位、企业规模、技能频次和求职优先级。
7. 根据竞争信号覆盖率决定是否生成供需指数。
8. 运行 QA，核对去重、薪资、地域、排除规则、计数和远程隔离。
9. 生成 CSV、JSON 和移动端适配的单文件 HTML。

## 构建与验证

脚本只依赖 Node.js 内置模块，并根据自身位置解析项目目录，可从任意当前目录执行：

```bash
node /Users/liutao/workspace/agent/apps/job/scripts/build_chengdu_job_report.mjs
node /Users/liutao/workspace/agent/apps/job/scripts/build_chengdu_artifact.mjs
node /Users/liutao/workspace/agent/apps/job/scripts/build_chengdu_html_report.mjs
```

第三步默认只更新本目录的 `report/chengdu-internet-jobs-report.html`。只有明确需要发布时，才指定公网输出：

```bash
CHENGDU_REPORT_HTML_OUT=/Users/liutao/workspace/www/chengdu-internet-jobs-report.html \
  node /Users/liutao/workspace/agent/apps/job/scripts/build_chengdu_html_report.mjs
```

构建后必须确认 `qa_results.json` 的 `status` 为 `pass`，并且 `checks` 中所有项目均为 `true`。

## 更新要求

- 职位关闭后保留历史记录并更新状态，不直接删除证据。
- 建议每两周刷新职位活动状态、薪资和来源链接。
- 优先补采兴隆湖、成都科学城公司官网及园区企业名录，降低核心区检索盲区。
- 远程岗位单独维护中国常驻资格、劳动合同主体、税务、时区和英语要求。
- 真实投递应记录投递数、7 天回复数、约面数、技术面数、Offer 数和实际薪资，用于校准供需判断。
- 不在本目录创建 `README.md`；项目与脚本说明持续维护在本文件中。
