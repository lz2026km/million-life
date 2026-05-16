/**
 * 百万人生体彩统计分析图表
 * 8项统计分析图表功能
 * 数据来源: SSQ_DATA (双色球), DLT_DATA (大乐透)
 */

// 配色方案
const COLORS = {
  bg: '#f5f7fa',
  mint: '#4ecdc4',
  coral: '#ff6b6b',
  blue: '#5b8def',
  text: '#2d3748',
  textLight: '#718096',
  grid: '#e2e8f0',
  hot: '#ff6b6b',
  cold: '#5b8def'
};

/**
 * 工具函数: 计算号码出现频率
 */
function calcFrequency(data, type) {
  const freq = {};
  const maxNum = type === 'ssq' ? 33 : 35;
  for (let i = 1; i <= maxNum; i++) freq[i] = 0;
  
  data.forEach(item => {
    if (type === 'ssq') {
      item.r.forEach(n => { if (freq[n] !== undefined) freq[n]++; });
    } else {
      item.f.forEach(n => { if (freq[n] !== undefined) freq[n]++; });
    }
  });
  return freq;
}

/**
 * 工具函数: 计算遗漏值
 */
function calcMiss(data, type) {
  const miss = {};
  const maxNum = type === 'ssq' ? 33 : 35;
  for (let i = 1; i <= maxNum; i++) miss[i] = 0;
  
  data.forEach((item, idx) => {
    if (type === 'ssq') {
      item.r.forEach(n => { if (miss[n] !== undefined) miss[n] = idx + 1; });
    } else {
      item.f.forEach(n => { if (miss[n] !== undefined) miss[n] = idx + 1; });
    }
  });
  return miss;
}

/**
 * 工具函数: 创建SVG外层容器
 */
function createSVG(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background:${COLORS.bg};border-radius:8px;">`;
}

/**
 * 工具函数: 绘制柱状
 */
function makeBar(x, y, w, h, color, rx = 4) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" rx="${rx}" ry="${rx}"/>`;
}

/**
 * 工具函数: 绘制文字
 */
function makeText(text, x, y, size = 12, color = COLORS.text, anchor = 'middle') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" dominant-baseline="middle" font-family="sans-serif">${text}</text>`;
}

