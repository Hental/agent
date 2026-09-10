import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const reportDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const defaultPaths = {
  data: join(reportDir, 'data/report.json'),
  markdown: join(reportDir, 'data/report.md'),
  template: join(reportDir, 'template/template.html'),
  html: join(reportDir, 'output/career-report.html'),
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
  const artifactLink = target => relative(dirname(paths.html), target).split('\\').join('/');
  const d = JSON.parse(json);
  assert(d.version === 1, 'report.json 的 version 必须为 1。');
  for (const key of ['meta','hero','education','sections']) assert(d[key] && typeof d[key] === 'object', `缺少 JSON 对象：${key}`);
  for (const key of ['navigation','projects','sources','downloads']) assert(Array.isArray(d[key]), `缺少 JSON 数组：${key}`);
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
    <div class="project-header"><div><span class="eyebrow muted">${e(p.date)}</span><h3>${e(p.title)}</h3></div></div>
    <div class="project-detail">
    <h4>项目结果与收益</h4>
    ${md(p.results)}
    ${p.chart ? chart(p.chart) : ''}${metrics(p.metrics)}
    <div class="project-brief"><div><h4>项目简介</h4><p><strong>时间：${e(p.date)}</strong></p><p>${md(p.problem, true)}</p></div><div><h4>个人职责</h4><p>${md(p.responsibility, true)}</p></div></div>
    <h4>技术介绍</h4>
    <div class="flow" aria-label="${e(p.title)}技术链路">${p.flow.map(f => `<div>${e(f.title)}<span>${e(f.note)}</span></div>`).join('<b aria-hidden="true">→</b>')}</div>
    ${md(p.body)}
    <p class="scope">${md(p.scope, true)}</p><div class="source-line">来源：${p.references.map(link).join('')}</div>
    </div><div class="project-print">${[['results','结果'],['problem','背景'],['responsibility','职责'],['body','技术']].map(([key,label])=>`<p><strong>${label}：</strong>${md(p.print[key],true)}</p>`).join('')}</div>
  </article>`).join('\n');
  const downloadLinks = [...d.downloads, {label:'正文 Markdown',path:'data/report.md'},{label:'结构化 JSON',path:'data/report.json'}];
  const body = `<a class="skip" href="#overview">跳到报告正文</a>
  <div class="layout"><aside class="rail" aria-label="报告导航"><div class="brand"><span class="brand-mark" aria-hidden="true">LT</span>技术工作档案</div><div class="edition">${e(d.meta.name)} / ${e(d.meta.edition)}</div>
  <nav>${d.navigation.map((n,i) => `<a href="#${e(n.id)}"${i === 0 ? ' aria-current="location"' : ''}><span>${String(i+1).padStart(2,'0')}</span>${e(n.label)}</a>`).join('')}</nav>
  <div class="rail-foot"><strong class="mono">${d.sources.length}</strong><p>份飞书材料<br>检索于 ${e(d.meta.researchDate)}</p><button type="button" class="print" data-print-report>导出 PDF</button></div></aside>
  <main id="report-main">
  <header id="overview" class="hero"><h1>${e(d.meta.name)}</h1>
  ${d.meta.personalInfo ? `<p class="personal-info">${e(d.meta.name)} · <a href="tel:${e(d.meta.personalInfo.phone)}">${e(String(d.meta.personalInfo.phone).replace(/^(\d{3})(\d{4})(\d{4})$/, '$1 $2 $3'))}</a> · <a href="mailto:${e(d.meta.personalInfo.email)}">${e(d.meta.personalInfo.email)}</a> · ${e(d.meta.personalInfo.targetRole)}${d.meta.personalInfo.city ? `（${e(d.meta.personalInfo.city)}）` : ''}</p>` : ''}
  <div class="tags" aria-label="建议简历方向">${d.hero.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div>
  <div class="export-actions"><button type="button" class="print" data-print-report>导出 PDF</button><a href="${e(artifactLink(defaultPaths.pdf))}" download>下载 PDF</a></div></header>
  <section id="projects" class="section">${head('projects')}<div class="tabs" role="tablist" aria-label="选择项目经历">${d.projects.map((p,i)=>`<button type="button" role="tab" id="tab-${e(p.id)}" aria-controls="project-${e(p.id)}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${e(p.tab)}</button>`).join('')}</div>${projects}</section>
  <section id="education" class="section">${head('education')}<article class="phase"><div class="date mono">${e(d.education.period)}</div><h3>${e(d.education.school)}</h3><p>${md(d.education.body,true)}</p></article></section>
  <section id="sources" class="section">${head('sources')}<ol class="sources">${d.sources.map(s=>{
    assert(/^https?:\/\//i.test(s.url), `来源 URL 无效：${s.id}`);
    return `<li id="${e(s.id)}"><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.title)}</a><small>${e(s.note)}</small></li>`;
  }).join('')}</ol><p class="tiny">${md(d.researchNote,true)}</p></section>
  <footer class="foot"><span>${e(d.meta.name)} · 职业材料整理<br>${e(d.meta.reportDate)}</span><div class="downloads">${downloadLinks.map(a=>{
    assert(!/^(?:[a-z]+:|\/|.*\.\.)/i.test(a.path), `下载路径必须位于报告目录：${a.path}`);
    return `<a href="${e(artifactLink(join(reportDir,a.path)))}" download>${e(a.label)}</a>`;
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
  await mkdir(dirname(output), {recursive:true});
  await writeFile(output, html);
  return output;
}
