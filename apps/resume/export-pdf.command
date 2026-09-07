#!/bin/zsh
set -eu
report_dir="${0:A:h}"
if command -v node >/dev/null 2>&1; then
  report_node="$(command -v node)"
elif [[ -x "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  report_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
else
  print -u2 '未找到 Node.js，请先安装 Node.js 20+。'
  exit 1
fi
exec "$report_node" "$report_dir/export-pdf.mjs" "$@"
