import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(projectRoot, 'outputs/chengdu_internet_jobs_20260810');
const data = JSON.parse(fs.readFileSync(path.join(out,'report_data.json'),'utf8'));
const mainJobs = data.jobs.filter(o=>o.scope==='local'&&o.active_status==='active'&&o.geo_tier==='扩展区'&&!o.exclusion_reason);
const tier35 = data.tier35_counts.map(o=>({...o,share:+(o.count/data.headline.active_listings*100).toFixed(1),denominator:data.headline.active_listings}));
const companySizes = data.company_size_employers.map(o=>{
  const listing = data.company_size_counts.find(x=>x.company_size===o.company_size)?.count ?? 0;
  return {...o,listings:listing,total_employers:data.headline.unique_employers,total_listings:data.headline.active_listings};
});
const skills = data.top_skills.slice(0,10).map((o,i)=>({...o,rank:i+1,total_listings:data.headline.active_listings}));
const salaryBinDefs = [
  {label:'<20K',min:-Infinity,max:20},
  {label:'20–25K',min:20,max:25},
  {label:'25–30K',min:25,max:30},
  {label:'30–35K',min:30,max:35},
  {label:'35–40K',min:35,max:40},
  {label:'≥40K',min:40,max:Infinity}
];
const salaryMidpoints = mainJobs
  .filter(o=>Number.isFinite(o.salary_min_k)&&Number.isFinite(o.salary_max_k))
  .map(o=>(o.salary_min_k+o.salary_max_k)/2);
const salaryDistribution = salaryBinDefs.map((bin,index)=>({
  band:bin.label,
  count:salaryMidpoints.filter(v=>v>=bin.min&&v<bin.max).length,
  rank:index+1,
  denominator:salaryMidpoints.length
}));
const matrixSkills = [
  ['react','React'],['typescript','TypeScript'],['python','Python'],['agent','Agent'],
  ['rag','RAG'],['nodejs','Node.js'],['engineering','工程化'],['performance','性能优化'],
  ['miniprogram','小程序'],['rn','RN']
];
const roleSkillMatrix = data.role_summary.map(role=>{
  const jobs=mainJobs.filter(job=>job.primary_role===role.primary_role);
  const row={primary_role:role.primary_role,role_total:jobs.length};
  for(const [field,label] of matrixSkills){
    row[field]=jobs.filter(job=>(job.skills||'').split('|').includes(label)).length;
  }
  return row;
});
const headline = [{
  active_listings:data.headline.active_listings,
  unique_employers:data.headline.unique_employers,
  core_active_verified:data.headline.core_active_verified,
  strong35:tier35.find(o=>o.tier==='强匹配档')?.count??0,
  negotiable35:tier35.find(o=>o.tier==='可谈档')?.count??0,
  remote_active_sample:data.headline.remote_active_sample,
  salary_midpoint_median:data.salary_overall.midpoint_median,
  salary_midpoint_p25:data.salary_overall.midpoint_p25,
  salary_midpoint_p75:data.salary_overall.midpoint_p75,
  applicant_signal_coverage:0
}];

const csvPath=path.join(out,'chengdu_internet_jobs.csv');
const jsonPath=path.join(out,'report_data.json');
const sources=[
  {
    id:'local_csv',label:'成都互联网岗位明细（2026-08-10快照）',path:csvPath,
    query:{engine:'duckdb',language:'sql',sql:`SELECT * FROM read_csv_auto('${csvPath}', header=true) WHERE scope='local' AND active_status='active' AND geo_tier='扩展区' AND coalesce(exclusion_reason,'')=''`,description:'从完整CSV筛选本地主样本；聚合岗位、企业、薪资和技能。',tables_used:[csvPath],filters:['scope=local','active_status=active','geo_tier=扩展区','exclusion_reason为空','排除外包和驻场'],metric_definitions:{active_listings:'去重后的有效职位记录数；公开可验证市场下限。',unique_employers:'对公司名称标准化后的去重企业数。',strong35:'salary_min_k >= 35。',negotiable35:'salary_min_k < 35 且 salary_max_k >= 35。',salary_midpoint_median:'每条职位(月薪下限+上限)/2的中位数，单位K RMB/月。'}}
  },
  {
    id:'report_json',label:'分析结果、趋势证据与社交信号',path:jsonPath,
    query:{engine:'duckdb',language:'sql',sql:`SELECT * FROM read_json_auto('${jsonPath}')`,description:'读取已核岗位分析结果、独立来源URL的趋势证据与社交信号。',tables_used:[jsonPath],filters:['社交平台每个平台3组检索','趋势点少于8，不绘制增长趋势线'],metric_definitions:{applicant_signal_coverage:'可见投递人数或同等竞争指标覆盖率。'}}
  }
];

