const { createApp, ref, computed, onMounted } = Vue;

const SAMPLE_REPORTS = [
  {
    report: '../../../.reports/network-diagnostics/latest-report.md',
    analysis: '../../../.reports/network-diagnostics/latest-report.codex.md',
  },
];

function section(markdown, title) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${title}`);
  if (start < 0) return '';
  const endOffset = lines.slice(start + 1).findIndex((line) => line.startsWith('## '));
  const end = endOffset < 0 ? lines.length : start + 1 + endOffset;
  return lines.slice(start + 1, end).join('\n').trim();
}

function parseSummary(markdown) {
  const table = section(markdown, '快速摘要');
  const result = {};
  for (const line of table.split('\n')) {
    const columns = line.split('|').map((value) => value.trim()).filter(Boolean);
    if (columns.length !== 2 || columns[0] === '项目' || /^-+$/.test(columns[0])) continue;
    result[columns[0]] = columns[1].replace(/\*\*/g, '');
  }
  return result;
}

function parseMeta(markdown) {
  const value = (label) => markdown.match(new RegExp(`^${label}：(.+)$`, 'm'))?.[1]
    ?.replace(/`/g, '')
    .replace(/\s{2,}$/, '')
    .trim();

  return {
    collectedAt: value('采集时间'),
    interfaceName: value('Wi-Fi 接口') || value('观测终端'),
    defaultInterface: value('默认路由接口'),
    gateway: value('网关') || markdown.match(/路由器：.*?（`?([^`）]+)`?）/)?.[1],
    publicHost: value('公网测试目标'),
  };
}

function numberFrom(value, pattern) {
  const match = String(value || '').match(pattern);
  return match ? Number(match[1]) : undefined;
}

function parsePing(value) {
  return {
    loss: numberFrom(value, /丢包\s+([\d.]+)%/),
    avg: numberFrom(value, /平均\s+([\d.]+)\s*ms/),
    max: numberFrom(value, /最高\s+([\d.]+)\s*ms/),
    jitter: numberFrom(value, /抖动\s+([\d.]+)\s*ms/),
  };
}

function parseEvidence(markdown) {
  const evidenceBody = section(markdown, '原始证据');
  if (!evidenceBody) return [];

  return evidenceBody
    .split(/(?=^### )/m)
    .map((block) => block.trim())
    .filter((block) => block.startsWith('### '))
    .map((block) => {
      const title = block.match(/^### (.+)$/m)?.[1] || '未命名证据';
      const command = block.match(/^- 命令：`([^`]+)`/m)?.[1] || '未记录';
      const status = block.match(/^- 状态：(.+)$/m)?.[1] || '未知';
      const duration = block.match(/^- 用时：(.+)$/m)?.[1] || '';
      const output = block.match(/```(?:text)?\n([\s\S]*?)```/)?.[1]?.trim() || '(no output)';
      return {
        title,
        command,
        status,
        duration,
        output,
        success: status === '成功',
      };
    });
}

function parseChannels(markdown, summary) {
  const nearby = section(markdown, '附近 Wi-Fi 环境');
  const matches = [...nearby.matchAll(/Channel:\s+(\d+)\s+\((2|5)GHz,\s*(\d+)MHz\)/g)];
  const currentChannel = numberFrom(summary['信道'], /^(\d+)/);
  const groups = { '2.4 GHz': new Map(), '5 GHz': new Map() };

  for (const match of matches) {
    const label = match[2] === '2' ? '2.4 GHz' : '5 GHz';
    const channel = Number(match[1]);
    const current = groups[label].get(channel) || { channel, count: 0, widths: new Set() };
    current.count += 1;
    current.widths.add(Number(match[3]));
    groups[label].set(channel, current);
  }

  const bands = Object.entries(groups).map(([label, map]) => {
    const items = [...map.values()]
      .sort((a, b) => a.channel - b.channel)
      .map((item) => ({
        ...item,
        current: item.channel === currentChannel,
        width: Math.min(100, 28 + item.count * 24),
      }));
    return { label, items };
  });

  return {
    total: matches.length,
    bands,
    coChannel: matches.filter((match) => Number(match[1]) === currentChannel).length,
  };
}

function toneForLatency(value, local) {
  if (value === undefined) return 'neutral';
  if (local) {
    if (value <= 10) return 'good';
    if (value <= 25) return 'warning';
    return 'danger';
  }
  if (value <= 80) return 'good';
  if (value <= 160) return 'warning';
  return 'danger';
}

