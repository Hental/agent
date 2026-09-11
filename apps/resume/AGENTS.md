# 简历应用

本应用按“原始材料 → 项目事实 → 简历数据 → HTML／PDF”组织内容，输出两页简历，并在网页中提供详细说明。

## 修改前必读

- [RULE.md](RULE.md)：定位、事实核实、写作与交付要求。
- 整理来源时阅读 [sources/AGENTS.md](sources/AGENTS.md)，从 [来源索引](sources/INDEX.md) 查找材料。
- 整理事实或简历时阅读 [data/AGENTS.md](data/AGENTS.md)。事实不清楚时搜索飞书文档或询问用户，禁止猜测。

## 目录与职责

| 路径 | 用途 |
| --- | --- |
| `sources/` | 原始快照和来源目录；禁止重复，每个 Markdown 必须含 source、source_title、type、summary 元信息 |
| `data/<项目目录>/project.md`、`evidence.json` | 按项目整理的事实、原文摘录、定位和使用边界 |
| `data/<项目目录>/user-confirmed.md` | 用户补充与纠正，单独于文档证据记录 |
| `data/<项目目录>/resume-map.json` | 简历采用的事实及计算依据 |
| `data/resume.md` | 简历正文、项目说明和指标口径 |
| `data/resume.json` | 基本信息、项目顺序、指标、来源及正文引用 |
| `lib/template/template.html` | 页面样式、交互和打印布局 |
| `lib/build-report.mjs` | 读取数据并渲染 HTML |
| `lib/report.mjs`、`lib/pdf.mjs` | 命令入口、本地预览和 PDF 导出 |
| `lib/report.test.mjs` | 构建与预览测试 |
| `output/` | 生成的 HTML 和 PDF，已忽略版本控制，不直接修改 |

截图、渲染预览、检索响应和验证日志等中间文件放在工作区根目录 `.reports/` 的任务子目录。选定的最终来源材料按 `sources/AGENTS.md` 归档。

## 内容维护

先更新项目事实及依据，再合并精简到简历。同步检查正文、详细说明、指标与来源，区分个人／团队、目标／达成、预估／实际。

`resume.md` 使用带 ID 的二级标题，`resume.json` 通过 ID 引用正文。例如：

```markdown
## 项目名称 · 个人职责 {#project.responsibility}

此处填写已核实的职责。
```

对应 JSON 字段为 `"responsibility": "project.responsibility"`。来源链接使用 `[来源名称](#s1)`，对应 JSON 的 `sources[].id`。缺失或重复 ID、无效引用等会中止构建。

正文支持文字、强调、列表和链接；原始 HTML 会转义，正文渲染不支持图片。网页与 PDF 共用项目的 `print.summary` 和 `print.bullets`；网页可展开详细说明，打印隐藏指标卡、流程图、参考列表和研究说明。

`liutao-resume.tex` 和 `sources/00_公共资料/字节近六年工作回顾与证据.md` 是历史材料，不随当前构建更新，也不作为当前简历的编辑入口。

## 运行与验证

在工作区根目录使用：

```sh
pnpm run resume build     # 生成 output/career-report.html
pnpm run resume preview   # 本地预览，数据或模板修改后自动刷新
pnpm run resume pdf       # 重新构建并导出 output/career-report.pdf
pnpm run resume test      # 运行现有测试
```

也可在本目录使用 `npm run <命令>`。直接调用示例：

```sh
node lib/report.mjs preview --port 8770 --no-open
node lib/report.mjs pdf --output ./自定义简历.pdf
```

默认文件路径按应用根目录解析；显式传入的相对路径按当前终端目录解析。依赖通过工作区根目录 `pnpm install` 安装，不在应用目录单独安装。

PDF 导出需要 Chromium 或 Google Chrome。缺少浏览器时运行 `pnpm --dir apps/resume exec playwright install chromium`；可通过 `CHROME_PATH` 指定浏览器、`PLAYWRIGHT_MODULE_PATH` 指定 Playwright 模块。

- 修改生成逻辑后运行测试和构建；修改简历内容后重新生成 PDF，检查事实一致性与两页排版。
- 修改打印布局后渲染并查看每页，检查断页、溢出、遮挡和可读性。
- 预览仅监听 `127.0.0.1`，按 Ctrl+C 停止。“导出 PDF”打开打印对话框；预览中的“下载 PDF”重新生成文件，离线 HTML 则下载最近一次生成的 PDF。
