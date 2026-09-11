# Resume app

- `data/report.md` and `data/report.json` are the editable report data. Preserve source attribution and the distinction between personal contributions, team outcomes, estimates, and measured results.
- `sources/` contains the original Feishu Markdown documents and JSON search results. Keep these original records intact.
- `sources/<序号_团队_project-id>/` groups each selected project's `meta.json`, `project.md`, and supporting Markdown materials. Follow `sources/AGENTS.md` when organizing evidence; keep report data as the presentation source of truth.
- `lib/` contains the build, preview, PDF export, and test scripts. Use package.json scripts as the command entrypoints.
- `template/template.html` controls presentation and browser interactions; `lib/build-report.mjs` renders the data; `lib/report.mjs` provides build, preview, and PDF commands.
- `output/`, and QA artifacts are generated and ignored. Change source data or templates instead of editing generated files.
- From the repository root, use `pnpm run resume test`, `pnpm run resume build`, `pnpm run resume preview`, and `pnpm run resume pdf`. Run the app tests and build after changing the generator. Check PDF rendering when changing print layout.

# MD + JSON 驱动的工作回顾报告

唯一编辑入口是 `data/report.md` 和 `data/report.json`。HTML、PDF 都由相同数据生成。

```text
data/report.md     正文：背景、个人职责、技术工作、指标口径
       +
data/report.json   结构化内容：元信息、时间线、项目、指标、来源与正文引用
       ↓
template/template.html + lib/build-report.mjs
       ↓
output/career-report.html 静态 HTML / 本地动态预览
       ↓
output/pdf/career-report.pdf
```

## 使用命令

在工作区根目录运行：

```sh
pnpm run resume preview
pnpm run resume build
pnpm run resume pdf
pnpm run resume test
```

在本目录运行：

```sh
npm run preview     # 本地预览；编辑 MD / JSON 后自动刷新
npm run build       # 生成可离线打开的 HTML
npm run pdf         # 重新读取数据、构建 HTML，再导出 PDF
```

npm scripts 是统一入口；依赖仍由工作区 pnpm 管理，无需额外运行 npm install。导出 PDF 使用 `npm run pdf`，自定义路径使用 `npm run pdf -- --output ./刘韬_工作回顾.pdf`。

在工作区根目录也可使用 `npm --prefix apps/resume run build`（或 `preview` / `pdf` / `test`）。向脚本传参时添加 `--`，例如 `npm run preview -- --port 8770 --no-open`。

跨平台使用：

```sh
node lib/report.mjs preview --port 8770 --no-open
node lib/report.mjs build
node lib/report.mjs pdf --output "./刘韬_工作回顾.pdf"
node lib/report.mjs --help
```

默认数据、模板和产物路径固定按应用根目录 `apps/resume/` 解析；命令参数中的相对路径按当前终端目录解析。

## 编辑原始数据

正文采用带 ID 的二级标题。标题名称可改，`{#id}` 用于 JSON 引用：

```markdown
## 互动白板 · 个人职责 {#board.responsibility}

负责整体技术设计和产品能力建设，主导移动端 SDK 跨端迁移。
```

对应 JSON 项目中：

```json
{
  "id": "board",
  "title": "火山互动白板",
  "responsibility": "board.responsibility"
}
```

以上为字段示例，完整结构见 `data/report.json`。JSON 管理项目顺序、标题、指标、流程节点、来源 URL；MD 管理描述和说明。保留指标中的团队/个人归属、预估/实测区别。

正文支持常用 Markdown 文字、强调、列表和链接；布局中的简介字段按行内 Markdown 渲染，项目 body 和指标说明按段落渲染。当前模板不支持图片，原始 HTML 会转义显示。来源引用写成 `[述职报告](#s2)`，对应 JSON `sources` 中的 `id`。

缺失正文 ID、重复 ID、无效来源或超出坐标范围的图表数据会中止构建，避免静默丢失内容。

## 预览与 PDF

预览仅监听 `127.0.0.1`，不上传数据。页面每约 1.2 秒检查 MD / JSON / 模板变化，发生变化后刷新；临时编辑错误修正后可恢复预览。按 Ctrl+C 停止。

- “导出 PDF”：打开浏览器打印对话框，可选择另存为 PDF。
- 预览中的“下载 PDF”：服务器从最新 MD + JSON 生成并下载 PDF。
- 离线 HTML 中的“下载 PDF”：下载上一次已生成的 PDF；修改数据后请运行 `pdf` 命令更新。
- 命令导出使用 A4，等待字体加载，展开所有项目与说明，保留来源链接和页码。

不要直接修改 `output/career-report.html`：下次构建会覆盖它。页面样式和交互在 `template/template.html`，结构渲染在 `lib/build-report.mjs`。

## 依赖与验证

应用已接入工作区的 pnpm 依赖管理。在工作区根目录安装并验证：

```sh
pnpm install
pnpm --dir apps/resume exec playwright install chromium
pnpm run resume test
```

PDF 导出也可使用已安装的 Google Chrome；可设置 `CHROME_PATH` 指定浏览器路径、`PLAYWRIGHT_MODULE_PATH` 指定 Playwright 模块目录。

生成的 HTML、PDF 和 QA 临时文件均已忽略，不进入版本控制。

## 原始材料与配套文件

- `sources/`：原始飞书文档 Markdown 和搜索结果 JSON，保持原样，供追溯。
- `data/`：整理后的可编辑报告源数据。
- `刘韬_简历.md`：此前产出的简历材料，独立保留，不随报告自动改写。
- `liutao-resume.tex`：此前的 LaTeX 简历。
- `sources/summary/字节近六年工作回顾与证据.md`：完整研究记录。

HTML / PDF 是包含证据和待补信息的完整工作回顾，篇幅长于投递简历。

## 精简打印版

打印与 PDF 以个人信息、简短工作经历、技能索引、倒序代表项目和教育经历为主，隐藏指标卡、流程图、参考列表和研究说明。JSON 的 `employment` 与 `skills` 引用 MD 正文；每个项目的 `print.summary` 是角色/背景简介，`print.bullets` 是 Markdown 成果列表。网页与 PDF 共用这些精简正文；网页的“技术说明与成果口径”可展开查看原有详细资料。保留关键指标的团队归属与统计口径，不把里程碑时间当作未经确认的任职起止月。不固定某个项目另起一页，以自然分页及项目内避免断页保持两页可读性。
