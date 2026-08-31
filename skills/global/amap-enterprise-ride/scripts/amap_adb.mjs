#!/usr/bin/env zx

import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

$.verbose = false;

const commandName = argv._[0] ?? 'help';
const commandArgs = argv._.slice(1).map(String);
const requestedSerial = process.env.AMAP_ADB_SERIAL?.trim();
let activeSerial = requestedSerial;

const helpText = `用法：npx --yes zx scripts/amap_adb.mjs <命令> [参数]
  screenshot 路径                    保存当前画面为 PNG
  dump 路径                          保存当前 UI 层级为 XML（自动重试）
  snapshot 前缀                      同时保存 XML、PNG 并输出 JSON 状态
  status [--xml 路径] [--json]       输出路线、时间、价格、支付和订单状态
  has-text 文本 [--timeout 秒]       等待并检测准确文本
  tap-text 文本 [--timeout 秒]       等待并点击准确文本
  tap-provider 名称 [--timeout 秒]   等待并点击供应商行复选框
  check-threshold 用户上限 [--xml]   判断个人支付阈值弹窗是否可自动继续
  confirm-threshold 用户上限         安全校验通过后点击阈值弹窗“确认”
  monitor [--interval 15] [--timeout 900] [--prefix 路径]
                                      监控派单，司机接单后输出 JSON 并截图`;

function fail(message, code = 1) {
  console.error(message);
  process.exitCode = code;
}