// ========== 功能1: 热号统计 - TOP10热号柱状图 ==========
function renderHotChart(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const freq = calcFrequency(data, type);
  
  const sorted = Object.entries(freq)
    .map(([num, count]) => ({ num: +num, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  const width = 420, height = 300;
  const padding = { top: 30, right: 20, bottom: 50, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = chartW / 10 - 8;
  
  const maxCount = sorted[0]?.count || 1;
  const barHScale = chartH / maxCount;
  
  let svg = createSVG(width, height);
  svg += `<g transform="translate(${padding.left},${padding.top})">`;
  
  // Y轴网格线
  for (let i = 0; i <= 4; i++) {
    const y = chartH - (i / 4) * chartH;
    const val = Math.round((i / 4) * maxCount);
    svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1"/>`;
    svg += makeText(val, -10, y, 10, COLORS.textLight, 'end');
  }
  
  // 柱状图
  sorted.forEach((item, i) => {
    const x = i * (barW + 8) + 4;
    const barH = item.count * barHScale;
    const y = chartH - barH;
    
    svg += makeBar(x, y, barW, barH, COLORS.hot);
    svg += makeText(item.num, x + barW / 2, y - 8, 11, COLORS.text);
    svg += makeText(item.count, x + barW / 2, y + barH / 2, 10, '#fff');
  });
  
  svg += `</g>`;
  svg += makeText('热号 TOP10', width / 2, 18, 14, COLORS.text);
  svg += makeText('出现次数', 18, height - 8, 10, COLORS.textLight, 'start');
  svg += `</svg>`;
  
  return svg;
}

// ========== 功能2: 冷号统计 - TOP10冷号柱状图 ==========
function renderColdChart(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const freq = calcFrequency(data, type);
  
  const sorted = Object.entries(freq)
    .map(([num, count]) => ({ num: +num, count }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 10);
  
  const width = 420, height = 300;
  const padding = { top: 30, right: 20, bottom: 50, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = chartW / 10 - 8;
  
  const maxCount = sorted[0]?.count || 1;
  const barHScale = chartH / maxCount;
  
  let svg = createSVG(width, height);
  svg += `<g transform="translate(${padding.left},${padding.top})">`;
  
  for (let i = 0; i <= 4; i++) {
    const y = chartH - (i / 4) * chartH;
    const val = Math.round((i / 4) * maxCount);
    svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1"/>`;
    svg += makeText(val, -10, y, 10, COLORS.textLight, 'end');
  }
  
  sorted.forEach((item, i) => {
    const x = i * (barW + 8) + 4;
    const barH = Math.max(item.count * barHScale, 2);
    const y = chartH - barH;
    
    svg += makeBar(x, y, barW, barH, COLORS.cold);
    svg += makeText(item.num, x + barW / 2, y - 8, 11, COLORS.text);
    svg += makeText(item.count, x + barW / 2, y + barH / 2, 10, '#fff');
  });
  
  svg += `</g>`;
  svg += makeText('冷号 TOP10', width / 2, 18, 14, COLORS.text);
  svg += makeText('出现次数', 18, height - 8, 10, COLORS.textLight, 'start');
  svg += `</svg>`;
  
  return svg;
}

// ========== 功能3: 遗漏值分析 - 遗漏值排行榜表格 ==========
function renderMissTable(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const miss = calcMiss(data, type);
  
  const sorted = Object.entries(miss)
    .map(([num, val]) => ({ num: +num, miss: val }))
    .sort((a, b) => b.miss - a.miss)
    .slice(0, 20);
  
  const width = 380, height = 420;
  const rowH = 20;
  const colW = [60, 100, 80, 100];
  
  let svg = createSVG(width, height);
  
  // 表头
  svg += `<rect x="0" y="0" width="${width}" height="${rowH}" fill="${COLORS.mint}" rx="4"/>`;
  svg += makeText('排名', colW[0] / 2, rowH / 2, 11, '#fff');
  svg += makeText('号码', colW[0] + colW[1] / 2, rowH / 2, 11, '#fff');
  svg += makeText('遗漏值', colW[0] + colW[1] + colW[2] / 2, rowH / 2, 11, '#fff');
  svg += makeText('状态', colW[0] + colW[1] + colW[2] + colW[3] / 2, rowH / 2, 11, '#fff');
  
  sorted.forEach((item, i) => {
    const y = (i + 1) * rowH;
    const bgColor = i % 2 === 0 ? '#fff' : COLORS.bg;
    svg += `<rect x="0" y="${y}" width="${width}" height="${rowH}" fill="${bgColor}"/>`;
    svg += makeText(i + 1, colW[0] / 2, y + rowH / 2, 10, COLORS.text);
    svg += makeText(item.num, colW[0] + colW[1] / 2, y + rowH / 2, 11, COLORS.hot, 'middle');
    svg += makeText(item.miss, colW[0] + colW[1] + colW[2] / 2, y + rowH / 2, 11, COLORS.text);
    svg += makeText(item.miss > 15 ? '⏰ 冷藏' : '✓ 正常', colW[0] + colW[1] + colW[2] + colW[3] / 2, y + rowH / 2, 10, item.miss > 15 ? COLORS.coral : COLORS.mint);
  });
  
  svg += makeText(`遗漏值排行榜 (共${data.length}期)`, width / 2, 16, 12, COLORS.text);
  svg += `</svg>`;
  
  return svg;
}

// ========== 功能4: 频率排行榜 - 所有号码出现频率排行 ==========
function renderFreqTable(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const freq = calcFrequency(data, type);
  
  const sorted = Object.entries(freq)
    .map(([num, count]) => ({ num: +num, count }))
    .sort((a, b) => b.count - a.count);
  
  const maxCount = sorted[0]?.count || 1;
  const rows = sorted.length;
  const width = 420, height = Math.min(500, rows * 18 + 50);
  const rowH = 18;
  const barMaxW = 280;
  
  let svg = createSVG(width, height);
  svg += makeText(`频率排行榜 (共${data.length}期)`, width / 2, 18, 13, COLORS.text);
  
  sorted.forEach((item, i) => {
    const y = 30 + i * rowH;
    const barW = (item.count / maxCount) * barMaxW;
    
    svg += makeText(item.num, 30, y + rowH / 2, 10, COLORS.text, 'end');
    svg += makeBar(40, y + 4, barW, 10, COLORS.mint);
    svg += makeText(item.count, 45 + barW, y + rowH / 2, 9, COLORS.textLight, 'start');
  });
  
  svg += `</svg>`;
  return svg;
}

// ========== 功能5: 奇偶比例分布 - 饼图 ==========
function renderOddEvenChart(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  
  const ratios = {};
  data.forEach(item => {
    const nums = type === 'ssq' ? item.r : item.f;
    const odd = nums.filter(n => n % 2 === 1).length;
    const even = nums.length - odd;
    const key = `${odd}:${even}`;
    ratios[key] = (ratios[key] || 0) + 1;
  });
  
  const total = data.length;
  const entries = Object.entries(ratios).sort((a, b) => b[1] - a[1]);
  
  const cx = 150, cy = 150, r = 100;
  let startAngle = -90;
  
  const pieColors = [COLORS.mint, COLORS.coral, COLORS.blue, '#f9ca24', '#6ab04c', '#eb4d4b'];
  
  let svg = createSVG(340, 320);
  svg += makeText('奇偶比例分布', 170, 20, 14, COLORS.text);
  
  let pathData = '';
  entries.forEach(([ratio, count], i) => {
    const angle = (count / total) * 360;
    const endAngle = startAngle + angle;
    
    const x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
    const y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
    const x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
    const y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    if (angle >= 360) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${pieColors[i % pieColors.length]}"/>`;
    } else {
      svg += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${pieColors[i % pieColors.length]}"/>`;
    }
    
    const labelAngle = (startAngle + angle / 2) * Math.PI / 180;
    const labelR = r + 25;
    const lx = cx + labelR * Math.cos(labelAngle);
    const ly = cy + labelR * Math.sin(labelAngle);
    
    const pct = ((count / total) * 100).toFixed(1);
    svg += makeText(`${ratio} (${pct}%)`, lx, ly, 10, COLORS.text);
    
    startAngle = endAngle;
  });
  
  // 图例
  entries.slice(0, 6).forEach(([ratio, count], i) => {
    const y = 290 + i * 14;
    const pct = ((count / total) * 100).toFixed(1);
    svg += `<rect x="250" y="${y - 6}" width="10" height="10" fill="${pieColors[i % pieColors.length]}" rx="2"/>`;
    svg += makeText(`${ratio}: ${pct}%`, 265, y, 9, COLORS.text, 'start');
  });
  
  svg += `</svg>`;
  return svg;
}

// ========== 功能6: 区间分布热力图 ==========
function renderZoneHeatmap(type = 'ssq', zoneCount = 3) {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const maxNum = type === 'ssq' ? 33 : 35;
  const zoneSize = Math.ceil(maxNum / zoneCount);
  
  // 统计每个区间每期出现次数
  const zoneData = [];
  for (let i = 0; i < zoneCount; i++) {
    zoneData.push(new Array(data.length).fill(0));
  }
  
  data.forEach((item, periodIdx) => {
    const nums = type === 'ssq' ? item.r : item.f;
    nums.forEach(n => {
      const zoneIdx = Math.min(Math.floor((n - 1) / zoneSize), zoneCount - 1);
      zoneData[zoneIdx][periodIdx]++;
    });
  });
  
  const width = 500, height = 280;
  const padding = { top: 50, right: 20, bottom: 30, left: 50 };
  const cellW = (width - padding.left - padding.right) / data.length;
  const cellH = (height - padding.top - padding.bottom) / zoneCount;
  
  const maxInZone = Math.max(...zoneData.map(z => Math.max(...z)));
  
  let svg = createSVG(width, height);
  svg += makeText(`区间分布热力图 (${zoneCount}区, 共${data.length}期)`, width / 2, 20, 13, COLORS.text);
  
  for (let z = 0; z < zoneCount; z++) {
    const zoneLabel = `${z * zoneSize + 1}-${Math.min((z + 1) * zoneSize, maxNum)}`;
    svg += makeText(zoneLabel, padding.left - 5, padding.top + z * cellH + cellH / 2, 10, COLORS.textLight, 'end');
    
    for (let p = 0; p < Math.min(data.length, 60); p++) {
      const val = zoneData[z][p];
      const intensity = val / (maxInZone || 1);
      const color = `rgba(78, 205, 196, ${0.2 + intensity * 0.8})`;
      const x = padding.left + p * cellW;
      const y = padding.top + z * cellH;
      svg += `<rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 1}" fill="${color}" rx="2"/>`;
    }
  }
  
  svg += makeText('最近60期 →', width - padding.right, height - 8, 9, COLORS.textLight, 'end');
  svg += `</svg>`;
  
  return svg;
}

// ========== 功能7: 尾数频率 - 0-9各尾数出现次数柱状图 ==========
function renderTailFreqChart(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const tailFreq = {};
  for (let i = 0; i < 10; i++) tailFreq[i] = 0;
  
  data.forEach(item => {
    const nums = type === 'ssq' ? item.r : item.f;
    nums.forEach(n => {
      const tail = n % 10;
      tailFreq[tail]++;
    });
  });
  
  const width = 400, height = 280;
  const padding = { top: 40, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = chartW / 10 - 10;
  
  const maxCount = Math.max(...Object.values(tailFreq));
  const barHScale = chartH / maxCount;
  
  let svg = createSVG(width, height);
  svg += `<g transform="translate(${padding.left},${padding.top})">`;
  
  for (let i = 0; i <= 4; i++) {
    const y = chartH - (i / 4) * chartH;
    const val = Math.round((i / 4) * maxCount);
    svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1"/>`;
    svg += makeText(val, -8, y, 9, COLORS.textLight, 'end');
  }
  
  Object.entries(tailFreq).forEach(([tail, count], i) => {
    const x = i * (barW + 10) + 5;
    const barH = count * barHScale;
    const y = chartH - barH;
    
    const color = i % 2 === 0 ? COLORS.mint : COLORS.coral;
    svg += makeBar(x, y, barW, barH, color);
    svg += makeText(tail, x + barW / 2, y - 8, 12, COLORS.text);
    svg += makeText(count, x + barW / 2, y + barH / 2, 9, '#fff');
  });
  
  svg += `</g>`;
  svg += makeText('尾数频率分布', width / 2, 22, 14, COLORS.text);
  svg += makeText('尾数', width / 2, height - 5, 10, COLORS.textLight);
  svg += `</svg>`;
  
  return svg;
}

// ========== 功能8: 和值走势 - 最近30期和值折线图 ==========
function renderSumTrendChart(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const recentData = data.slice(0, 30).reverse();
  
  const sums = recentData.map(item => {
    const nums = type === 'ssq' ? item.r : item.f;
    return nums.reduce((a, b) => a + b, 0);
  });
  
  const minSum = Math.min(...sums);
  const maxSum = Math.max(...sums);
  const range = maxSum - minSum || 1;
  
  const width = 480, height = 280;
  const padding = { top: 40, right: 30, bottom: 50, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const xStep = chartW / (sums.length - 1);
  const yScale = chartH / range;
  
  let svg = createSVG(width, height);
  svg += `<g transform="translate(${padding.left},${padding.top})">`;
  
  // 网格
  for (let i = 0; i <= 5; i++) {
    const y = chartH - (i / 5) * chartH;
    const val = Math.round(minSum + (i / 5) * range);
    svg += `<line x1="0" y1="${y}" x2="${chartW}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1"/>`;
    svg += makeText(val, -10, y, 9, COLORS.textLight, 'end');
  }
  
  // 折线
  let pathD = '';
  sums.forEach((sum, i) => {
    const x = i * xStep;
    const y = chartH - (sum - minSum) * yScale;
    pathD += (i === 0 ? `M${x},${y}` : ` L${x},${y}`);
  });
  
  svg += `<path d="${pathD}" fill="none" stroke="${COLORS.mint}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  
  // 数据点
  sums.forEach((sum, i) => {
    const x = i * xStep;
    const y = chartH - (sum - minSum) * yScale;
    svg += `<circle cx="${x}" cy="${y}" r="4" fill="${COLORS.mint}"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`;
  });
  
  svg += `</g>`;
  svg += makeText('和值走势 (近30期)', width / 2, 20, 14, COLORS.text);
  svg += makeText(`均值:${Math.round(sums.reduce((a,b)=>a+b,0)/sums.length)}`, width - 20, 20, 10, COLORS.textLight, 'end');
  svg += makeText('期号 →', width / 2, height - 8, 10, COLORS.textLight);
  svg += `</svg>`;
  
  return svg;
}

// 导出所有函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderHotChart,
    renderColdChart,
    renderMissTable,
    renderFreqTable,
    renderOddEvenChart,
    renderZoneHeatmap,
    renderTailFreqChart,
    renderSumTrendChart
  };
}
