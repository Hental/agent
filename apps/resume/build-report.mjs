import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const reportDir = dirname(fileURLToPath(import.meta.url));
export const defaultPaths = {
  data: join(reportDir, 'data/report.json'),
  markdown: join(reportDir, 'data/report.md'),
  template: join(reportDir, 'template.html'),
  html: join(reportDir, 'career-report.html'),
  pdf: join(reportDir, 'output/pdf/career-report.pdf'),
};
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHtml;
function assert(condition, message) { if (!condition) throw new Error(message); }

async function markdownEngine() {
  const require = createRequire(import.meta.url);
  const candidates = ['marked', join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/marked/lib/marked.esm.js')];
  let module;
  for (const candidate of candidates) {
    try { module = await import(pathToFileURL(require.resolve(candidate)).href); break; }
    catch (error) { if (!['MODULE_NOT_FOUND','ERR_MODULE_NOT_FOUND'].includes(error.code)) throw error; }
  }
  assert(module, '未找到 marked，请在工作区根目录运行 pnpm install。');
  return new module.Marked({ async: false, renderer: {
    html({ text }) { return e(text); },
    link({ href, title, tokens }) {
      assert(/^(?:#[\w.-]+|https?:\/\/|mailto:)/i.test(href), `Markdown 链接不支持此地址：${href}`);
      return `<a href="${e(href)}"${title ? ` title="${e(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>`;
    },
    image() { throw new Error('正文请使用文字、列表与链接；当前模板不支持 Markdown 图片。'); },
  }});
}

export async function renderReport(options = {}) {
  const paths = { ...defaultPaths, ...options };
  const [json, markdown, template, engine] = await Promise.all([
    readFile(paths.data, 'utf8'), readFile(paths.markdown, 'utf8'), readFile(paths.template, 'utf8'), markdownEngine(),
  ]);
  const d = JSON.parse(json);
  assert(d.version === 1, 'report.json 的 version 必须为 1。');
  for (const key of ['meta','hero','timeline','evidence','framework','sections']) assert(d[key] && typeof d[key] === 'object', `缺少 JSON 对象：${key}`);
  for (const key of ['navigation','projects','gaps','sources','downloads']) assert(Array.isArray(d[key]), `缺少 JSON 数组：${key}`);
  const blocks = new Map();
  const pattern = /^## .*?\{#([\w.-]+)\}\s*$/gm;
  const headings = [...markdown.matchAll(pattern)];
  headings.forEach((match, i) => {
    assert(!blocks.has(match[1]), `重复的 Markdown ID：${match[1]}`);
    blocks.set(match[1], markdown.slice(match.index + match[0].length, headings[i + 1]?.index ?? markdown.length).trim());
  });
  function md(id, inline = false) {
    assert(blocks.has(id), `Markdown 缺少正文块：${id}`);
    return inline ? engine.parseInline(blocks.get(id)) : engine.parse(blocks.get(id));
  }
  const ids = new Set();
  for (const item of [...d.navigation, ...d.sources, ...d.projects.map(p => ({id: `project-${p.id}`}))]) {
    assert(/^[a-z][\w-]*$/.test(item.id), `无效 ID：${item.id}`);
    assert(!ids.has(item.id), `重复 ID：${item.id}`); ids.add(item.id);
  }
  const sourceIds = new Set(d.sources.map(s => s.id));
  const link = reference => {
    assert(sourceIds.has(reference.source), `不存在的来源：${reference.source}`);
    return `<a href="#${e(reference.source)}">${e(reference.label)}</a>`;
  };
  const head = id => {
    const section = d.sections[id]; assert(section, `缺少章节：${id}`);
    return `<div class="section-head"><div><span class="section-num">${e(section.label)}</span><h2>${e(section.title)}</h2></div>${section.description ? `<p>${e(section.description)}</p>` : ''}</div>`;
  };
  const metrics = items => `<div class="mini-metrics">${items.map(m => `<div><small>${e(m.label)}</small><strong>${e(m.value)}</strong>${m.note ? `<small>${e(m.note)}</small>` : ''}</div>`).join('')}</div>`;
  const chart = c => {
    assert(Number.isFinite(c.max) && c.max > 0, '图表 max 必须为正数。');
    return `<figure class="measure"><figcaption>${e(c.title)}</figcaption>${c.rows.map((r, i) => {
      assert(Number.isFinite(r.value) && r.value >= 0 && r.value <= c.max, `图表数据超出范围：${r.value}`);
      return `<div class="bar-row"><span>${e(r.label)}</span><div class="bar-track"><div class="bar${i ? ' after' : ''}" style="width:${100 * r.value / c.max}%"></div></div><strong>${e(r.value)}${e(c.unit)}</strong></div>`;
    }).join('')}<div class="bar-axis" aria-hidden="true"><span>0</span><span>${e(c.max / 2)}</span><span>${e(c.max)} ${e(c.unit)}</span></div></figure>`;
  };
  const projects = d.projects.map(p => `<article class="project" id="project-${e(p.id)}" aria-labelledby="tab-${e(p.id)}">
    <div class="project-header"><div><span class="eyebrow muted">${e(p.date)}</span><h3>${e(p.title)}</h3></div><span class="badge">${e(p.badge)}</span></div>
    <div class="project-brief"><div><h4>业务问题</h4><p>${md(p.problem, true)}</p></div><div><h4>个人职责</h4><p>${md(p.responsibility, true)}</p></div></div>
    <div class="flow" aria-label="${e(p.title)}技术链路">${p.flow.map(f => `<div>${e(f.title)}<span>${e(f.note)}</span></div>`).join('<b aria-hidden="true">→</b>')}</div>
    ${p.body && blocks.get(p.body)?.startsWith('- ') ? md(p.body) : ''}
    ${p.chart ? chart(p.chart) : ''}${metrics(p.metrics)}
    ${p.body && !blocks.get(p.body)?.startsWith('- ') ? md(p.body) : ''}
    <p class="scope">${md(p.scope, true)}</p><div class="source-line">来源：${p.references.map(link).join('')}</div>
  </article>`).join('\n');
  const downloadLinks = [...d.downloads, {label:'正文 Markdown',path:'data/report.md'},{label:'结构化 JSON',path:'data/report.json'}];
  const body = `<a class="skip" href="#overview">跳到报告正文</a>
  <div class="layout"><aside class="rail" aria-label="报告导航"><div class="brand"><span class="brand-mark" aria-hidden="true">LT</span>技术工作档案</div><div class="edition">${e(d.meta.name)} / ${e(d.meta.edition)}</div>
  <nav>${d.navigation.map((n,i) => `<a href="#${e(n.id)}"${i === 0 ? ' aria-current="location"' : ''}><span>${String(i+1).padStart(2,'0')}</span>${e(n.label)}</a>`).join('')}</nav>
  <div class="rail-foot"><strong class="mono">${d.sources.length}</strong><p>份飞书材料<br>检索于 ${e(d.meta.researchDate)}</p><button type="button" class="print" data-print-report>导出 PDF</button></div></aside>
  <main id="report-main"><div class="topline"><span class="eyebrow">Career review</span><span>报告版本 ${e(d.meta.reportDate)} · 基于已有检索材料</span></div>
  <header id="overview" class="hero"><p class="eyebrow">${e(d.meta.period)}</p><h1>${e(d.meta.name)}<span>${e(d.meta.title)}</span></h1><p class="intro">${md(d.hero.intro,true)}</p>
  <div class="tags" aria-label="建议简历方向">${d.hero.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div>
  <div class="hero-facts">${d.hero.facts.map(f=>`<article><div class="fact-value">${e(f.value)} <small>${e(f.unit)}</small></div><div class="fact-label">${e(f.label)}</div><div class="fact-note">${e(f.note)} ${link(f.reference)}</div></article>`).join('')}</div>
  <p class="hero-caption">${md(d.hero.caption,true)}</p><div class="export-actions"><button type="button" class="print" data-print-report>导出 PDF</button><a href="output/pdf/career-report.pdf" download>下载 PDF</a></div></header>
  <section id="timeline" class="section">${head('timeline')}<div class="timeline">${d.timeline.items.map(t=>`<article class="phase"><div class="date mono">${e(t.date)}</div><h3>${e(t.title)}</h3><strong>${e(t.subtitle)}</strong><p>${md(t.body,true)}</p>${link(t.reference)}</article>`).join('')}</div><p class="tiny">${md(d.timeline.note,true)}</p><div class="callout"><p>${md(d.timeline.positioning,true)}</p></div></section>
  <section id="projects" class="section">${head('projects')}<div class="tabs" role="tablist" aria-label="选择代表项目">${d.projects.map((p,i)=>`<button type="button" role="tab" id="tab-${e(p.id)}" aria-controls="project-${e(p.id)}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${e(p.tab)}</button>`).join('')}</div>${projects}</section>
  <section id="evidence" class="section">${head('evidence')}<div class="table-wrap"><table><caption>${e(d.evidence.caption)}</caption><thead><tr>${d.evidence.headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${d.evidence.rows.map(r=>`<tr><td>${e(r.label)}</td><td class="metric">${e(r.value)}</td><td>${e(r.scope)}</td><td>${link(r.reference)}</td></tr>`).join('')}</tbody></table></div>${d.evidence.notes.map(n=>`<details><summary>${e(n.title)}</summary>${md(n.body)}</details>`).join('')}</section>
  <section id="framework" class="section">${head('framework')}<div class="framework">${d.framework.modules.map((m,i)=>`<article><span class="index mono">${String(i+1).padStart(2,'0')}</span><div><h3>${e(m.title)}</h3><p>${md(m.body,true)}</p></div></article>`).join('')}</div><div class="formula">${e(d.framework.formula)}</div><div class="pages">${d.framework.pages.map(p=>`<div class="page-outline"><h4>${e(p.title)}</h4><ol>${p.items.map(i=>`<li>${e(i)}</li>`).join('')}</ol></div>`).join('')}</div><p class="tiny">${md(d.framework.note,true)}</p></section>
  <section id="gaps" class="section">${head('gaps')}<div class="missing">${d.gaps.map(g=>`<article><h3>${e(g.title)}</h3><p>${md(g.body,true)}</p></article>`).join('')}</div></section>
  <section id="sources" class="section">${head('sources')}<ol class="sources">${d.sources.map(s=>{
    assert(/^https?:\/\//i.test(s.url), `来源 URL 无效：${s.id}`);
    return `<li id="${e(s.id)}"><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.title)}</a><small>${e(s.note)}</small></li>`;
  }).join('')}</ol><p class="tiny">${md(d.researchNote,true)}</p></section>
  <footer class="foot"><span>${e(d.meta.name)} · 职业材料整理<br>${e(d.meta.reportDate)}</span><div class="downloads">${downloadLinks.map(a=>{
    assert(!/^(?:[a-z]+:|\/|.*\.\.)/i.test(a.path), `下载路径必须位于报告目录：${a.path}`);
    return `<a href="${e(a.path)}" download>${e(a.label)}</a>`;
  }).join('')}</div></footer></main></div>`;
  for (const match of body.matchAll(/href="#([\w.-]+)"/g)) assert(ids.has(match[1]), `链接引用了不存在的 ID：${match[1]}`);
  for (const name of ['BODY','TITLE','DESCRIPTION']) assert(template.includes(`{{${name}}}`), `模板缺少 {{${name}}}`);
  return template.replace('{{BODY}}',()=>body).replace('{{TITLE}}',()=>e(`${d.meta.name} · ${d.meta.title}`)).replace('{{DESCRIPTION}}',()=>e(`${d.meta.name}的技术工作回顾、简历框架与成果证据`));
}

export async function buildReport(options = {}) {
  const html = await renderReport(options);
  const output = resolve(options.html ?? defaultPaths.html);
  for (const source of [options.data ?? defaultPaths.data, options.markdown ?? defaultPaths.markdown, options.template ?? defaultPaths.template]) {
    assert(output !== resolve(source), 'HTML 输出不能覆盖原始数据或模板。');
  }
  await writeFile(output, html);
  return output;
}
