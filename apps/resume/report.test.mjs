import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderReport, buildReport, defaultPaths } from './build-report.mjs';
import { startPreview } from './report.mjs';

test('正文和结构化数据的修改共同进入生成结果，重复构建读取最新数据', async () => {
  const dir = await mkdtemp(join(tmpdir(),'career-data-'));
  try {
    const d = JSON.parse(await readFile(defaultPaths.data,'utf8'));
    const original = await readFile(defaultPaths.markdown,'utf8');
    d.meta.name = 'JSON_SOURCE_CHECK';
    const paths = {data:join(dir,'report.json'),markdown:join(dir,'report.md'),html:join(dir,'report.html')};
    await writeFile(paths.data,JSON.stringify(d));
    await writeFile(paths.markdown,original.replace('从商业化页面搭建','MD_SOURCE_CHECK 从商业化页面搭建'));
    await buildReport(paths);
    let html = await readFile(paths.html,'utf8');
    assert.match(html,/JSON_SOURCE_CHECK/); assert.match(html,/MD_SOURCE_CHECK/);
    await writeFile(paths.markdown,original.replace('从商业化页面搭建','UPDATED_SOURCE_CHECK 从商业化页面搭建'));
    await buildReport(paths);
    html = await readFile(paths.html,'utf8');
    assert.match(html,/UPDATED_SOURCE_CHECK/); assert.doesNotMatch(html,/MD_SOURCE_CHECK/);
    assert.equal((html.match(/class="project"/g)||[]).length,4);
    assert.equal((html.match(/id="s\d+"/g)||[]).length,12);

    d.hero.intro = 'missing.block'; await writeFile(paths.data,JSON.stringify(d));
    await assert.rejects(()=>renderReport(paths),/Markdown 缺少正文块/);
    d.hero.intro = 'overview.intro'; d.hero.facts[0].reference.source = 'unknown-source';
    await writeFile(paths.data,JSON.stringify(d));
    await assert.rejects(()=>renderReport(paths),/不存在的来源/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('Markdown 原始 HTML 被转义，非法链接不进入页面', async () => {
  const dir = await mkdtemp(join(tmpdir(),'career-md-'));
  try {
    const original = await readFile(defaultPaths.markdown,'utf8');
    const markdown = join(dir,'report.md');
    await writeFile(markdown,original.replace('从商业化页面搭建','<script>alert(1)</script> 从商业化页面搭建'));
    const html = await renderReport({markdown});
    assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html,/<script>alert\(1\)<\/script>/);
    await writeFile(markdown,original.replace('从商业化页面搭建','[link](javascript:alert) 从商业化页面搭建'));
    await assert.rejects(()=>renderReport({markdown}),/Markdown 链接不支持/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('预览实时读取 MD + JSON，错误可恢复且不暴露任意本地文件', async () => {
  const dir = await mkdtemp(join(tmpdir(),'career-preview-'));
  let server;
  try {
    const data = join(dir,'report.json'); const markdown = join(dir,'report.md');
    const d = JSON.parse(await readFile(defaultPaths.data,'utf8'));
    const original = await readFile(defaultPaths.markdown,'utf8');
    await writeFile(data,JSON.stringify(d)); await writeFile(markdown,original);
    server = await startPreview({data,markdown,port:0,open:false});
    const base = `http://127.0.0.1:${server.address().port}`;
    const version = await (await fetch(base+'/__version')).text();
    d.meta.name = 'PREVIEW_JSON_UPDATED'; await writeFile(data,JSON.stringify(d));
    await writeFile(markdown,original.replace('从商业化页面搭建','PREVIEW_MD_UPDATED 从商业化页面搭建'));
    const html = await (await fetch(base)).text();
    assert.match(html,/PREVIEW_JSON_UPDATED/); assert.match(html,/PREVIEW_MD_UPDATED/);
    assert.notEqual(await (await fetch(base+'/__version')).text(),version);
    assert.equal((await fetch(base+'/report.mjs')).status,404);
    await writeFile(data,'{'); assert.equal((await fetch(base)).status,500);
    await writeFile(data,JSON.stringify(d)); assert.equal((await fetch(base)).status,200);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(done=>server.close(done)); }
    await rm(dir,{recursive:true,force:true});
  }
});
