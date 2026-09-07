import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const collected = '2026-08-10';
const bossFrontend = 'https://www.zhipin.com/zhaopin/937f6e0bc762a1fa1n163Nq8Fw~~/';
const bossSeniorFrontend = 'https://www.zhipin.com/zhaopin/8ea14f71b24f70840nd43N68EQ~~/';
const bossAgent = 'https://www.zhipin.com/zhaopin/951ab09d697110a90nd43du4FA~~/';
const bossAgentMore = 'https://www.zhipin.com/zhaopin/34bd03bb3f7519160nV_2tW9Ew~~/';

const rows = [
  // Main local sample: public, currently discoverable listings inside the accepted extension boundary.
  ['local','前端开发工程师','前端开发','美团','≥10,000','成都武侯区中和','扩展区','现场',25,50,15,'3-5年','本科','React|TypeScript|大规模Web|性能优化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-zhonghe-a','可谈档','medium','','','','全职'],
  ['local','Web前端技术专家','前端开发','美团','≥10,000','成都武侯区中和','扩展区','现场',40,70,15,'5-10年','本科','React|TypeScript|前端架构|性能优化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-zhonghe-expert','强匹配档','medium','','','','全职'],
  ['local','前端工程师','前端开发','美团','≥10,000','成都武侯区铁像寺','扩展区','现场',30,40,16,'3-5年','本科','React|TypeScript|SaaS|工程化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-tiexiangsi-crm','可谈档','medium','','','','全职'],
  ['local','高级Web前端开发工程师','前端开发','美团','≥10,000','成都武侯区银泰城','扩展区','现场',20,40,16,'3-5年','本科','React|TypeScript|大规模Web|工程化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-yintai-platform','可谈档','medium','','','','全职'],
  ['local','前端工程师','前端开发','美团','≥10,000','成都武侯区复城国际广场','扩展区','现场',20,40,12,'5-10年','本科','React|TypeScript|Web性能',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-fucheng','可谈档','medium','','','','全职'],
  ['local','美团闪购高级前端开发工程师','前端开发','美团','≥10,000','成都武侯区中和','扩展区','现场',40,60,15,'3-5年','本科','React|TypeScript|小程序|RN|SaaS',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-flash-fe-zhonghe-senior','强匹配档','medium','','','','全职'],
  ['local','前端开发工程师','前端开发','美团','≥10,000','成都武侯区银泰城','扩展区','现场',20,30,15,'3-5年','本科','React|TypeScript|CRM|工程化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-yintai-crm','未达35K','medium','','','','全职'],
  ['local','Web前端','前端开发','美团','≥10,000','成都武侯区新会展中心','扩展区','现场',20,40,15,'3-5年','本科','React|TypeScript|大规模Web|实时系统',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-convention-at-home','可谈档','medium','','','','全职'],
  ['local','高级前端开发工程师（营销平台）','前端开发','美团','≥10,000','成都武侯区中和','扩展区','现场',25,50,15,'3-5年','硕士','React|TypeScript|营销平台|工具平台',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-zhonghe-marketing','可谈档','medium','','','','全职'],
  ['local','前端开发工程师（多端）','前端开发','美团','≥10,000','成都武侯区新会展中心','扩展区','现场',25,50,15,'3-5年','本科','H5|小程序|React Native|性能优化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-convention-multiterminal','可谈档','medium','','','','全职'],
  ['local','闪购-高级前端工程师（供应链物流方向）','前端开发','美团','≥10,000','成都武侯区中和','扩展区','现场',19,35,15,'1-3年','本科','React|TypeScript|小程序|RN|供应链SaaS',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-flash-fe-zhonghe-supply','可谈档','medium','','','','全职'],
  ['local','高级前端研发工程师（广告）','前端开发','美团','≥10,000','成都武侯区银泰城','扩展区','现场',15,25,15,'3-5年','本科','React|TypeScript|广告业务|性能优化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-yintai-ads','未达35K','medium','','','','全职'],
  ['local','高级Web前端开发工程师（企业平台）','前端开发','美团','≥10,000','成都武侯区桂溪','扩展区','现场',15,30,15,'1-3年','本科','React|TypeScript|中后台|数据可视化',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-guixi-enterprise','未达35K','medium','','','','全职'],
  ['local','前端开发工程师（企业应用）','前端开发','美团','≥10,000','成都武侯区银泰城','扩展区','现场',20,40,15,'1-3年','本科','React|TypeScript|数据可视化|在线教育',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-fe-yintai-enterprise-app','可谈档','medium','','','','全职'],
  ['local','闪购-成都-高级前端开发工程师','前端开发','美团','≥10,000','成都武侯区新会展中心','扩展区','现场',25,35,12,'3-5年','本科','React|TypeScript|小程序|RN|SaaS',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-flash-fe-convention','可谈档','medium','','','','全职'],
  ['local','闪购-高级前端工程师（供应链物流方向）','前端开发','美团','≥10,000','成都武侯区石羊场','扩展区','现场',30,45,15,'3-5年','本科','React|TypeScript|小程序|RN|供应链',null,'2026-07（索引抓取）','active','BOSS直聘',bossFrontend,'meituan-flash-fe-shiyang-supply','可谈档','medium','','','','全职'],
  ['local','资深前端开发工程师（AI导览）','前端开发','同程旅行','1,000-9,999','成都武侯区铁像寺','扩展区','现场',28,40,15,'5-10年','本科','React|TypeScript|前端架构|AI产品',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'tongcheng-fe-tiexiangsi-ai-tour','可谈档','medium','','','','全职'],
  ['local','前端开发工程师（AI平台）','前端开发','景烁科技','1,000-9,999','成都武侯区新会展中心','扩展区','现场',18,35,12,'3-5年','本科','React|TypeScript|Node.js|AI平台',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'jingshuo-fe-convention-ai','可谈档','medium','','','','全职'],
  ['local','资深前端/全栈开发工程师','全栈开发','伍柒必乐','100-499','成都武侯区新会展中心','扩展区','现场',16,30,12,'3-5年','本科','React|TypeScript|Web可视化|Node.js',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'57bile-fullstack-convention','未达35K','medium','','','','全职'],
  ['local','前端开发工程师','前端开发','四川畅想创睿网络科技','100-499','成都武侯区桂溪','扩展区','现场',15,25,12,'5-10年','本科','React|TypeScript|复杂Web',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'changxiang-fe-guixi','未达35K','medium','','','','全职'],
  ['local','前端开发工程师','前端开发','量迅科技','20-99','成都武侯区新会展中心','扩展区','现场',10,15,12,'3-5年','本科','Vue|TypeScript|工程化',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'liangxun-fe-convention','未达35K','medium','','','','全职'],
  ['local','前端开发工程师','前端开发','华盛云端','20-99','成都武侯区桂溪','扩展区','现场',8,11,12,'经验不限','本科','Web可视化|云产品|JavaScript',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'huasheng-fe-guixi','未达35K','medium','','','','全职'],
  ['local','前端开发工程师','前端开发','智维平科技','20-99','成都武侯区中和','扩展区','现场',7,12,12,'3-5年','本科','Vue|JavaScript|用户体验',null,'2026-07（索引抓取）','active','BOSS直聘',bossSeniorFrontend,'zhiweiping-fe-zhonghe','未达35K','medium','','','','全职'],
  ['local','AI Agent应用工程师','Agent开发','成都卓影科技股份有限公司','100-499','成都武侯区天府软件园E区','扩展区','现场',12,20,12,'3-5年','本科','Java|Python|Spring Boot|FastAPI|LangGraph|AgentScope|Skills',1,'2026-08-10可投递','active','智联招聘','https://www.zhaopin.com/jobdetail/CC541840820J40801057216.htm','zhuoying-agent-tfsp','未达35K','high','','','','全职'],
  ['local','AI视觉开发工程师','AI应用开发','新钶电子','100-499','成都武侯区中和','扩展区','现场',20,35,13,'1-3年','本科','Python|LoRA|RAG|大模型部署',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'xinke-ai-zhonghe','可谈档','medium','','','','全职'],
  ['local','AI Agent开发工程师','Agent开发','合尔康','20-99','成都武侯区新会展中心','扩展区','现场',20,30,14,'5-10年','本科','LLM|Agent|任务规划|对话管理|RAG',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'heerkang-agent-convention','未达35K','medium','','','','全职'],
  ['local','AI Agent开发工程师','Agent开发','华为云','≥10,000','成都武侯区中和','扩展区','现场',18,35,12,'1-3年','本科','Python|Agent|Prompt|上下文管理|LLM API',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'huaweicloud-agent-zhonghe','可谈档','medium','','','','全职'],
  ['local','AI Agent全栈开发工程师（B端）','全栈开发','中建电商','500-999','成都武侯区石羊场','扩展区','现场',20,30,12,'5-10年','本科','React|Node.js|Python|Agent|B端SaaS',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'cscec-fullstack-shiyang','未达35K','medium','','','','全职'],
  ['local','AI Agent应用开发工程师','Agent开发','成都品爆科技有限公司','100-499','成都武侯区石羊场','扩展区','现场',7,12,13,'经验不限','本科','大模型API|Agent|AI Coding',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'pinbao-agent-shiyang','未达35K','medium','','','','全职'],
  ['local','AI Agent开发工程师（Golang & Python）','Agent开发','掌梦科技','100-499','成都武侯区新会展中心','扩展区','现场',15,25,12,'1-3年','本科','Go|Python|LLM|Agent|海外产品',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'zhangmeng-agent-convention','未达35K','medium','','','','全职'],
  ['local','AI应用开发工程师','AI应用开发','塔万科技','20-99','成都武侯区成都高新区','扩展区','现场',18,25,13,'经验不限','博士','AI应用|系统设计|大模型',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'tawan-ai-gaoxin','未达35K','medium','','','','全职'],
  ['local','AI Agent平台（框架/应用）开发工程师','Agent开发','腾讯','≥10,000','成都武侯区中和','扩展区','现场',25,45,15,'3-5年','本科','Multi-Agent|工具调用|Agent框架|Python|Go',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'tencent-agent-platform-zhonghe','可谈档','medium','','','','全职'],
  ['local','企业微信-AI应用后台开发工程师','Agent开发','腾讯','≥10,000','成都武侯区新会展中心','扩展区','现场',30,60,12,'经验不限','本科','RAG|Agent|企业知识图谱|后台开发',null,'2026-08（索引抓取）','active','BOSS直聘',bossAgentMore,'tencent-wecom-agent-convention','可谈档','medium','','','','全职'],
  ['local','AI应用后台开发工程师-Agent','Agent开发','腾讯','≥10,000','成都武侯区中和','扩展区','现场',30,60,15,'1-3年','本科','Agent服务|后端架构|性能优化|Python|Java',null,'2026-08（索引抓取）','active','BOSS直聘',bossAgentMore,'tencent-agent-backend-zhonghe','可谈档','medium','','','','全职'],
  ['local','AI开发工程师（Agent基础设施）','Agent开发','中彦医疗','20-99','成都武侯区中和','扩展区','现场',40,60,15,'3-5年','本科','Agent架构|Skills|子Agent编排|知识库治理',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'zhongyan-agent-zhonghe','强匹配档','medium','','','','全职'],
  ['local','AI开发工程师','AI应用开发','美团','≥10,000','成都武侯区中和','扩展区','现场',18,30,12,'10年以上','本科','Java|Go|Python|Node.js|Agent',null,'2026-07（索引抓取）','active','BOSS直聘',bossAgent,'meituan-ai-dev-zhonghe','未达35K','medium','','','','全职'],
  ['local','AI Agent开发工程师','Agent开发','四川成都超精密光学创新研究院','未知','成都高新区高新南区7号楼','扩展区','现场',null,null,12,'3-5年','本科','Python|Agent|RAG|LLM应用',null,'2026-07-24','active','招聘聚合页','https://www.quanzhi.com/job/6a62ec8662f6005b2b2d50c8','ultraoptics-agent-gaoxinnan','薪资缺失','low','','','','全职'],

  // Leads and exclusions retained for audit but never included in the main count.
  ['local','全栈开发工程师','全栈开发','成都星阵地科技有限公司','未知','成都双流区兴隆湖','核心区','现场',null,null,12,'5-10年','本科','React|Vue|Python|RAG|Agent|Workflow',null,'日期未知','lead','智联招聘','https://www.zhaopin.com/jobdetail/CC261308530J40911795912.htm','xingzhen-fullstack-xinglonghu','薪资缺失','low','活动日期与薪资无法验证','','','全职'],
  ['local','AI Agent开发工程师','Agent开发','洞察时空（成都）科技有限公司','未知','成都双流区（精确地点未披露）','边界待核','现场',20,30,14,'5-10年','本科','Go|Python|MCP|Skills|CLI|Sandbox',1,'2026-07-10','lead','猎聘','https://www.liepin.com/job/1984039865.shtml','dongcha-agent-shuangliu','未达35K','low','未核到核心区或扩展区精确地址','','','全职'],
  ['local','Agent全栈开发工程师','全栈开发','四川鲸杉人工智能科技有限公司','未知','成都（精确地点未披露）','边界待核','现场',20,30,12,'经验不限','本科','TypeScript|React|Vue|Node.js|Python|MCP|Agent',2,'2026-07-03','lead','猎聘','https://www.liepin.com/job/1983835989.shtml','jingshan-fullstack-chengdu','未达35K','low','未核到核心区或扩展区精确地址','','','全职'],
  ['local','全栈开发工程师','全栈开发','智眸心域（四川省）科技有限责任公司','1-19','成都高新区（精确地点未披露）','边界待核','现场',8,10,12,'3-5年','本科','Java|Spring|Vue|React|LangChain|LangGraph|RAG',1,'2026-07-09','lead','猎聘','https://www.liepin.com/job/1984012117.shtml','zhimou-fullstack-gaoxin','未达35K','low','高新区范围过大，无法确认是否在纳入片区','','','全职'],
  ['local','全栈开发（FDE）','全栈开发','成都精灵云','100-499','成都武侯区中和','扩展区','驻场/交付',15,30,12,'5-10年','本科','Go|Java|Python|售前|现场联调|运维交付',null,'2026-07（索引抓取）','excluded','BOSS直聘','https://www.zhipin.com/zhaopin/91cf9e2072c99e220nd6090~/','jinglingyun-fde-zhonghe','未达35K','medium','明确直面客户、现场联调和交付，按决定忽略驻场岗位','','','全职'],
  ['local','AI Agent开发工程师','Agent开发','仕虹腾飞 / Rokid签约安排','1-19','成都双流区华阳','范围外','现场',18,35,14,'5-10年','本科','Agent|RAG|LLM|多端',null,'2026-07（索引抓取）','excluded','BOSS直聘',bossAgent,'shihong-agent-huayang','可谈档','medium','工作地不在纳入片区，且存在异地/第三方签约风险','','','全职'],
  ['local','AI Agent开发工程师（实习）','Agent开发','蜀俊博凌','20-99','成都高新区','边界待核','现场',null,null,12,'不限','本科','Python|Java|Go|LangChain|LangGraph|RAG',null,'2026-08-03','excluded','实习僧','https://www.shixiseng.com/intern/inn_kbybigxnwlum','shujun-agent-intern','薪资缺失','high','职位页明确已下线，且为实习岗','','','实习'],
  ['local','AI agent全栈开发工程师','全栈开发','未披露（猎头）','未知','成都高新区','边界待核','现场',25,40,12,'3-5年','本科','Agent|全栈|RAG',1,'2026-08-06','lead','猎聘','https://www.liepin.com/a/78654033.shtml','headhunter-agent-fullstack','可谈档','low','实际雇主与精确地址未披露，不计主样本','','','全职'],

  // Separate worldwide/remote opportunity sample. These rows never enter Chengdu totals.
  ['remote','Frontend Engineer – AI Automation Platform','前端开发','Bjak','未知','China','远程样本','远程',null,null,12,'未披露','本科或同等经验','React|Next.js|TypeScript|AI产品|CI/CD',null,'2026-07（抓取）','active','公司招聘系统','https://jobs.ashbyhq.com/bjakcareer/064c3d19-a538-4cf0-a45d-4ed1de5d9167','bjak-fe-ai-automation-cn','薪资缺失','high','','是','马来西亚/APAC协作','全职'],
  ['remote','React Frontend Engineer - Claims & Policy Automation','前端开发','Bjak','未知','China','远程样本','远程',null,null,12,'未披露','未披露','React|TypeScript|AI工作流|保险科技',null,'2026-07（抓取）','active','公司招聘系统','https://jobs.ashbyhq.com/bjakcareer/ea40be8e-9c3f-429e-b9d2-1e34a9ca270a','bjak-fe-claims-cn','薪资缺失','high','','是','马来西亚/APAC协作','全职'],
  ['remote','Frontend Engineer - Checkout & Renewals','前端开发','Bjak','未知','China','远程样本','远程',null,null,12,'未披露','未披露','React|Next.js|TypeScript|支付|交易系统',null,'2026-07（抓取）','active','公司招聘系统','https://jobs.ashbyhq.com/bjakcareer/d21f486e-c84e-4e90-a3be-cd29147b4167','bjak-fe-checkout-cn','薪资缺失','high','','是','马来西亚/APAC协作','全职'],
  ['remote','Frontend Engineer - Insurance Workflow Automation','前端开发','Bjak','未知','China','远程样本','远程',null,null,12,'未披露','未披露','React|TypeScript|工作流|系统设计',null,'2026-07（抓取）','active','公司招聘系统','https://jobs.ashbyhq.com/bjakcareer/421db827-ac51-41d5-ab03-84bd68723981','bjak-fe-workflow-cn','薪资缺失','high','','是','马来西亚/APAC协作','全职'],
  ['remote','Senior Frontend Engineer','前端开发','Bjak','未知','China','远程样本','远程',null,null,12,'高级','未披露','React|TypeScript|前端架构|金融科技',null,'2026-05（抓取）','active','公司招聘系统','https://jobs.ashbyhq.com/bjakcareer/cae9229c-3d63-42d1-a520-1b58fe11e723','bjak-senior-fe-cn','薪资缺失','high','','是','马来西亚/APAC协作','全职'],
  ['remote','Senior Frontend Engineer','前端开发','Atria','未知','Singapore / Taiwan / flexible APAC','远程样本','远程',null,null,12,'Senior','未披露','Next.js|React|TypeScript|AI Agent|AI Coding|英语',null,'2026-08（抓取）','active','公司招聘系统','https://jobs.ashbyhq.com/atria/65c7622f-77c7-46c6-9cb5-592dc8ff6d45','atria-senior-fe-apac','薪资缺失','high','','待确认','APAC优先；英语口语必需','全职'],
  ['remote','Full Stack Software Engineer (APAC)','全栈开发','Patlytics','未知','APAC','远程样本','混合/远程',null,null,12,'4年以上','未披露','TypeScript|React|Next.js|Python|SQL|AI应用',null,'2026-05（抓取）','lead','公司招聘系统','https://jobs.ashbyhq.com/patlytics/a3d66d31-2a27-4f25-86b8-19ddd08b91bd','patlytics-fullstack-apac','薪资缺失','medium','页面标为Hybrid且中国居住资格未披露','待确认','APAC','全职'],
  ['remote','Frontend Engineer','前端开发','Hercules','未知','Remote - North America','远程样本','远程',100,250,12,'Senior/Staff','未披露','React|TypeScript|PWA|AI Agent|App Builder',null,'2026-07（抓取）','excluded','公司招聘系统','https://jobs.ashbyhq.com/hercules/ca4bc69a-cde4-4a9f-8269-a81be1f75668','hercules-fe-na','强匹配档','high','仅北美远程且要求美国时区、定期到旧金山','否','美国时区','全职'],
];

const headers = ['collection_date','scope','raw_title','primary_role','company','company_size','location','geo_tier','work_mode','salary_min_k','salary_max_k','pay_months','annual_min_k','annual_max_k','currency','experience','degree','skills','headcount','posted_updated','active_status','source_type','source_url','dedup_group','tier_35k','confidence','exclusion_reason','eligible_china','timezone','employment_type','priority_score','notes'];

function companyQuality(size) {
  if (size === '≥10,000') return 95;
  if (size === '1,000-9,999') return 88;
  if (size === '500-999') return 80;
  if (size === '100-499') return 72;
  if (size === '20-99') return 62;
  if (size === '1-19') return 48;
  return 55;
}

function priorityScore(r) {
  const scope = r[0], role = r[2], size = r[4], geo = r[6];
  const min = r[8], max = r[9], skills = r[13], status = r[16];
  const source = r[17], confidence = r[21], exclusion = r[22], eligible = r[23];
  if (status !== 'active' || exclusion) return '';
  const midpoint = min != null && max != null ? (min + max) / 2 : null;
  const comp = midpoint == null ? 45 : Math.max(20, Math.min(100, midpoint / 45 * 100));
  let match = role === 'Agent开发' ? 100 : role === 'AI应用开发' ? 94 : role === '全栈开发' ? 88 : 78;
  if (/Agent|RAG|MCP|AI/.test(skills)) match = Math.min(100, match + 5);
  const loc = scope === 'remote' ? (eligible === '是' ? 95 : 70) : geo === '核心区' ? 100 : geo === '扩展区' ? 82 : 45;
  const quality = companyQuality(size);
  const authenticity = source === '公司招聘系统' ? 95 : source === '智联招聘' ? 88 : source === 'BOSS直聘' ? 78 : confidence === 'high' ? 85 : 55;
  return Math.round(comp * .30 + match * .25 + loc * .20 + quality * .15 + authenticity * .10);
}

const objects = rows.map((r) => {
  const [scope, raw_title, primary_role, company, company_size, location, geo_tier, work_mode, salary_min_k, salary_max_k, pay_months, experience, degree, skills, headcount, posted_updated, active_status, source_type, source_url, dedup_group, tier_35k, confidence, exclusion_reason, eligible_china, timezone, employment_type] = r;
  const annual_min_k = salary_min_k == null ? null : salary_min_k * pay_months;
  const annual_max_k = salary_max_k == null ? null : salary_max_k * pay_months;
  const priority_score = priorityScore(r);
  const notes = scope === 'remote' && salary_min_k != null ? '远程岗位原币为USD；人民币折算采用2026-08-06外汇局中间价1 USD=6.7895 CNY，仅作机会对比' : '';
  return {collection_date: collected, scope, raw_title, primary_role, company, company_size, location, geo_tier, work_mode, salary_min_k, salary_max_k, pay_months, annual_min_k, annual_max_k, currency: scope === 'remote' && salary_min_k != null ? 'USD' : 'CNY', experience, degree, skills, headcount, posted_updated, active_status, source_type, source_url, dedup_group, tier_35k, confidence, exclusion_reason, eligible_china, timezone, employment_type, priority_score, notes};
});

const csvEscape = (value) => {
  if (value == null) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

const outputDir = path.join(projectRoot, 'outputs/chengdu_internet_jobs_20260810');
fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(path.join(outputDir, 'chengdu_internet_jobs.csv'), [headers.join(','), ...objects.map(o => headers.map(h => csvEscape(o[h])).join(','))].join('\n') + '\n');

const main = objects.filter(o => o.scope === 'local' && o.active_status === 'active' && o.geo_tier === '扩展区' && !o.exclusion_reason);
const remote = objects.filter(o => o.scope === 'remote' && o.active_status === 'active' && !o.exclusion_reason);
const quantile = (values, p) => {
  const a = [...values].sort((x,y)=>x-y); if (!a.length) return null;
  const i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return +(a[lo] + (a[hi] - a[lo]) * (i - lo)).toFixed(1);
};
const salaryStats = (data) => {
  const eligible = data.filter(o => o.salary_min_k != null && o.salary_max_k != null);
  const mins = eligible.map(o=>o.salary_min_k), mids = eligible.map(o=>(o.salary_min_k+o.salary_max_k)/2), maxs = eligible.map(o=>o.salary_max_k);
  return {n: eligible.length, publishable:eligible.length>=5, confidence:eligible.length>=10?'medium':eligible.length>=5?'low':'insufficient', min_median: quantile(mins,.5), midpoint_median: quantile(mids,.5), max_median: quantile(maxs,.5), midpoint_p25: quantile(mids,.25), midpoint_p75: quantile(mids,.75)};
};
const groupCount = (data, field) => Object.entries(data.reduce((a,o)=>(a[o[field]]=(a[o[field]]||0)+1,a),{})).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'zh-CN'));
const tiers = groupCount(main,'tier_35k');
const employers = new Set(main.map(o=>o.company)).size;
const headcountKnown = main.filter(o=>Number.isFinite(o.headcount));
const skillCounts = {};
for (const o of main) for (const skill of o.skills.split('|')) skillCounts[skill]=(skillCounts[skill]||0)+1;
const topSkills = Object.entries(skillCounts).map(([skill,count])=>({skill,count,share:+(count/main.length*100).toFixed(1)})).sort((a,b)=>b.count-a.count||a.skill.localeCompare(b.skill,'zh-CN')).slice(0,15);

const socialSignals = [
  {platform:'脉脉',date:'2026-03-07',signal:'字节跳动成都研发专场覆盖前端/后端，线上一天完成多轮面试。',direction:'需求',quality:'medium',url:'https://maimai.cn/article/detail?efid=MFEZ_0dq2k6suHFDqW3mCw&fid=1904421055'},
  {platform:'脉脉',date:'2026-07',signal:'猎头讨论称企业争夺的是有真实落地经验的Agent人才，而非仅写“了解大模型”的候选人。',direction:'门槛',quality:'low',url:'https://maimai.cn/article/detail?efid=HI_5ybAptN8eui6ResXzfw&fid=1918823998'},
  {platform:'脉脉',date:'2026-07',signal:'美团基础研发平台发布成都AI Agent开发岗位线索，职级L6-L7。',direction:'需求',quality:'medium',url:'https://maimai.cn/article/detail?efid=acOZWDVAzwIW8jDCWQgW9Q&fid=1913328148'},
  {platform:'脉脉',date:'2026-07',signal:'企业微信Agent算法岗覆盖成都，强调多智能体、推理、后训练与论文/开源贡献。',direction:'门槛',quality:'medium',url:'https://maimai.cn/article/detail?efid=s5nEaYv-TpGnW_OTGq4nrw&fid=1902630115'},
  {platform:'知乎',date:'2026-07-17',signal:'转型内容反复提及Agent、RAG、Tool Calling和知识库问答；内容带课程推广，不能用于薪资事实。',direction:'技能热度',quality:'low',url:'https://zhuanlan.zhihu.com/p/2047320727582238594'},
  {platform:'知乎',date:'2026-06-10',signal:'内容声称Agent已成实习门槛，但统计无可复核出处，仅作“讨论升温”信号。',direction:'竞争讨论',quality:'low',url:'https://zhuanlan.zhihu.com/p/2048064688726996854'},
  {platform:'知乎',date:'2026-07',signal:'后端职业讨论中，LangChain、大模型调试和前后端协同被描述为新增能力。',direction:'技能迁移',quality:'low',url:'https://www.zhihu.com/question/13745280561/answer/1896261174439437111'},
  {platform:'知乎',date:'2026-07',signal:'Agent工程实践讨论强调评测、Bad Case定位、检索/重排/Prompt链路，而非只会调用API。',direction:'门槛',quality:'low',url:'https://www.zhihu.com/question/2011582660766618464/answer/2047816821852656783'},
  {platform:'微博',date:'2026-07-16',signal:'转述智联2026上半年报告：AI智能体开发人才需求同比增长244%，成都等新一线城市AI招聘增速领先。',direction:'行业趋势',quality:'medium',url:'https://weibo.com/2/detail/5321313746160152'},
  {platform:'微博',date:'2026-06',signal:'关于DeepSeek Harness招聘的讨论把岗位焦点指向Agent运行与管理基础设施。',direction:'岗位演化',quality:'low',url:'https://www.weibo.com/ttarticle/p/show?id=2309405312710970835177'},
  {platform:'X',date:'2026-04-02',signal:'全球远程Web3职位聚合帖同时出现TypeScript/Go全栈、全球远程前端与Web3岗位。',direction:'远程机会',quality:'low',url:'https://x.com/crypto_vazima/status/2039706781308383372'},
  {platform:'X',date:'2026-02-23',signal:'Agent框架讨论集中在LangGraph、CrewAI、ADK、Agents SDK、Mastra等多框架生态。',direction:'技能热度',quality:'low',url:'https://x.com/bsubra/status/2026007975077265896'},
  {platform:'小红书/官方招聘',date:'2026-08',signal:'小红书前端与全栈JD明确把日常AI Coding、Prompt质量、RAG与Agent项目经验列为加分项或面试项。',direction:'门槛',quality:'high',url:'https://job.xiaohongshu.com/campus/position/15802?referer_code=N2237KWBYURA'},
  {platform:'小红书/官方招聘',date:'2026-08',signal:'AI Agent架构岗强调多Agent协作、上下文/记忆、可靠执行与工作流调度。',direction:'岗位演化',quality:'high',url:'https://job.xiaohongshu.com/social/position/20400'},
  {platform:'V2EX',date:'2025-11-19',signal:'天府三街Vue岗位同时要求AI工具、Linux和CI/CD，显示传统前端向全链路交付扩展。',direction:'技能迁移',quality:'medium',url:'https://www.v2ex.com/t/1173752'}
];

const trendEvidence = [
  {date:'2025-11-19',event:'天府三街Vue岗位要求AI工具、Linux与CI/CD',type:'职位技能迁移',url:'https://www.v2ex.com/t/1173752'},
  {date:'2026-03-07',event:'字节跳动成都研发专场覆盖前端/后端',type:'企业招聘活动',url:'https://maimai.cn/article/detail?efid=MFEZ_0dq2k6suHFDqW3mCw&fid=1904421055'},
  {date:'2026-06-12',event:'成都高新区数字经济专场：21家企业、112个岗位、300余名求职者，最高年薪60万元',type:'区域招聘活动',url:'https://web.csp.chinamcloud.com/cms/cdgxqrmt_html/APP/fglm/4896183524.shtml'},
  {date:'2026-06-24',event:'天府软件园全球直播招聘：近40家企业、近200个岗位、近30万人次观看',type:'园区招聘活动',url:'https://www.scjjrb.cn/2026/06/26/99467109.html'},
  {date:'2026-07-16',event:'智联上半年AI人才报告转述：Agent人才需求同比增长244%，成都等新一线城市增速领先',type:'全国趋势/成都信号',url:'https://weibo.com/2/detail/5321313746160152'},
  {date:'2026-08-10',event:'本次可验证快照：扩展区37条有效岗位；核心区0条满足全部核验条件',type:'当前快照',url:'https://www.zhipin.com/zhaopin/951ab09d697110a90nd43du4FA~~/'}
];

const roleSummary = groupCount(main,'primary_role').map(x=>{
  const data=main.filter(o=>o.primary_role===x.name);
  const salary=salaryStats(data);
  const above=data.filter(o=>['强匹配档','可谈档'].includes(o.tier_35k)).length;
  const strong=data.filter(o=>o.tier_35k==='强匹配档').length;
  const competition=x.name==='Agent开发'||x.name==='AI应用开发'?'候选人相对友好（低置信度）':x.name==='前端开发'?'均衡（低置信度）':'雇主相对友好（样本不足）';
  return {primary_role:x.name,count:x.count,unique_employers:new Set(data.map(o=>o.company)).size,above35_count:above,strong35_count:strong,above35_share:+(above/data.length*100).toFixed(1),competition,...salary};
});

const employerRows = [...new Map(main.map(o=>[o.company,{company:o.company,company_size:o.company_size}])).values()];
const collectionLog = [
  ['BOSS直聘','成都美团前端','1个索引页/约30条可见结果','2026-08-10','保留唯一团队/地点/描述；同公司同地点相似描述合并','索引页近期抓取，详情点击触发安全验证'],
  ['BOSS直聘','成都资深前端','1个索引页/约25条可见结果','2026-08-10','连续结果中目标片区新增趋近于0','排除游戏/非目标城区/低相关'],
  ['BOSS直聘','成都AI Agent/AI应用','2个索引页/约45条可见结果','2026-08-10','目标片区去重新增低于5%','排除实习、范围外、外包/驻场'],
  ['智联招聘','AI Agent/AI应用 成都','3个详情页','2026-08-10','可公开访问的相关详情已核','详情页用于薪资、地址、人数与投递状态'],
  ['猎聘','成都 Agent/全栈','2轮Exa/搜索索引','2026-08-10','后续查询触发免费额度/验证码','只保留精确地点可核记录，其他为lead'],
  ['公司官网','腾讯/美团/字节/小红书/远程公司','多轮精确标题检索','2026-08-10','目标35K+与主要雇主均尝试核验','腾讯官方来源镜像、小红书与Ashby可核；美团官网未能定位到可公开详情'],
  ['社交平台','每平台3组：招聘/求职/Agent技能','X、微博、脉脉、知乎、小红书各3组','2026-08-10','完成既定3组/平台','X/XHS登录后端不可用，使用公开索引；共15条去重信号'],
  ['Worldwide远程','AI Agent前端/全栈 + China/APAC','4轮、约30条候选','2026-08-10','连续结果多为地域受限；保留6条有效样本','5条明确China远程，1条APAC资格待确认']
];
const logHeaders=['channel','query_group','coverage','collected_at','stop_reason','notes'];
fs.writeFileSync(path.join(outputDir,'collection_log.csv'),[logHeaders.join(','),...collectionLog.map(r=>r.map(csvEscape).join(','))].join('\n')+'\n');

const reportData = {
  generated_at:'2026-08-10T00:00:00+08:00',
  methodology:{definition:'公开可验证有效岗位数（市场下限）',local_main_filter:'scope=local, active_status=active, geo_tier=扩展区, exclusion_reason为空',core_note:'核心区未发现满足活动状态、薪资/地址可核验条件的主样本；1条兴隆湖线索因日期和薪资缺失仅保留为lead。',fx:'2026-08-06 SAFE midpoint: 1 USD = 6.7895 CNY'},
  headline:{active_listings:main.length,unique_employers:employers,explicit_headcount_coverage:+(headcountKnown.length/main.length*100).toFixed(1),explicit_headcount_sum:headcountKnown.reduce((s,o)=>s+o.headcount,0),remote_active_sample:remote.length,core_active_verified:0},
  role_counts:groupCount(main,'primary_role').map(x=>({role:x.name,count:x.count})),
  role_summary:roleSummary,
  geo_counts:groupCount(main,'geo_tier').map(x=>({geo:x.name,count:x.count})),
  company_size_counts:groupCount(main,'company_size').map(x=>({company_size:x.name,count:x.count})),
  company_size_employers:groupCount(employerRows,'company_size').map(x=>({company_size:x.name,employers:x.count})),
  salary_overall:salaryStats(main),
  salary_by_role:groupCount(main,'primary_role').map(x=>({primary_role:x.name,...salaryStats(main.filter(o=>o.primary_role===x.name))})),
  tier35_counts:tiers.map(x=>({tier:x.name,count:x.count})),
  top_skills:topSkills,
  social_signals:socialSignals,
  trend_evidence:trendEvidence,
  supply_demand:{numeric_index_allowed:false,applicant_signal_coverage:0,key_field_coverage:97.3,reason:'可见投递/竞争人数覆盖率为0%，低于30%阈值；不生成伪精确指数。',qualitative:roleSummary.map(x=>({primary_role:x.primary_role,assessment:x.competition}))},
  jobs:objects,
  top_priority:main.filter(o=>o.priority_score!=='').sort((a,b)=>b.priority_score-a.priority_score).slice(0,15),
  remote_jobs:remote,
  excluded_or_leads:objects.filter(o=>o.active_status!=='active'||o.exclusion_reason)
};
fs.writeFileSync(path.join(outputDir,'report_data.json'), JSON.stringify(reportData,null,2)+'\n');

const checks = {
  unique_dedup_groups:new Set(objects.map(o=>o.dedup_group)).size===objects.length,
  salary_ranges_valid:objects.every(o=>o.salary_min_k==null||o.salary_max_k==null||o.salary_min_k<=o.salary_max_k),
  annual_salary_reconciles:objects.every(o=>o.salary_min_k==null||o.annual_min_k===o.salary_min_k*o.pay_months) && objects.every(o=>o.salary_max_k==null||o.annual_max_k===o.salary_max_k*o.pay_months),
  main_scope_valid:main.every(o=>o.scope==='local'&&o.active_status==='active'&&o.geo_tier==='扩展区'&&!o.exclusion_reason),
  no_outsourcing_or_onsite_in_main:main.every(o=>!/(驻场|外包|现场联调|客户交付)/.test(`${o.raw_title}|${o.exclusion_reason}`)),
  counts_reconcile:reportData.role_counts.reduce((s,x)=>s+x.count,0)===main.length&&reportData.tier35_counts.reduce((s,x)=>s+x.count,0)===main.length&&reportData.company_size_counts.reduce((s,x)=>s+x.count,0)===main.length,
  strong35_rule:main.filter(o=>o.tier_35k==='强匹配档').every(o=>o.salary_min_k>=35),
  negotiable35_rule:main.filter(o=>o.tier_35k==='可谈档').every(o=>o.salary_min_k<35&&o.salary_max_k>=35),
  supply_index_suppressed:reportData.supply_demand.numeric_index_allowed===false,
  remote_separate:remote.every(o=>o.scope==='remote')
};
const qa={status:Object.values(checks).every(Boolean)?'pass':'fail',checks,main_count:main.length,csv_rows:objects.length,generated_at:'2026-08-10T00:00:00+08:00'};
fs.writeFileSync(path.join(outputDir,'qa_results.json'),JSON.stringify(qa,null,2)+'\n');
console.log(JSON.stringify({outputDir,headline:reportData.headline,salary:reportData.salary_overall,role_counts:reportData.role_counts,tier35:reportData.tier35_counts,top_priority:reportData.top_priority.map(x=>({company:x.company,title:x.raw_title,score:x.priority_score}))},null,2));
