#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { join, resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildReport, renderReport, reportDir, defaultPaths, escapeHtml } from './build-report.mjs';

const help = `Markdown + JSON → HTML 预览 / PDF 导出

  ./report.command build                  从原始数据生成 career-report.html
  ./report.command preview                启动本地预览（默认操作，修改后自动刷新）
  ./report.command pdf                    重新构建并导出完整 PDF
  ./export-pdf.command                    同上，保留原命令

  node lib/report.mjs preview --port 8770 --no-open
  node lib/report.mjs pdf --output ./我的报告.pdf
  node lib/report.mjs build --data ./data/report.json --markdown ./data/report.md

参数：--data JSON路径，--markdown MD路径，--output 输出路径（build/pdf），
      --port 端口（preview），--no-open（preview）。
默认源文件为报告目录内 data/report.json 与 data/report.md；相对参数按当前目录解析。
所有操作均在本机执行，预览仅监听 127.0.0.1。`;

export async function run(args = process.argv.slice(2)) {
  if (args.includes('--help') || args.includes('-h')) { console.log(help); return; }
  const action = args[0] && !args[0].startsWith('--') ? args.shift() : 'preview';
  if (!['build','preview','pdf'].includes(action)) throw new Error(`未知命令：${action}。使用 --help 查看用法。`);
  const options = {}; let output; let port = 8770; let open = true;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--no-open' && action === 'preview') { open = false; continue; }
    const flag = args[i];
    if (!['--data','--markdown','--output','--port'].includes(flag) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`参数不正确：${flag}`);
    const value = args[++i];
    if (flag === '--data') options.data = resolve(value);
    if (flag === '--markdown') options.markdown = resolve(value);
    if (flag === '--output') { if (action === 'preview') throw new Error('preview 不支持 --output。'); output = resolve(value); }
    if (flag === '--port') {
      port = Number(value);
      if (action !== 'preview' || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('预览端口必须为 1–65535 的整数。');
    }
  }
  if (action === 'build') {
    if (output && !output.endsWith('.html')) throw new Error('HTML 输出须以 .html 结尾。');
    console.log(`已生成：${await buildReport({...options, ...(output ? {html: output} : {})})}`); return;
  }
  if (action === 'pdf') {
    output ??= defaultPaths.pdf;
    if (!output.toLowerCase().endsWith('.pdf')) throw new Error('PDF 输出须以 .pdf 结尾。');
    const input = await buildReport(options);
    const { exportPdf } = await import('./pdf.mjs');
    await exportPdf({ input, output }); return;
  }
  await startPreview({ ...options, port, open });
}

export async function startPreview(options) {
  await renderReport(options);
  let pdfQueue = Promise.resolve();
  const paths = {...defaultPaths, ...options};
  const version = async () => createHash('sha256').update((await Promise.all([paths.data,paths.markdown,paths.template].map(p=>readFile(p)))).map(b=>b.toString()).join('\0')).digest('hex');
  const reloadScript = initial => `<script>(()=>{let current=${JSON.stringify(initial)};setInterval(async()=>{try{const next=await(await fetch('/__version',{cache:'no-store'})).text();if(next!==current)location.reload();current=next;}catch{}},1200);})();</script>`;
  const mime = {'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.tex':'text/plain; charset=utf-8','.pdf':'application/pdf'};
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      response.setHeader('Cache-Control','no-store');
      if (pathname === '/__version') { response.end(await version()); return; }
      if (pathname === '/' || pathname === '/career-report.html') {
        const initial = await version();
        const html = await renderReport(options);
        response.setHeader('Content-Type',mime['.html']);
        response.end(html.replace('</body>',reloadScript(initial)+'</body>')); return;
      }
      if (pathname === '/output/pdf/career-report.pdf') {
        const operation = pdfQueue.then(async () => {
          const temporary = join(reportDir, `.preview-${randomUUID()}.html`);
          try {
            await writeFile(temporary, await renderReport(options));
            const { exportPdf } = await import('./pdf.mjs');
            await exportPdf({ input:temporary, output:defaultPaths.pdf });
            return await readFile(defaultPaths.pdf);
          } finally { await rm(temporary, {force:true}); }
        });
        pdfQueue = operation.catch(()=>{});
        const bytes = await operation;
        response.setHeader('Content-Type','application/pdf');
        response.setHeader('Content-Disposition','attachment; filename="career-report.pdf"');
        response.end(bytes); return;
      }
      const d = JSON.parse(await readFile(paths.data,'utf8'));
      const allowed = new Map([['/data/report.json',paths.data],['/data/report.md',paths.markdown]]);
      for (const item of d.downloads) {
        if (/^(?:[a-z]+:|\/|.*\.\.)/i.test(item.path)) continue;
        allowed.set('/'+item.path,join(reportDir,item.path));
      }
      if (!allowed.has(pathname)) { response.writeHead(404); response.end('Not found'); return; }
      response.setHeader('Content-Type',mime[extname(pathname)] ?? 'application/octet-stream');
      response.end(await readFile(allowed.get(pathname)));
    } catch (error) {
      response.writeHead(500,{'Content-Type':'text/html; charset=utf-8'});
      response.end(`<h1>数据暂时无法生成报告</h1><pre>${escapeHtml(error.message)}</pre><p>修正 MD / JSON 后自动重试。</p><script>setTimeout(()=>location.reload(),2500)</script>`);
    }
  });
  await new Promise((done, reject) => { server.once('error',reject); server.listen(options.port,'127.0.0.1',done); });
  const url = `http://127.0.0.1:${server.address().port}`;
  console.log(`预览：${url}\n修改 data/report.md 或 data/report.json 后，页面会自动刷新。Ctrl+C 停止。`);
  if (options.open) {
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
    spawn(opener,[url],{stdio:'ignore'}).on('error',()=>console.log(`请手动打开 ${url}`));
  }
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch(error => { console.error(error.message); process.exitCode = 1; });
}