const manifest={
  version:1,surface:'report',title:'成都兴隆湖—高新区互联网岗位分析（2026-08-10）',generatedAt:'2026-08-10T00:00:00+08:00',
  description:'面向5年以上Web/前端/全栈/Agent工程师的求职决策报告；岗位数量是公开可验证市场下限。',
  sources,
  cards:[
    {id:'active_jobs',dataset:'headline',sourceId:'local_csv',description:'扩展区去重、可验证、未命中外包/驻场排除规则的当前职位。',metrics:[{label:'有效岗位',field:'active_listings',format:'number'},{label:'核心区已核',field:'core_active_verified',format:'number'}]},
    {id:'employers',dataset:'headline',sourceId:'local_csv',description:'按标准化公司名称去重。',metrics:[{label:'企业数',field:'unique_employers',format:'number'}]},
    {id:'strong35',dataset:'headline',sourceId:'local_csv',description:'月薪下限不低于35K，薪资目标确定性最高。',metrics:[{label:'35K强匹配',field:'strong35',format:'number'}]},
    {id:'negotiable35',dataset:'headline',sourceId:'local_csv',description:'仅薪资上限达到35K，不能视为保底35K。',metrics:[{label:'35K可谈',field:'negotiable35',format:'number'}]},
    {id:'remote_sample',dataset:'headline',sourceId:'local_csv',description:'独立机会样本，不进入成都岗位总量。',metrics:[{label:'有效远程',field:'remote_active_sample',format:'number'}]}
  ],
  charts:[
    {id:'role_chart',title:'有效岗位数量（按主岗位类别）',subtitle:'前端数量最多，但高度集中于少数大厂；Agent/AI应用合计13条。',type:'bar',dataset:'role_summary',sourceId:'local_csv',encodings:{x:{field:'primary_role',type:'nominal'},y:{field:'count',type:'quantitative'},tooltip:[{field:'unique_employers',type:'quantitative'},{field:'above35_count',type:'quantitative'},{field:'midpoint_median',type:'quantitative'}]}},
    {id:'salary_distribution_chart',title:'月薪中点分布（36条有薪资样本）',subtitle:'整体中位数27.3K；35K以上区间仍有机会，但不代表薪资下限达到35K。',type:'bar',dataset:'salary_distribution',sourceId:'local_csv',encodings:{x:{field:'band',type:'nominal'},y:{field:'count',type:'quantitative'},tooltip:[{field:'denominator',type:'quantitative'},{field:'rank',type:'quantitative'}]}},
    {id:'tier35_chart',title:'35K月薪档位分布',subtitle:'达到35K上限的职位很多，但只有3条月薪下限不低于35K。',type:'bar',dataset:'tier35',sourceId:'local_csv',encodings:{x:{field:'tier',type:'nominal'},y:{field:'count',type:'quantitative'},tooltip:[{field:'share',type:'quantitative'},{field:'denominator',type:'quantitative'}]}},
    {id:'company_size_chart',title:'企业规模结构（按去重企业数）',subtitle:'中小企业覆盖面不弱，但职位条数明显受美团、腾讯等大厂拉动。',type:'bar',dataset:'company_sizes',sourceId:'local_csv',encodings:{x:{field:'company_size',type:'nominal'},y:{field:'employers',type:'quantitative'},tooltip:[{field:'listings',type:'quantitative'},{field:'total_employers',type:'quantitative'}]}},
    {id:'skills_chart',title:'职位技能标签频次（前10）',subtitle:'React/TypeScript仍是主轴；Agent岗位把Python、RAG、工具调用和工程化能力叠加在传统Web栈之上。',type:'bar',dataset:'skills',sourceId:'local_csv',encodings:{x:{field:'skill',type:'nominal'},y:{field:'count',type:'quantitative'},tooltip:[{field:'share',type:'quantitative'},{field:'rank',type:'quantitative'}]}}
  ],
  tables:[
    {id:'role_table',title:'岗位、薪资与供需判断',dataset:'role_summary',sourceId:'local_csv',defaultSort:{field:'count',direction:'desc'},columns:[{field:'primary_role',label:'岗位类别'},{field:'count',label:'有效岗位'},{field:'unique_employers',label:'企业数'},{field:'n',label:'薪资样本n'},{field:'midpoint_median',label:'月薪中点中位数(K)'},{field:'midpoint_p25',label:'P25(K)'},{field:'midpoint_p75',label:'P75(K)'},{field:'above35_count',label:'35K可达'},{field:'strong35_count',label:'35K强匹配'},{field:'competition',label:'供需判断'}]},
    {id:'skill_matrix_table',title:'岗位类别 × 技能要求矩阵（出现次数）',dataset:'role_skill_matrix',sourceId:'local_csv',defaultSort:{field:'role_total',direction:'desc'},columns:[{field:'primary_role',label:'岗位类别'},{field:'role_total',label:'岗位数'},{field:'react',label:'React'},{field:'typescript',label:'TypeScript'},{field:'python',label:'Python'},{field:'agent',label:'Agent'},{field:'rag',label:'RAG'},{field:'nodejs',label:'Node.js'},{field:'engineering',label:'工程化'},{field:'performance',label:'性能优化'},{field:'miniprogram',label:'小程序'},{field:'rn',label:'RN'}]},
    {id:'priority_table',title:'优先投递清单（前15）',dataset:'top_priority',sourceId:'local_csv',defaultSort:{field:'priority_score',direction:'desc'},columns:[{field:'priority_score',label:'优先级'},{field:'company',label:'公司'},{field:'raw_title',label:'岗位'},{field:'location',label:'地点'},{field:'salary_min_k',label:'月薪下限(K)'},{field:'salary_max_k',label:'月薪上限(K)'},{field:'pay_months',label:'薪数'},{field:'tier_35k',label:'35K档位'},{field:'skills',label:'技能'},{field:'source_url',label:'来源'}]},
    {id:'jobs_table',title:'本地主样本明细（37条）',dataset:'main_jobs',sourceId:'local_csv',defaultSort:{field:'priority_score',direction:'desc'},columns:[{field:'priority_score',label:'优先级'},{field:'primary_role',label:'类别'},{field:'company',label:'公司'},{field:'raw_title',label:'岗位'},{field:'company_size',label:'规模'},{field:'location',label:'地点'},{field:'salary_min_k',label:'下限(K)'},{field:'salary_max_k',label:'上限(K)'},{field:'pay_months',label:'薪数'},{field:'tier_35k',label:'35K档位'},{field:'experience',label:'经验'},{field:'degree',label:'学历'},{field:'confidence',label:'置信度'},{field:'source_url',label:'来源'}]},
    {id:'remote_table',title:'Worldwide / China远程机会样本',dataset:'remote_jobs',sourceId:'local_csv',defaultSort:{field:'priority_score',direction:'desc'},columns:[{field:'priority_score',label:'优先级'},{field:'company',label:'公司'},{field:'raw_title',label:'岗位'},{field:'location',label:'地域'},{field:'eligible_china',label:'中国居住资格'},{field:'timezone',label:'时区/协作'},{field:'employment_type',label:'雇佣类型'},{field:'skills',label:'技能'},{field:'source_url',label:'申请页'}]},
    {id:'trend_table',title:'过去12个月招聘与岗位演化证据',dataset:'trend_evidence',sourceId:'report_json',defaultSort:{field:'date',direction:'asc'},columns:[{field:'date',label:'日期'},{field:'type',label:'类型'},{field:'event',label:'证据'},{field:'url',label:'来源'}]},
    {id:'social_table',title:'社交平台信号（15条）',dataset:'social_signals',sourceId:'report_json',defaultSort:{field:'date',direction:'desc'},columns:[{field:'platform',label:'平台'},{field:'date',label:'日期'},{field:'direction',label:'方向'},{field:'signal',label:'信号'},{field:'quality',label:'证据质量'},{field:'url',label:'来源'}]},
    {id:'excluded_table',title:'未计入主样本的线索与排除项',dataset:'excluded',sourceId:'local_csv',defaultSort:{field:'active_status',direction:'asc'},columns:[{field:'active_status',label:'状态'},{field:'company',label:'公司'},{field:'raw_title',label:'岗位'},{field:'location',label:'地点'},{field:'exclusion_reason',label:'不计入原因'},{field:'source_url',label:'来源'}]}
  ],
  blocks:[
    {id:'title',type:'markdown',body:'# 成都兴隆湖—高新区互联网岗位分析（2026-08-10）'},
    {id:'exec',type:'markdown',sourceId:'local_csv',body:'## Executive Summary\n\n本次严格口径得到 **37条有效岗位（市场下限）**、**19家去重企业**。核心区（兴隆湖、成都科学城、鹿溪智谷）没有发现同时满足当前有效、精确地址可核验和非外包/驻场的主样本；37条均来自高新南区及相邻扩展片区。月薪中点中位数为 **27.3K**，P25–P75为 **22.3K–35.6K**。仅 **3条**属于月薪下限≥35K的强匹配，另有 **18条**只是上限可谈到35K。远程机会另列6条，不进入成都总量。'},
    {id:'metric_strip',type:'metric-strip',cardIds:['active_jobs','employers','strong35','negotiable35','remote_sample']},
    {id:'market_section',type:'markdown',body:'## 岗位数量与结构\n\n“37条”是公开可验证下限，不是成都全市场估算。BOSS详情页安全验证、部分公司官网JavaScript检索和X/小红书登录限制都会造成漏计；因此它适合求职决策和投递排序，不适合宣称市场总盘。'},
    {id:'role_chart_block',type:'chart',chartId:'role_chart'},
    {id:'role_table_block',type:'table',tableId:'role_table'},
    {id:'salary_section',type:'markdown',sourceId:'local_csv',body:'## 薪资水平与35K判断\n\n前端开发薪资样本n=22，月薪中点中位数30K，P25–P75为23.1K–36.9K；Agent开发薪资样本n=9，月薪中点中位数26.5K，区间离散且按规则为低置信度。AI应用开发n=3、全栈n=2，不发布分组薪资结论。35K求职目标应优先看“强匹配档”，不能把“上限35K”当成保底。'},
    {id:'salary_distribution_chart_block',type:'chart',chartId:'salary_distribution_chart'},
    {id:'tier35_chart_block',type:'chart',chartId:'tier35_chart'},
    {id:'company_section',type:'markdown',sourceId:'local_csv',body:'## 企业规模与集中度\n\n19家企业中，100–499人和20–99人企业各6家；≥10,000人企业3家。职位条数则高度集中：美团17条、腾讯3条，合计占主样本54.1%。这意味着“岗位很多”并不等同于雇主选择同样分散。'},
    {id:'company_chart_block',type:'chart',chartId:'company_size_chart'},
    {id:'requirements_section',type:'markdown',sourceId:'local_csv',body:'## 职位要求\n\n传统Web主轴仍是React、TypeScript、性能优化和工程化。高薪前端更常要求架构、复杂业务、多端与平台化经验；Agent/AI应用岗位在Python/Java/Go基础上叠加RAG、工具调用、上下文与记忆、多Agent编排、评测和可观测性。作品集应展示可运行系统、评测结果与线上稳定性，而不是只有聊天Demo。'},
    {id:'skills_chart_block',type:'chart',chartId:'skills_chart'},
    {id:'skill_matrix_table_block',type:'table',tableId:'skill_matrix_table'},
    {id:'supply_section',type:'markdown',sourceId:'report_json',body:'## 供需关系\n\n按既定阈值，投递人数/候选人竞争信号覆盖率为0%，低于30%，因此不生成数值供需指数。定性判断为：Agent/AI应用“候选人相对友好（低置信度）”，前端“均衡（低置信度）”，全栈“雇主相对友好（样本不足）”。需求信号可见，但竞争强度仍需用户在BOSS沟通后用回复率、约面率补齐。'},
    {id:'priority_section',type:'markdown',body:'## 求职优先级\n\n评分沿用计划：薪资30%、Agent/Web技能匹配25%、地点/远程20%、公司与业务质量15%、真实性与可投递性10%。它是筛选顺序，不替代对团队、绩效、加班与合同主体的面试核验。'},
    {id:'priority_table_block',type:'table',tableId:'priority_table'},
    {id:'jobs_section',type:'markdown',body:'## 完整本地主样本'},
    {id:'jobs_table_block',type:'table',tableId:'jobs_table'},
    {id:'remote_section',type:'markdown',body:'## Worldwide / 远程机会\n\n远程岗位是独立机会样本。5条Bjak职位明确接受中国境内远程；Atria偏好APAC但中国居住资格需要确认。远程职位普遍要求英文沟通、跨时区协作和更强的端到端产品能力。'},
    {id:'remote_table_block',type:'table',tableId:'remote_table'},
    {id:'trend_section',type:'markdown',body:'## 现状与趋势\n\n可靠时间点只有6个，少于8个阈值，因此不画增长趋势线，也不把职位“更新时间”误写成新增岗位。证据一致指向两点：成都高新区/天府软件园仍有集中招聘活动；岗位要求正从单一前端编码转向AI Coding、Agent工程化和全链路交付。'},
    {id:'trend_table_block',type:'table',tableId:'trend_table'},
    {id:'social_section',type:'markdown',body:'## 社交平台信号\n\n已完成X、微博、脉脉、知乎、小红书各3组关键词采样，共保留15条去重信号。培训营销和招聘转述占比较高，因此只用于解释技能热度和岗位演化，不进入岗位数、薪资或供需指数。'},
    {id:'social_table_block',type:'table',tableId:'social_table'},
    {id:'limitations_section',type:'markdown',body:'## 口径、限制与下一步\n\n公开页面访问限制意味着数量只能解释为市场下限。显式招聘人数覆盖2.7%，不能把职位条数等同于实际HC；核心区0条是“本次未核到”，不是“当地没有岗位”。建议先投优先级≥80的岗位，并记录7天回复率、约面率、薪资沟通结果；积累20次有效沟通后即可重估真实竞争强度。'},
    {id:'excluded_table_block',type:'table',tableId:'excluded_table'}
  ]
};

const payload={surface:'report',manifest,snapshot:{version:1,generatedAt:'2026-08-10T00:00:00+08:00',status:'ready',datasets:{headline,role_summary:data.role_summary,salary_distribution:salaryDistribution,tier35,company_sizes:companySizes,skills,role_skill_matrix:roleSkillMatrix,top_priority:data.top_priority,main_jobs:mainJobs,remote_jobs:data.remote_jobs,trend_evidence:data.trend_evidence,social_signals:data.social_signals,excluded:data.excluded_or_leads}},sources};
fs.writeFileSync(path.join(out,'artifact.json'),JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({artifact:path.join(out,'artifact.json'),blocks:manifest.blocks.length,charts:manifest.charts.length,tables:manifest.tables.length,datasets:Object.keys(payload.snapshot.datasets)},null,2));