function buildModel(name, content, analysis = '') {
  const summary = parseSummary(content);
  const meta = parseMeta(content);
  const evidence = parseEvidence(content);
  const gateway = parsePing(summary['到网关']);
  const internet = parsePing(summary['到公网']);
  const signal = numberFrom(summary['信号 / 噪声'], /(-?\d+)\s*dBm/);
  const noiseMatches = String(summary['信号 / 噪声'] || '').match(/(-?\d+)\s*dBm\s*\/\s*(-?\d+)/);
  const noise = noiseMatches ? Number(noiseMatches[2]) : undefined;
  const snr = numberFrom(summary['信噪比'], /([\d.]+)/);
  const rate = numberFrom(summary['协商发送速率'], /([\d.]+)/);
  const duplicateIpv4 = summary['本机重复 IPv4'];
  const channels = parseChannels(content, summary);
  const issues = [];

  if (duplicateIpv4 && !/未发现|无/.test(duplicateIpv4)) {
    issues.push({
      title: '本机接口重复使用 IPv4',
      detail: duplicateIpv4,
      tone: 'danger',
      level: '高优先级',
    });
  }
  if (gateway.loss > 0 || gateway.avg > 20) {
    issues.push({
      title: '本地无线链路不稳定',
      detail: `网关丢包 ${gateway.loss ?? '未知'}%，平均延迟 ${gateway.avg ?? '未知'} ms`,
      tone: gateway.loss > 1 || gateway.avg > 40 ? 'danger' : 'warning',
      level: '链路',
    });
  }
  if (internet.avg > 100 || internet.loss > 0) {
    issues.push({
      title: '公网链路质量偏低',
      detail: `公网丢包 ${internet.loss ?? '未知'}%，平均延迟 ${internet.avg ?? '未知'} ms`,
      tone: internet.loss > 1 || internet.avg > 200 ? 'danger' : 'warning',
      level: 'WAN',
    });
  }
  if (/198\.18\./.test(content)) {
    issues.push({
      title: 'DNS 使用代理 Fake-IP',
      detail: '报告出现 198.18.0.0/15 地址，应用流量可能由本地代理接管。',
      tone: 'warning',
      level: '代理',
    });
  } else if (/HTTPEnable\s*:\s*1/.test(content)) {
    issues.push({
      title: '系统代理已启用',
      detail: '应用异常时应将代理链路作为独立变量对照测试。',
      tone: 'neutral',
      level: '代理',
    });
  }
  if (/networkQuality[\s\S]{0,260}(?:退出码|失败)/.test(content)) {
    issues.push({
      title: '公网质量测试未完成',
      detail: 'networkQuality 返回失败，带宽和响应性数据不足。',
      tone: 'warning',
      level: '证据',
    });
  }
  if (channels.coChannel > 0) {
    issues.push({
      title: '附近存在同信道网络',
      detail: `当前信道附近观察到 ${channels.coChannel} 个网络，高负载时可能产生竞争。`,
      tone: 'neutral',
      level: 'Wi-Fi',
    });
  }

  const worstTone = issues.some((item) => item.tone === 'danger')
    ? 'danger'
    : issues.some((item) => item.tone === 'warning')
      ? 'warning'
      : 'good';
  const healthMap = {
    good: { label: '状态良好', color: 'green' },
    warning: { label: '需要关注', color: 'orange' },
    danger: { label: '存在异常', color: 'red' },
  };
  const health = {
    tone: worstTone,
    ...healthMap[worstTone],
    summary: `${issues.filter((item) => item.tone !== 'neutral').length} 个诊断项`,
  };

  const signalTone = signal === undefined ? 'neutral' : signal >= -60 ? 'good' : signal >= -70 ? 'warning' : 'danger';
  const snrTone = snr === undefined ? 'neutral' : snr >= 40 ? 'good' : snr >= 25 ? 'warning' : 'danger';
  const gatewayTone = gateway.loss > 0 ? 'danger' : toneForLatency(gateway.avg, true);
  const internetTone = internet.loss > 0 ? 'danger' : toneForLatency(internet.avg, false);

  const metricCards = [
    {
      key: 'signal', label: 'Wi-Fi 信号', value: signal === undefined ? '未采集' : `${signal} dBm`,
      note: noise === undefined ? '噪声未知' : `噪声 ${noise} dBm`, rating: signalTone === 'good' ? '优秀' : signalTone === 'warning' ? '一般' : signalTone === 'danger' ? '较差' : '未知',
      tone: signalTone, icon: 'icon-wifi', percent: signal === undefined ? null : Math.max(0, Math.min(1, (signal + 90) / 60)),
    },
    {
      key: 'snr', label: '信噪比', value: snr === undefined ? '未采集' : `${snr} dB`,
      note: summary['制式'] || '无线制式未知', rating: snrTone === 'good' ? '优秀' : snrTone === 'warning' ? '一般' : snrTone === 'danger' ? '较差' : '未知',
      tone: snrTone, icon: 'icon-sound', percent: snr === undefined ? null : Math.max(0, Math.min(1, snr / 60)),
    },
    {
      key: 'gateway', label: '网关延迟', value: gateway.avg === undefined ? '未采集' : `${gateway.avg} ms`,
      note: gateway.loss === undefined ? '丢包未知' : `丢包 ${gateway.loss}%`, rating: gatewayTone === 'good' ? '稳定' : gatewayTone === 'warning' ? '波动' : gatewayTone === 'danger' ? '异常' : '未知',
      tone: gatewayTone, icon: 'icon-apps', percent: gateway.avg === undefined ? null : Math.max(0, Math.min(1, 1 - gateway.avg / 80)),
    },
    {
      key: 'internet', label: '公网延迟', value: internet.avg === undefined ? '未采集' : `${internet.avg} ms`,
      note: internet.loss === undefined ? '丢包未知' : `丢包 ${internet.loss}%`, rating: internetTone === 'good' ? '良好' : internetTone === 'warning' ? '偏高' : internetTone === 'danger' ? '异常' : '未知',
      tone: internetTone, icon: 'icon-cloud', percent: internet.avg === undefined ? null : Math.max(0, Math.min(1, 1 - internet.avg / 300)),
    },
    {
      key: 'rate', label: '协商速率', value: rate === undefined ? '未采集' : `${rate} Mbps`,
      note: `MCS ${summary.MCS || '未知'}`, rating: rate === undefined ? '未知' : rate >= 800 ? '高速' : rate >= 300 ? '正常' : '中等',
      tone: rate === undefined ? 'neutral' : rate >= 300 ? 'good' : 'warning', icon: 'icon-thunderbolt', percent: rate === undefined ? null : Math.max(0, Math.min(1, rate / 1200)),
    },
    {
      key: 'channel', label: '当前信道', value: summary['信道'] || '未采集',
      note: `${channels.total} 个附近网络`, rating: channels.coChannel ? '有竞争' : '未见重叠',
      tone: channels.coChannel ? 'warning' : 'good', icon: 'icon-apps', percent: null,
    },
  ];

  const routeNodes = [
    {
      key: 'terminal', label: '终端', value: meta.interfaceName || '接口未知',
      tone: duplicateIpv4 && !/未发现|无/.test(duplicateIpv4) ? 'danger' : 'good', icon: 'icon-computer',
    },
    {
      key: 'wifi', label: 'Wi-Fi', value: summary['制式'] || '链路未知',
      tone: signalTone === 'danger' || snrTone === 'danger' ? 'danger' : signalTone === 'warning' || snrTone === 'warning' ? 'warning' : 'good', icon: 'icon-wifi',
    },
    {
      key: 'gateway', label: '网关', value: gateway.avg === undefined ? meta.gateway || '未采集' : `${gateway.avg} ms`,
      tone: gatewayTone, icon: 'icon-apps',
    },
    {
      key: 'internet', label: '公网', value: internet.avg === undefined ? '未采集' : `${internet.avg} ms`,
      tone: internetTone, icon: 'icon-cloud',
    },
    {
      key: 'service', label: 'DNS / 服务', value: /198\.18\./.test(content) ? '代理接管' : '待应用验证',
      tone: /198\.18\./.test(content) ? 'warning' : 'neutral', icon: 'icon-link',
    },
  ];

  const title = content.match(/^# (.+)$/m)?.[1] || '网络诊断报告';
  const displayName = name.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
  return {
    id: name,
    name,
    displayName,
    title,
    content,
    analysis,
    summary,
    meta,
    evidence,
    channels,
    issues,
    health,
    metricCards,
    routeNodes,
  };
}

createApp({
  setup() {
    const reports = ref([]);
    const currentId = ref('');
    const activeTab = ref('overview');
    const rawMode = ref('rendered');
    const search = ref('');
    const dragActive = ref(false);
    const sidebarOpen = ref(false);
    const fileInput = ref(null);
    const directorySupported = 'showDirectoryPicker' in window;

    const currentReport = computed(() => reports.value.find((item) => item.id === currentId.value));
    const filteredReports = computed(() => {
      const query = search.value.trim().toLowerCase();
      return query
        ? reports.value.filter((item) => `${item.name} ${item.title}`.toLowerCase().includes(query))
        : reports.value;
    });

    function upsertReport(name, content, analysis = '') {
      const id = name.replace(/\.codex\.md$/i, '.md');
      const index = reports.value.findIndex((item) => item.id === id);
      const existing = index >= 0 ? reports.value[index] : null;
      const model = buildModel(id, content || existing?.content || analysis, analysis || existing?.analysis || '');
      if (index >= 0) reports.value.splice(index, 1, model);
      else reports.value.unshift(model);
      currentId.value = id;
    }

    async function importFiles(files) {
      const markdownFiles = [...files].filter((file) => file.name.toLowerCase().endsWith('.md'));
      const contents = new Map();
      await Promise.all(markdownFiles.map(async (file) => contents.set(file.name, await file.text())));

      for (const file of markdownFiles.filter((item) => !item.name.endsWith('.codex.md'))) {
        const analysisName = file.name.replace(/\.md$/i, '.codex.md');
        upsertReport(file.name, contents.get(file.name), contents.get(analysisName) || '');
      }

      for (const file of markdownFiles.filter((item) => item.name.endsWith('.codex.md'))) {
        const reportName = file.name.replace(/\.codex\.md$/i, '.md');
        const existing = reports.value.find((item) => item.id === reportName);
        if (contents.has(reportName)) continue;
        upsertReport(reportName, existing?.content || contents.get(file.name), contents.get(file.name));
      }

      activeTab.value = 'overview';
      sidebarOpen.value = false;
    }

    function openFilePicker() {
      fileInput.value?.click();
    }

    async function onFileChange(event) {
      await importFiles(event.target.files || []);
      event.target.value = '';
    }

    async function onDrop(event) {
      dragActive.value = false;
      await importFiles(event.dataTransfer?.files || []);
    }

    async function openDirectory() {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'read' });
        const files = [];
        for await (const entry of handle.values()) {
          if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.md')) {
            files.push(await entry.getFile());
          }
        }
        await importFiles(files);
      } catch (error) {
        if (error?.name !== 'AbortError') console.error(error);
      }
    }

    function selectReport(id) {
      currentId.value = id;
      activeTab.value = 'overview';
      sidebarOpen.value = false;
    }

    function renderMarkdown(content) {
      if (!content) return '';
      const html = marked.parse(content, { gfm: true, breaks: false });
      return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }

    function toneColor(tone) {
      return { good: '#16865b', warning: '#c77816', danger: '#c83c3c', neutral: '#2468b4' }[tone];
    }

    function toneTagColor(tone) {
      return { good: 'green', warning: 'orange', danger: 'red', neutral: 'blue' }[tone];
    }

    async function loadSamples() {
      for (const sample of SAMPLE_REPORTS) {
        try {
          const response = await fetch(sample.report);
          if (!response.ok) continue;
          const content = await response.text();
          let analysis = '';
          if (sample.analysis) {
            const analysisResponse = await fetch(sample.analysis);
            if (analysisResponse.ok) analysis = await analysisResponse.text();
          }
          upsertReport(sample.report.split('/').pop(), content, analysis);
        } catch (_) {
          // Local file mode cannot fetch sibling files; the file picker remains available.
        }
      }
    }

    onMounted(loadSamples);

    return {
      reports,
      currentReport,
      filteredReports,
      activeTab,
      rawMode,
      search,
      dragActive,
      sidebarOpen,
      fileInput,
      directorySupported,
      openFilePicker,
      onFileChange,
      onDrop,
      openDirectory,
      selectReport,
      renderMarkdown,
      toneColor,
      toneTagColor,
    };
  },
})
  .use(ArcoVue)
  .use(ArcoVueIcon)
  .mount('#app');
