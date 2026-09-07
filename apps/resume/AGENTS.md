# Resume app

- `data/report.md` and `data/report.json` are the editable report data. Preserve source attribution and the distinction between personal contributions, team outcomes, estimates, and measured results.
- `sources/` contains the original Feishu Markdown documents and JSON search results. Keep these original records intact.
- `template.html` controls presentation and browser interactions; `build-report.mjs` renders the data; `report.mjs` provides build, preview, and PDF commands.
- `career-report.html`, `output/`, and QA artifacts are generated and ignored. Change source data or templates instead of editing generated files.
- From the repository root, use `pnpm run resume test`, `pnpm run resume build`, `pnpm run resume preview`, and `pnpm run resume pdf`. Run the app tests and build after changing the generator. Check PDF rendering when changing print layout.