function numberOption(value, fallback, name) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name} 必须是非负数字`);
  return parsed;
}

async function retry(operation, { attempts = 3, waitMs = 1200, label = '操作' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(waitMs);
    }
  }
  throw new Error(`${label}失败（已重试 ${attempts} 次）：${lastError?.message ?? lastError}`);
}

function adbSerialArgs() {
  return activeSerial ? ['-s', activeSerial] : [];
}

async function adbText(...args) {
  const result = await $({ quiet: true })`adb ${adbSerialArgs()} ${args}`;
  return result.stdout.trim();
}

async function requireDevice() {
  await retry(async () => {
    const devicesOutput = await $({ quiet: true })`adb devices`;
    const onlineDevices = devicesOutput.stdout
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.match(/^(\S+)\s+device$/)?.[1])
      .filter(Boolean);

    if (requestedSerial) {
      if (!onlineDevices.includes(requestedSerial)) {
        throw Object.assign(new Error(`指定设备未在线：${requestedSerial}`), { exitCode: 2 });
      }
      activeSerial = requestedSerial;
    } else if (onlineDevices.length === 1) {
      [activeSerial] = onlineDevices;
    } else {
      throw Object.assign(
        new Error(`应当恰好连接一个在线安卓设备，当前发现 ${onlineDevices.length} 个。请设置 AMAP_ADB_SERIAL。`),
        { exitCode: 2 },
      );
    }

    await adbText('get-state');
  }, { attempts: 3, waitMs: 1000, label: '连接安卓设备' });
}

async function dumpUi(outputPath) {
  const absolutePath = resolve(outputPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await retry(async () => {
    await adbText('shell', 'uiautomator', 'dump', '/sdcard/amap-skill-ui.xml');
    await $({ quiet: true })`adb ${adbSerialArgs()} pull /sdcard/amap-skill-ui.xml ${absolutePath}`;
    const xml = await readFile(absolutePath, 'utf8');
    if (!xml.includes('<hierarchy')) throw new Error('UI XML 不完整');
  }, { attempts: 3, waitMs: 1500, label: '读取界面' });
  return absolutePath;
}

async function screenshot(outputPath) {
  const absolutePath = resolve(outputPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await retry(
    () => $({ quiet: true })`adb ${adbSerialArgs()} exec-out screencap -p > ${absolutePath}`,
    { attempts: 2, waitMs: 800, label: '截图' },
  );
  return absolutePath;
}

function decodeXml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function parseNodes(xml) {
  return [...xml.matchAll(/<node\b[^>]*>/g)].flatMap(([tag]) => {
    const textMatch = tag.match(/\btext="([^"]*)"/);
    const boundsMatch = tag.match(/\bbounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
    if (!textMatch || !boundsMatch) return [];
    const [, x1, y1, x2, y2] = boundsMatch.map(Number);
    return [{ text: decodeXml(textMatch[1]), bounds: { x1, y1, x2, y2 } }];
  });
}

async function nodesFromXml(xmlPath) {
  return parseNodes(await readFile(resolve(xmlPath), 'utf8'));
}

async function screenSize() {
  const output = await adbText('shell', 'wm', 'size');
  const match = [...output.matchAll(/(\d+)x(\d+)/g)].at(-1);
  if (!match) throw new Error(`无法解析安卓屏幕尺寸：${output}`);
  return { width: Number(match[1]), height: Number(match[2]) };
}

function visibleNodes(nodes, targetText, { width, height }, avoidBottomOverlay = false) {
  const bottomLimit = avoidBottomOverlay ? height - 420 : height;
  return nodes.filter(({ text, bounds }) => (
    text === targetText
    && bounds.x2 > bounds.x1
    && bounds.y2 > bounds.y1
    && bounds.x1 >= 0
    && bounds.y1 >= 0
    && bounds.x2 <= width
    && bounds.y2 <= bottomLimit
  ));
}

function uniqueTexts(nodes) {
  return [...new Set(nodes.map(({ text }) => text.trim()).filter(Boolean))];
}

function shortestText(texts, predicate) {
  return texts.filter(predicate).sort((a, b) => a.length - b.length)[0] ?? null;
}

function findPlateInfo(texts) {
  const province = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼]$/;
  const number = /^[A-Z][A-Z0-9]{5,6}$/;
  const color = /^[·・]([^·・\n]{1,4})$/;
  for (let index = 0; index < texts.length - 2; index += 1) {
    if (province.test(texts[index]) && number.test(texts[index + 1]) && color.test(texts[index + 2])) {
      return {
        plate: `${texts[index]}${texts[index + 1]}`,
        color: texts[index + 2].match(color)[1],
      };
    }
  }
  return { plate: null, color: null };
}

function extractSummary(nodes) {
  const texts = uniqueTexts(nodes);
  const joined = texts.join('\n');
  const compact = joined.replace(/\s+/g, '');
  const price = compact.match(/预估(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)元(?:起)?/);
  const callCount = compact.match(/呼叫(\d+)种车型/);
  const categoryCount = compact.match(/专车[·・](\d+)/);
  const dateTime = compact.match(/(今天|明天)(\d{1,2}:\d{2})/);
  const threshold = compact.match(/实际支付金额超出(\d+(?:\.\d+)?)元的部分.*?个人支付/);
  const booked = compact.match(/预约成功，?(\d{2}月\d{2}日)(\d{1,2}:\d{2})出发/);
  const plateInfo = findPlateInfo(texts);
  const vehicle = joined.match(/([^\n·・]+出行)[·・]([^\n·・]+)[·・]([^\n]+)/);
  const driver = joined.match(/([\p{Script=Han}]{1,4}师傅)/u);
  const eta = compact.match(/(?:预计)?(\d+)分钟(?:后)?到达/);
  const distance = compact.match(/距离[^\d]*(\d+(?:\.\d+)?)(公里|米)/);

  let state = 'unknown';
  if (driver && plateInfo.plate) state = 'assigned';
  else if (booked) state = 'booked';
  else if (/正在派单|正在呼叫|寻找司机|等待司机|呼叫中/.test(compact)) state = 'searching';
  else if (/派单失败|暂无司机|呼叫失败/.test(compact)) state = 'failed';
  else if (/已取消|行程取消/.test(compact)) state = 'cancelled';
  else if (threshold) state = 'payment_warning';
  else if (callCount) state = 'pre_call';

  const defaultOrigin = '桂溪广场C栋夜间上车点';
  const defaultDestination = '人居越秀·和樾林语语澜组团(东北门)';
  const origin = compact.includes(defaultOrigin)
    ? defaultOrigin
    : shortestText(texts, (text) => text.includes('上车点'));
  const destination = compact.includes(defaultDestination)
    ? defaultDestination
    : shortestText(texts, (text) => text.includes('东北门'));

  return {
    state,
    enterprise: compact.includes('企业版'),
    origin,
    destination,
    date: dateTime?.[1] ?? booked?.[1] ?? null,
    time: dateTime?.[2] ?? booked?.[2] ?? null,
    category: compact.includes('专车') ? '专车' : null,
    providerCount: Number(callCount?.[1] ?? categoryCount?.[1]) || null,
    estimateMin: price ? Number(price[1]) : null,
    estimateMax: price ? Number(price[2]) : null,
    payment: compact.includes('本单含个付')
      ? '本单含个付'
      : compact.includes('本单为企付') ? '本单为企付' : null,
    paymentThreshold: threshold ? Number(threshold[1]) : null,
    provider: vehicle?.[1] ?? null,
    vehicleBrand: vehicle?.[2] ?? null,
    vehicleModel: vehicle?.[3]?.trim() ?? null,
    vehicleColor: plateInfo.color,
    plate: plateInfo.plate,
    driver: driver?.[1] ?? null,
    etaMinutes: eta ? Number(eta[1]) : null,
    distance: distance ? `${distance[1]}${distance[2]}` : null,
    booked: Boolean(booked),
  };
}

function humanStatus(summary) {
  return [
    `状态：${summary.state}`,
    summary.origin && `起点：${summary.origin}`,
    summary.destination && `终点：${summary.destination}`,
    (summary.date || summary.time) && `时间：${summary.date ?? ''} ${summary.time ?? ''}`.trim(),
    summary.category && `车型：${summary.category}${summary.providerCount ? ` · ${summary.providerCount} 种` : ''}`,
    summary.estimateMax !== null && `预估：${summary.estimateMin}-${summary.estimateMax} 元`,
    summary.payment && `支付：${summary.payment}`,
    summary.paymentThreshold !== null && `个人支付阈值：${summary.paymentThreshold} 元`,
    summary.provider && `平台：${summary.provider}`,
    summary.driver && `司机：${summary.driver}`,
    summary.plate && `车辆：${summary.vehicleColor ?? ''} ${summary.vehicleBrand ?? ''} ${summary.vehicleModel ?? ''} ${summary.plate}`.replace(/\s+/g, ' ').trim(),
    summary.etaMinutes !== null && `预计到达：${summary.etaMinutes} 分钟`,
    summary.distance && `距离：${summary.distance}`,
  ].filter(Boolean).join('\n');
}

async function withUiDump(callback) {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'amap-adb-'));
  try {
    const xmlPath = await dumpUi(join(temporaryDirectory, 'ui.xml'));
    return await callback(await nodesFromXml(xmlPath));
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function loadNodes() {
  return argv.xml ? nodesFromXml(String(argv.xml)) : withUiDump((nodes) => nodes);
}

async function waitForCandidates(targetText, providerCheckbox, timeoutSeconds) {
  const size = await screenSize();
  const deadline = Date.now() + timeoutSeconds * 1000;
  do {
    const candidates = await withUiDump((nodes) => visibleNodes(nodes, targetText, size, providerCheckbox));
    if (candidates.length > 0) return { candidates, size };
    if (Date.now() >= deadline) break;
    await delay(1000);
  } while (true);
  throw Object.assign(new Error(`未找到可见界面节点：${targetText}`), { exitCode: 3 });
}

async function tapCandidate(targetText, providerCheckbox, timeoutSeconds = 0) {
  const { candidates, size } = await waitForCandidates(targetText, providerCheckbox, timeoutSeconds);
  const candidate = [...candidates].sort((a, b) => b.bounds.y1 - a.bounds.y1)[0];
  const { x1, y1, x2, y2 } = candidate.bounds;
  const tapX = providerCheckbox ? size.width - 84 : Math.floor((x1 + x2) / 2);
  const tapY = Math.floor((y1 + y2) / 2);
  await adbText('shell', 'input', 'tap', String(tapX), String(tapY));
  console.log(`已点击“${targetText}”，坐标：${tapX},${tapY}`);
}

function thresholdDecision(summary, approvedMax) {
  const reasons = [];
  if (summary.state !== 'payment_warning') reasons.push('当前不是个人支付阈值弹窗');
  if (summary.estimateMax === null) reasons.push('无法读取当前预估上限');
  if (summary.paymentThreshold === null) reasons.push('无法读取个人支付阈值');
  if (summary.payment !== '本单为企付') reasons.push('当前未显示本单为企付');
  if (summary.estimateMax !== null && summary.estimateMax > approvedMax) reasons.push('当前预估上限超过用户确认上限');
  if (
    summary.estimateMax !== null
    && summary.paymentThreshold !== null
    && summary.estimateMax >= summary.paymentThreshold
  ) reasons.push('当前预估上限不低于个人支付阈值');

  return {
    decision: reasons.length === 0 ? 'continue' : 'stop',
    approvedMax,
    estimateMax: summary.estimateMax,
    paymentThreshold: summary.paymentThreshold,
    payment: summary.payment,
    reasons,
  };
}

async function main() {
  if (commandName === 'help') {
    console.log(helpText);
    return;
  }

  const offlineOnly = ['status', 'check-threshold'].includes(commandName) && argv.xml;
  if (!offlineOnly) await requireDevice();

  switch (commandName) {
    case 'screenshot': {
      if (!commandArgs[0]) throw new Error('screenshot 命令需要输出路径');
      console.log(await screenshot(commandArgs[0]));
      break;
    }
    case 'dump': {
      if (!commandArgs[0]) throw new Error('dump 命令需要输出路径');
      console.log(await dumpUi(commandArgs[0]));
      break;
    }
    case 'snapshot': {
      if (!commandArgs[0]) throw new Error('snapshot 命令需要输出前缀');
      const prefix = resolve(commandArgs[0]);
      const xmlPath = await dumpUi(`${prefix}.xml`);
      const pngPath = await screenshot(`${prefix}.png`);
      const summary = extractSummary(await nodesFromXml(xmlPath));
      console.log(JSON.stringify({ xmlPath, pngPath, summary }, null, 2));
      break;
    }
    case 'status': {
      const summary = extractSummary(await loadNodes());
      console.log(argv.json ? JSON.stringify(summary, null, 2) : humanStatus(summary));
      break;
    }
    case 'has-text': {
      const targetText = commandArgs[0];
      if (!targetText) throw new Error('has-text 命令需要准确文本');
      const timeout = numberOption(argv.timeout, 0, '--timeout');
      try {
        await waitForCandidates(targetText, false, timeout);
      } catch (error) {
        if (error.exitCode === 3) process.exitCode = 1;
        else throw error;
      }
      break;
    }
    case 'tap-text': {
      if (!commandArgs[0]) throw new Error('tap-text 命令需要准确的可见文本');
      await tapCandidate(commandArgs[0], false, numberOption(argv.timeout, 0, '--timeout'));
      break;
    }
    case 'tap-provider': {
      if (!commandArgs[0]) throw new Error('tap-provider 命令需要准确的可见供应商名称');
      await tapCandidate(commandArgs[0], true, numberOption(argv.timeout, 0, '--timeout'));
      break;
    }
    case 'check-threshold': {
      const approvedMax = numberOption(commandArgs[0], NaN, '用户上限');
      if (!Number.isFinite(approvedMax)) throw new Error('check-threshold 命令需要用户确认的价格上限');
      const decision = thresholdDecision(extractSummary(await loadNodes()), approvedMax);
      console.log(JSON.stringify(decision, null, 2));
      if (decision.decision !== 'continue') process.exitCode = 4;
      break;
    }
    case 'confirm-threshold': {
      const approvedMax = numberOption(commandArgs[0], NaN, '用户上限');
      if (!Number.isFinite(approvedMax)) throw new Error('confirm-threshold 命令需要用户确认的价格上限');
      const summary = extractSummary(await withUiDump((nodes) => nodes));
      const decision = thresholdDecision(summary, approvedMax);
      console.log(JSON.stringify(decision, null, 2));
      if (decision.decision !== 'continue') {
        process.exitCode = 4;
        break;
      }
      await tapCandidate('确认', false, 2);
      break;
    }
    case 'monitor': {
      const interval = numberOption(argv.interval, 15, '--interval');
      const timeout = numberOption(argv.timeout, 900, '--timeout');
      const deadline = Date.now() + timeout * 1000;
      let previousState;
      let lastOutputAt = 0;
      while (Date.now() <= deadline) {
        const nodes = await withUiDump((items) => items);
        const summary = extractSummary(nodes);
        const now = Date.now();
        if (summary.state !== previousState || summary.state === 'assigned' || now - lastOutputAt >= 60_000) {
          console.log(JSON.stringify({ at: new Date().toISOString(), ...summary }));
          previousState = summary.state;
          lastOutputAt = now;
        }
        if (['assigned', 'failed', 'cancelled'].includes(summary.state)) {
          if (argv.prefix) await screenshot(`${resolve(String(argv.prefix))}.png`);
          return;
        }
        await delay(interval * 1000);
      }
      throw Object.assign(new Error(`监控超时：${timeout} 秒`), { exitCode: 5 });
    }
    default:
      fail(`未知命令：${commandName}`, 64);
  }
}

try {
  await main();
} catch (error) {
  fail(error.message, error.exitCode ?? 1);
}
