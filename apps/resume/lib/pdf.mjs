#!/usr/bin/env node
import { createRequire } from 'node:module';
import { access, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [
    process.env.PLAYWRIGHT_MODULE_PATH,
    'playwright',
    join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { return require(candidate); } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error('未找到 Playwright。请在工作区根目录运行 pnpm install，再运行 pnpm --dir apps/resume exec playwright install chromium。');
}

export async function exportPdf({ input, output }) {
  await access(input);
  const { chromium } = await loadPlaywright();
  let browser;
  const launches = process.env.CHROME_PATH
    ? [{ executablePath: process.env.CHROME_PATH }]
    : [{}, { channel: 'chrome' }];
  const launchErrors = [];
  for (const options of launches) {
    try { browser = await chromium.launch({ headless: true, ...options }); break; }
    catch (error) { launchErrors.push(error.message.split('\n')[0]); }
  }
  if (!browser) throw new Error(`无法启动浏览器。请运行 pnpm --dir apps/resume exec playwright install chromium，或设置 CHROME_PATH。\n${launchErrors.join('\n')}`);
  const temporary = `${output}.${process.pid}.tmp`;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN' });
    await page.goto(pathToFileURL(input).href, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll('details').forEach(item => { item.open = true; });
      document.querySelectorAll('.project').forEach(item => { item.hidden = false; });
    });
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await mkdir(dirname(output), { recursive: true });
    await page.pdf({
      path: temporary,
      format: 'A4',
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-family:sans-serif;font-size:8px;color:#596b68;width:100%;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      tagged: true,
      outline: true,
    });
    const pdf = await readFile(temporary);
    if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('导出结果不是有效的 PDF。');
    await rename(temporary, output);
    console.log(`已导出：${output}`);
  } finally {
    await browser.close();
    await rm(temporary, { force: true });
  }
}
