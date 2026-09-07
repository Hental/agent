import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(projectRoot, 'outputs/chengdu_internet_jobs_20260810');
const artifact = JSON.parse(fs.readFileSync(path.join(outDir, 'artifact.json'), 'utf8'));
const datasets = artifact.snapshot.datasets;
const embedded = JSON.stringify(datasets).replaceAll('<', '\\u003c');
const outputPath = path.resolve(process.env.CHENGDU_REPORT_HTML_OUT || path.join(projectRoot, 'report/chengdu-internet-jobs-report.html'));

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="description" content="成都兴隆湖—高新区 Web、前端、全栈与 Agent 工程师岗位分析报告">
  <title>成都兴隆湖—高新区互联网岗位分析｜2026-08-10</title>
  <style>
    :root{--ink:#16211d;--muted:#627069;--paper:#f4f1e8;--panel:#fffdf8;--line:#ded9cc;--green:#0c6b58;--green2:#0f8a70;--orange:#dd6b3c;--yellow:#f1c75b;--blue:#4977a8;--shadow:0 18px 48px rgba(22,33,29,.09)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;line-height:1.6;-webkit-text-size-adjust:100%;overflow-wrap:anywhere}
    a{color:var(--green);text-underline-offset:3px}.wrap{width:min(1180px,calc(100% - 36px));margin:auto}.hero{padding:66px 0 44px;background:radial-gradient(circle at 86% 18%,rgba(241,199,91,.34),transparent 24%),linear-gradient(135deg,#0c3f37,#0d6f5d 68%,#13806a);color:#fff;overflow:hidden}.eyebrow{font-size:12px;letter-spacing:.15em;text-transform:uppercase;opacity:.76}.hero h1{max-width:860px;margin:12px 0 16px;font-family:Georgia,"Songti SC",serif;font-size:clamp(38px,6vw,72px);line-height:1.08;font-weight:650}.hero p{max-width:760px;margin:0;font-size:17px;color:rgba(255,255,255,.8)}.hero-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}.pill{display:inline-flex;align-items:center;padding:7px 12px;border:1px solid rgba(255,255,255,.28);border-radius:99px;background:rgba(255,255,255,.08);font-size:13px}.nav{position:sticky;top:0;z-index:10;background:rgba(244,241,232,.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.nav .wrap{display:flex;gap:20px;overflow:auto;padding-top:11px;padding-bottom:11px}.nav a{white-space:nowrap;text-decoration:none;font-size:13px;color:#42504a}.nav a:hover{color:var(--green)}main{padding:32px 0 70px}.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:-54px;position:relative;z-index:2}.kpi{background:var(--panel);border:1px solid rgba(255,255,255,.9);border-radius:18px;padding:20px;box-shadow:var(--shadow)}.kpi .label{font-size:12px;color:var(--muted)}.kpi .value{font:700 34px/1.2 Georgia,serif;margin:7px 0 1px}.kpi .note{font-size:11px;color:#7a857f}.section{scroll-margin-top:60px;margin-top:48px}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:18px}.section h2{margin:0;font:650 clamp(28px,4vw,42px)/1.15 Georgia,"Songti SC",serif}.section-lead{max-width:650px;margin:8px 0 0;color:var(--muted)}.panel{background:var(--panel);border:1px solid var(--line);border-radius:20px;box-shadow:0 8px 30px rgba(22,33,29,.045)}.insight{display:grid;grid-template-columns:1.1fr .9fr;overflow:hidden}.insight-main{padding:30px}.insight-main h3{font:650 26px/1.25 Georgia,serif;margin:0 0 12px}.insight-main p{color:var(--muted);margin:0}.insight-side{padding:28px;background:#e7efe7;border-left:1px solid #cbdacd}.insight-side strong{display:block;margin-bottom:10px}.insight-side ol{margin:0;padding-left:20px}.chart-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.chart-card{padding:20px;min-height:330px}.chart-card h3{margin:0;font-size:16px}.chart-card p{margin:4px 0 12px;color:var(--muted);font-size:12px}.chart-card canvas{width:100%;height:245px;display:block}.chart-card.wide{grid-column:1/-1}.chart-card.wide canvas{height:280px}.split{display:grid;grid-template-columns:1fr 1fr;gap:16px}.copy-card{padding:24px}.copy-card h3{margin:0 0 10px;font-size:18px}.copy-card p,.copy-card li{color:var(--muted)}.callout{border-left:4px solid var(--orange);padding:12px 14px;background:#fff2eb;border-radius:0 10px 10px 0;color:#7d3c25;font-size:13px}.table-shell{overflow:hidden}.table-toolbar{display:flex;flex-wrap:wrap;gap:10px;padding:16px;border-bottom:1px solid var(--line);background:#faf8f2}.table-toolbar input,.table-toolbar select{min-height:40px;border:1px solid #cbc7bc;border-radius:10px;background:#fff;padding:0 12px;color:var(--ink)}.table-toolbar input{min-width:260px;flex:1}.button{border:0;border-radius:10px;background:var(--green);color:white;padding:0 15px;min-height:40px;cursor:pointer}.button:hover{background:var(--green2)}.table-scroll{overflow:auto;max-height:670px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;border-bottom:1px solid #ebe7dc;padding:12px 13px;vertical-align:top}th{position:sticky;top:0;background:#f6f3eb;color:#4e5b55;font-size:11px;letter-spacing:.03em;z-index:1}tbody tr:hover{background:#f8f6ef}.job-title{font-weight:650;min-width:220px}.company{white-space:nowrap}.salary{white-space:nowrap;font-weight:650}.tag{display:inline-block;border-radius:99px;padding:3px 8px;font-size:11px;background:#e8eee9;color:#42564d;white-space:nowrap}.tag.good{background:#d9eee6;color:#075a49}.tag.warn{background:#fff0d2;color:#865714}.tag.bad{background:#f4e5e1;color:#8a4535}.skills{min-width:260px;color:var(--muted)}.source-link{white-space:nowrap}.empty{padding:40px;text-align:center;color:var(--muted)}.timeline{display:grid;gap:12px}.event{display:grid;grid-template-columns:110px 1fr;gap:18px;padding:18px 20px}.event time{font:650 15px Georgia,serif;color:var(--green)}.event p{margin:2px 0;color:var(--muted)}.remote-note{font-size:13px;color:var(--muted)}.method{columns:2;column-gap:36px;padding:28px}.method p{break-inside:avoid;margin-top:0;color:var(--muted)}footer{border-top:1px solid var(--line);padding:26px 0 44px;color:var(--muted);font-size:12px}.mobile-card{display:none}.noscript{padding:12px;background:#fff0d2;color:#6f4d10;text-align:center}
    @media(max-width:900px){.kpis{grid-template-columns:repeat(2,1fr)}.chart-grid,.split,.insight{grid-template-columns:1fr}.insight-side{border-left:0;border-top:1px solid #cbdacd}.chart-card.wide{grid-column:auto}.method{columns:1}}
    @media(max-width:620px){.wrap{width:min(100% - 22px,1180px)}.hero{padding:42px 0 36px;padding-top:max(42px,env(safe-area-inset-top))}.hero h1{font-size:clamp(34px,11vw,48px)}.hero p{font-size:15px}.hero-meta{gap:7px;margin-top:20px}.pill{font-size:11px;padding:6px 9px}.nav{top:0}.nav .wrap{gap:16px;padding-left:max(0px,env(safe-area-inset-left));padding-right:max(0px,env(safe-area-inset-right));scrollbar-width:none}.nav .wrap::-webkit-scrollbar{display:none}.nav a{min-height:44px;display:inline-flex;align-items:center}.kpis{grid-template-columns:1fr 1fr;margin-top:-24px}.kpi{padding:15px}.kpi:last-child{grid-column:1/-1}.kpi .value{font-size:28px}.section{margin-top:38px;scroll-margin-top:62px}.section h2{font-size:30px}.insight-main,.insight-side,.copy-card{padding:20px}.chart-card{min-height:300px;padding:18px}.chart-card canvas{height:225px}.chart-card.wide{overflow-x:auto}.chart-card.wide canvas{min-width:720px;height:245px}.table-scroll table{display:none}#matrixTable{display:table;min-width:790px}.mobile-card{display:grid;gap:10px;padding:12px}.job-card{padding:16px;border:1px solid var(--line);border-radius:14px;background:#fff}.job-card h4{margin:0 0 5px;font-size:15px}.job-card p{margin:5px 0;color:var(--muted);font-size:12px}.job-card .source-link{display:inline-flex;min-height:44px;align-items:center}.method{padding:20px}.event{grid-template-columns:1fr;gap:3px}.table-toolbar{position:sticky;top:45px;z-index:3;padding:12px}.table-toolbar input{min-width:100%}.table-toolbar select{width:calc(50% - 5px)}.table-toolbar input,.table-toolbar select,.button{min-height:44px}.table-toolbar .button{width:100%}footer{padding-bottom:max(44px,env(safe-area-inset-bottom))}}
    @media(max-width:380px){.kpis{grid-template-columns:1fr}.kpi:last-child{grid-column:auto}.section h2{font-size:27px}.table-toolbar select{width:100%}}
    @media print{.nav,.table-toolbar,.button{display:none!important}.hero{padding:30px 0;background:#0c6b58!important;-webkit-print-color-adjust:exact}.kpis{margin-top:20px}.panel{box-shadow:none;break-inside:avoid}.table-scroll{max-height:none;overflow:visible}.table-scroll table{display:table!important}.mobile-card{display:none!important}th{position:static}.section{break-before:auto}.chart-card canvas{max-height:210px}a{text-decoration:none;color:inherit}}
  </style>
</head>
<body>
  <noscript><div class="noscript">请启用 JavaScript 查看图表和岗位明细。</div></noscript>
  <header class="hero"><div class="wrap"><div class="eyebrow">Chengdu Internet Job Market · Verified Snapshot</div><h1>成都兴隆湖—高新区<br>互联网岗位分析</h1><p>面向 5 年以上 Web、前端、全栈与 Agent 工程师的求职决策报告。数量为公开可验证市场下限，不把搜索结果页总数当成有效岗位数。</p><div class="hero-meta"><span class="pill">数据快照：2026-08-10</span><span class="pill">核心区 + 高新南区扩展区</span><span class="pill">外包 / 驻场已排除</span><span class="pill">远程机会独立统计</span></div></div></header>
  <nav class="nav" aria-label="报告导航"><div class="wrap"><a href="#summary">摘要</a><a href="#market">市场结构</a><a href="#salary">薪资</a><a href="#requirements">职位要求</a><a href="#priority">优先投递</a><a href="#jobs">完整岗位</a><a href="#remote">远程</a><a href="#trend">趋势</a><a href="#method">口径</a></div></nav>
  <main class="wrap">
    <section id="summary" class="kpis" aria-label="核心指标"></section>
    <section class="section"><div class="panel insight"><div class="insight-main"><h3>机会存在，但“35K 可达”不等于“35K 保底”</h3><p>37 条本地主样本中只有 3 条月薪下限达到 35K；另有 18 条只是薪资上限达到 35K。最值得优先投入的是大厂 Agent / AI 应用后台、Agent 基础设施和高阶 Web 前端岗位。</p></div><aside class="insight-side"><strong>建议投递顺序</strong><ol><li>优先级 ≥80 的岗位</li><li>月薪下限 ≥35K 的强匹配岗位</li><li>可确认团队和合同主体的 Agent / AI 应用岗位</li><li>远程岗位先核实中国常驻资格与时区</li></ol></aside></div></section>

    <section id="market" class="section"><div class="section-head"><div><h2>岗位数量与市场结构</h2><p class="section-lead">本次核到 37 条有效本地职位、19 家去重企业。核心区严格口径为 0 条，代表“本次未核到”，不代表当地没有任何隐性招聘。</p></div></div><div class="chart-grid"><article class="panel chart-card"><h3>岗位类别</h3><p>按每条职位唯一主类别统计</p><canvas id="roleChart" role="img" aria-label="岗位类别数量柱状图"></canvas></article><article class="panel chart-card"><h3>企业规模</h3><p>按去重企业数统计，职位数量另见悬浮信息</p><canvas id="companyChart" role="img" aria-label="企业规模结构柱状图"></canvas></article></div></section>

    <section id="salary" class="section"><div class="section-head"><div><h2>薪资水平与 35K 判断</h2><p class="section-lead">36 条职位披露了可标准化月薪。整体月薪中点中位数 27.3K，P25–P75 为 22.3K–35.6K。</p></div></div><div class="chart-grid"><article class="panel chart-card"><h3>月薪中点分布</h3><p>每条职位取薪资上下限中点，单位 K RMB / 月</p><canvas id="salaryChart" role="img" aria-label="月薪中点分布柱状图"></canvas></article><article class="panel chart-card"><h3>35K 档位</h3><p>强匹配与仅上限可谈严格分开</p><canvas id="tierChart" role="img" aria-label="35K薪资档位柱状图"></canvas></article></div><div class="split" style="margin-top:16px"><article class="panel copy-card"><h3>分岗位薪资与供需</h3><div id="roleSummary"></div></article><article class="panel copy-card"><h3>供需判断限制</h3><p>投递人数或候选人竞争信号覆盖率为 <strong>0%</strong>，低于既定 30% 阈值，因此不生成数值供需指数。</p><div class="callout">当前供需方向只能作为低置信度判断。建议实际投递后记录 7 天回复率、约面率和薪资沟通结果，累计 20 次有效沟通后再校准。</div></article></div></section>

    <section id="requirements" class="section"><div class="section-head"><div><h2>职位要求</h2><p class="section-lead">React 与 TypeScript 仍是主轴；Agent 岗位则把 Python、RAG、工具调用和工程化能力叠加到传统 Web 技术栈之上。</p></div></div><div class="chart-grid"><article class="panel chart-card wide"><h3>技能标签频次</h3><p>出现次数，不等同于能力权重</p><canvas id="skillsChart" role="img" aria-label="职位技能标签频次柱状图"></canvas></article></div><div class="panel table-shell" style="margin-top:16px"><div class="table-scroll"><table id="matrixTable"><thead></thead><tbody></tbody></table></div></div></section>

    <section id="priority" class="section"><div class="section-head"><div><h2>优先投递清单</h2><p class="section-lead">评分权重：薪资 30%、技能匹配 25%、地点或远程 20%、公司质量 15%、真实性与可投性 10%。</p></div></div><div class="panel table-shell"><div class="table-scroll"><table id="priorityTable"><thead></thead><tbody></tbody></table></div><div id="priorityCards" class="mobile-card"></div></div></section>

    <section id="jobs" class="section"><div class="section-head"><div><h2>完整本地主样本</h2><p class="section-lead"><span id="resultCount">37</span> 条结果。可按岗位类别、35K 档位和关键词筛选，并导出当前结果。</p></div></div><div class="panel table-shell"><div class="table-toolbar"><input id="search" type="search" placeholder="搜索公司、岗位、地点或技能" aria-label="搜索岗位"><select id="roleFilter" aria-label="按岗位类别筛选"><option value="">全部岗位类别</option></select><select id="tierFilter" aria-label="按35K档位筛选"><option value="">全部35K档位</option></select><button id="exportCsv" class="button" type="button">导出筛选结果</button></div><div class="table-scroll"><table id="jobsTable"><thead></thead><tbody></tbody></table></div><div id="jobCards" class="mobile-card"></div></div></section>

    <section id="remote" class="section"><div class="section-head"><div><h2>Worldwide / 远程机会</h2><p class="section-lead">6 条有效远程样本独立展示，不计入成都本地岗位数量和薪资统计。</p></div></div><div class="panel table-shell"><div class="table-scroll"><table id="remoteTable"><thead></thead><tbody></tbody></table></div><div id="remoteCards" class="mobile-card"></div></div><p class="remote-note">其中 5 条 Bjak 职位明确接受中国境内远程；Atria 为 APAC 优先，中国常驻资格仍需确认。</p></section>

    <section id="trend" class="section"><div class="section-head"><div><h2>现状与趋势</h2><p class="section-lead">可靠时间点只有 6 个，低于趋势图阈值，因此使用证据时间线，不计算同比或环比增长。</p></div></div><div id="timeline" class="timeline"></div></section>

    <section id="method" class="section"><div class="section-head"><div><h2>口径、限制与复核</h2></div></div><div class="panel method"><p><strong>岗位数量：</strong>去重后仍有效、地点落入范围、非外包/驻场的公开职位数，是市场下限，不是全市场估算。</p><p><strong>地域：</strong>核心区为兴隆湖、成都科学城、鹿溪智谷；扩展区包含高新南区、天府软件园、天府一至五街、金融城和中和。</p><p><strong>薪资：</strong>强匹配为月薪下限 ≥35K；可谈档为下限不足 35K、但上限 ≥35K。小样本岗位类别不发布稳定统计结论。</p><p><strong>供需：</strong>公开竞争信号不足时只给定性方向。本次申请信号覆盖率为 0%，没有生成数值指数。</p><p><strong>趋势：</strong>职位更新时间只用于判断活跃度，不解释为新增岗位。少于 8 个可靠时间点时不用趋势线。</p><p><strong>数据质量：</strong>去重、薪资区间、年化换算、地域归类、35K 分档、远程隔离和外包/驻场排除均已通过自动检查。</p></div></section>
  </main>
  <footer><div class="wrap">报告数据快照：2026-08-10 · 公开来源包括招聘平台、公司招聘系统、搜索索引与社交平台公开内容。岗位可能随时关闭，请以申请页为准。</div></footer>
  <script>
    const D=${embedded};
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const money=r=>Number.isFinite(r.salary_min_k)&&Number.isFinite(r.salary_max_k)?r.salary_min_k+'–'+r.salary_max_k+'K':'未披露';
    const link=(url,label='查看来源')=>url?'<a class="source-link" href="'+esc(url)+'" target="_blank" rel="noopener">'+label+'</a>':'—';
    const badge=(text)=>{const c=text==='强匹配档'?'good':text==='可谈档'?'warn':text==='未达35K'?'bad':'';return '<span class="tag '+c+'">'+esc(text||'—')+'</span>'};
    const head=D.headline[0];
    const kpis=[['有效岗位',head.active_listings,'公开市场下限'],['去重企业',head.unique_employers,'主样本雇主'],['35K 强匹配',head.strong35,'月薪下限达标'],['35K 可谈',head.negotiable35,'仅上限达标'],['远程样本',head.remote_active_sample,'不计入成都总量']];
    document.querySelector('#summary').innerHTML=kpis.map(x=>'<article class="kpi"><div class="label">'+x[0]+'</div><div class="value">'+x[1]+'</div><div class="note">'+x[2]+'</div></article>').join('');

    function drawBars(id,rows,labelKey,valueKey,color='#0c6b58'){
      const canvas=document.getElementById(id),ctx=canvas.getContext('2d');
      const ratio=Math.max(1,window.devicePixelRatio||1),w=canvas.clientWidth,h=canvas.clientHeight;
      canvas.width=w*ratio;canvas.height=h*ratio;ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);
      const pad={l:38,r:12,t:12,b:58},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b,max=Math.max(...rows.map(r=>r[valueKey]),1);
      ctx.strokeStyle='#d9d5ca';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();
      ctx.font='11px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.fillStyle='#627069';ctx.textAlign='right';ctx.fillText(max,pad.l-7,pad.t+5);ctx.fillText('0',pad.l-7,h-pad.b+4);
      const gap=10,bw=Math.max(10,(cw-gap*(rows.length+1))/rows.length);
      rows.forEach((r,i)=>{const bh=ch*r[valueKey]/max,x=pad.l+gap+i*(bw+gap),y=h-pad.b-bh;ctx.fillStyle=Array.isArray(color)?color[i%color.length]:color;ctx.beginPath();ctx.roundRect(x,y,bw,bh,[7,7,0,0]);ctx.fill();ctx.fillStyle='#35423c';ctx.textAlign='center';ctx.font='600 11px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.fillText(r[valueKey],x+bw/2,y-6);ctx.save();ctx.translate(x+bw/2,h-pad.b+9);ctx.rotate(-.42);ctx.textAlign='right';ctx.font='10px -apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif';ctx.fillText(r[labelKey],0,0);ctx.restore();});
    }
    const palette=['#0c6b58','#dd6b3c','#4977a8','#e0aa2f','#6c8d7d','#9a6958'];
    function drawAll(){drawBars('roleChart',D.role_summary,'primary_role','count',palette);drawBars('companyChart',D.company_sizes,'company_size','employers',palette);drawBars('salaryChart',D.salary_distribution,'band','count','#4977a8');drawBars('tierChart',D.tier35,'tier','count',palette);drawBars('skillsChart',D.skills,'skill','count','#0c6b58')}
    let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(drawAll,120)});drawAll();

    document.getElementById('roleSummary').innerHTML=D.role_summary.map(r=>'<p><strong>'+esc(r.primary_role)+'</strong>：'+r.count+' 条；薪资样本 n='+r.n+(r.publishable?'，月薪中点中位数 '+r.midpoint_median+'K，P25–P75 '+r.midpoint_p25+'–'+r.midpoint_p75+'K':'，样本不足，不发布统计结论')+'；'+esc(r.competition)+'</p>').join('');
    const matrixCols=[['primary_role','岗位类别'],['role_total','岗位数'],['react','React'],['typescript','TypeScript'],['python','Python'],['agent','Agent'],['rag','RAG'],['nodejs','Node.js'],['engineering','工程化'],['performance','性能优化'],['miniprogram','小程序'],['rn','RN']];
    fillTable('matrixTable',D.role_skill_matrix,matrixCols);

    const priorityCols=[['priority_score','优先级'],['company','公司'],['raw_title','岗位'],['location','地点'],['salary','月薪'],['tier_35k','35K档位'],['skills','技能'],['source_url','来源']];
    const jobCols=[['priority_score','分数'],['primary_role','类别'],['company','公司'],['raw_title','岗位'],['company_size','规模'],['location','地点'],['salary','月薪'],['tier_35k','35K档位'],['experience','经验'],['skills','技能'],['source_url','来源']];
    const remoteCols=[['priority_score','分数'],['company','公司'],['raw_title','岗位'],['location','地域'],['eligible_china','中国常驻'],['timezone','时区'],['employment_type','用工'],['skills','技能'],['source_url','来源']];
    function cell(r,key){if(key==='salary')return '<span class="salary">'+money(r)+'</span>';if(key==='tier_35k')return badge(r[key]);if(key==='source_url')return link(r[key]);if(key==='raw_title')return '<span class="job-title">'+esc(r[key])+'</span>';if(key==='skills')return '<span class="skills">'+esc(r[key])+'</span>';return esc(r[key]??'—')}
    function fillTable(id,rows,cols){const t=document.getElementById(id);t.querySelector('thead').innerHTML='<tr>'+cols.map(c=>'<th>'+c[1]+'</th>').join('')+'</tr>';t.querySelector('tbody').innerHTML=rows.map(r=>'<tr>'+cols.map(c=>'<td>'+cell(r,c[0])+'</td>').join('')+'</tr>').join('')}
    function fillCards(id,rows){document.getElementById(id).innerHTML=rows.length?rows.map(r=>'<article class="job-card"><h4>'+esc(r.raw_title)+'</h4><p><strong>'+esc(r.company)+'</strong> · '+esc(r.location)+'</p><p>'+money(r)+' · '+badge(r.tier_35k)+' · 优先级 '+esc(r.priority_score??'—')+'</p><p>'+esc(r.skills)+'</p>'+link(r.source_url)+'</article>').join(''):'<div class="empty">没有符合条件的岗位</div>'}
    fillTable('priorityTable',D.top_priority,priorityCols);fillCards('priorityCards',D.top_priority);
    fillTable('remoteTable',D.remote_jobs,remoteCols);fillCards('remoteCards',D.remote_jobs);

    const roleFilter=document.getElementById('roleFilter'),tierFilter=document.getElementById('tierFilter'),search=document.getElementById('search');
    [...new Set(D.main_jobs.map(r=>r.primary_role))].forEach(v=>roleFilter.insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'));
    [...new Set(D.main_jobs.map(r=>r.tier_35k))].forEach(v=>tierFilter.insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'));
    let filtered=[];
    function filterJobs(){const q=search.value.trim().toLowerCase();filtered=D.main_jobs.filter(r=>(!roleFilter.value||r.primary_role===roleFilter.value)&&(!tierFilter.value||r.tier_35k===tierFilter.value)&&(!q||[r.company,r.raw_title,r.location,r.skills].join(' ').toLowerCase().includes(q)));document.getElementById('resultCount').textContent=filtered.length;fillTable('jobsTable',filtered,jobCols);fillCards('jobCards',filtered)}
    [search,roleFilter,tierFilter].forEach(el=>el.addEventListener(el===search?'input':'change',filterJobs));filterJobs();
    document.getElementById('exportCsv').addEventListener('click',()=>{const keys=['company','raw_title','primary_role','location','salary_min_k','salary_max_k','pay_months','tier_35k','experience','degree','skills','priority_score','source_url'];const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';const csv='\\ufeff'+[keys.join(','),...filtered.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='chengdu_jobs_filtered.csv';a.click();URL.revokeObjectURL(a.href)});

    document.getElementById('timeline').innerHTML=D.trend_evidence.map(e=>'<article class="panel event"><time>'+esc(e.date)+'</time><div><strong>'+esc(e.type)+'</strong><p>'+esc(e.event)+'</p>'+link(e.url,'来源 ↗')+'</div></article>').join('');
  </script>
</body>
</html>`;

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart);
if (scriptStart < 0 || scriptEnd < 0) throw new Error('Inline report script is missing');
new Function(html.slice(scriptStart + '<script>'.length, scriptEnd));
for (const required of [
  '完整本地主样本', '优先投递清单', 'Worldwide / 远程机会', '口径、限制与复核', 'const D=',
  'viewport-fit=cover', 'safe-area-inset-bottom', '#matrixTable{display:table', 'min-height:44px'
]) {
  if (!html.includes(required)) throw new Error(`Required report section is missing: ${required}`);
}
if (html.includes('<script src=') || html.includes('rel="stylesheet"')) {
  throw new Error('Standalone report unexpectedly contains an external dependency');
}

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, html);
console.log(JSON.stringify({output: outputPath, status: 'pass', standalone: true, bytes: Buffer.byteLength(html), jobs: datasets.main_jobs.length, remote: datasets.remote_jobs.length, charts: 5}, null, 2));
