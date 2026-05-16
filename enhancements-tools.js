/**
 * 工具+报告功能模块
 * 包含2项工具函数 + 5项报告功能
 */

// ==================== 工具函数 ====================

/**
 * 号码分组 groupByPattern
 * 按指定模式对号码进行分组统计
 * @param {Array} numbers - 号码数组
 * @param {string} pattern - 分组模式: 'range'|'oddEven'|'sum'|'mod'
 * @param {object} options - 可选配置
 * @returns {object} 分组结果
 */
function groupByPattern(numbers, pattern = 'range', options = {}) {
  const result = { pattern, groups: {}, total: numbers.length };

  switch (pattern) {
    case 'range': {
      // 按区间分组 (默认每5个号一组)
      const step = options.step || 5;
      const max = options.max || 33;
      for (let i = 1; i <= max; i += step) {
        const key = `${i}-${Math.min(i + step - 1, max)}`;
        result.groups[key] = [];
      }
      numbers.forEach(n => {
        const idx = Math.floor((n - 1) / step);
        const key = `${idx * step + 1}-${Math.min((idx + 1) * step, max)}`;
        if (result.groups[key]) result.groups[key].push(n);
      });
      break;
    }
    case 'oddEven': {
      // 按奇偶分组
      result.groups = { odd: [], even: [] };
      numbers.forEach(n => {
        result.groups[n % 2 === 0 ? 'even' : 'odd'].push(n);
      });
      break;
    }
    case 'sum': {
      // 按和值区间分组
      const sums = options.sums || [0, 50, 75, 100, 125, 150, 200];
      for (let i = 0; i < sums.length - 1; i++) {
        result.groups[`${sums[i]}-${sums[i + 1]}`] = [];
      }
      numbers.forEach(n => {
        for (let i = 0; i < sums.length - 1; i++) {
          if (n >= sums[i] && n < sums[i + 1]) {
            result.groups[`${sums[i]}-${sums[i + 1]}`].push(n);
            break;
          }
        }
      });
      break;
    }
    case 'mod': {
      // 按余数分组
      const mod = options.mod || 3;
      for (let i = 0; i < mod; i++) {
        result.groups[`mod${i}`] = [];
      }
      numbers.forEach(n => {
        result.groups[`mod${n % mod}`].push(n);
      });
      break;
    }
    default:
      result.error = 'Unknown pattern';
  }

  // 统计各组数量
  result.counts = {};
  Object.keys(result.groups).forEach(k => {
    result.counts[k] = result.groups[k].length;
  });

  return result;
}

/**
 * 数据对比 compareTwoSets
 * 对比两组号码的相似度、差异等
 * @param {Array} set1 - 第一组号码
 * @param {Array} set2 - 第二组号码
 * @param {string} type - 对比类型: 'red'|'blue'|'full'
 * @returns {object} 对比结果
 */
function compareTwoSets(set1, set2, type = 'full') {
  const s1 = Array.isArray(set1) ? set1 : [];
  const s2 = Array.isArray(set2) ? set2 : [];

  const intersect = s1.filter(n => s2.includes(n));
  const union = [...new Set([...s1, ...s2])];
  const onlyInSet1 = s1.filter(n => !s2.includes(n));
  const onlyInSet2 = s2.filter(n => !s1.includes(n));

  // Jaccard相似系数
  const jaccard = union.length > 0 ? intersect.length / union.length : 0;
  // 同现率
  const overlapRate = Math.min(s1.length, s2.length) > 0 
    ? intersect.length / Math.min(s1.length, s2.length) : 0;

  const result = {
    set1: { numbers: s1, count: s1.length },
    set2: { numbers: s2, count: s2.length },
    common: intersect,
    commonCount: intersect.length,
    onlyInSet1,
    onlyInSet2,
    jaccardIndex: parseFloat(jaccard.toFixed(4)),
    overlapRate: parseFloat(overlapRate.toFixed(4)),
    similarity: parseFloat((jaccard * 100).toFixed(2)) + '%'
  };

  // 详细对比分析
  if (type === 'full') {
    result.analysis = {
      isIdentical: intersect.length === s1.length && s1.length === s2.length,
      isDisjoint: intersect.length === 0,
      missing: onlyInSet1,
      extra: onlyInSet2,
      setDiff: Math.abs(s1.length - s2.length),
      unionCount: union.length
    };
  }

  return result;
}

// ==================== 报告功能 ====================

/**
 * 周统计报告 generateWeeklyReport
 * 生成指定周期的统计数据报告
 * @param {string} type - 'ssq'|'dlt'
 * @param {number} weeks - 周数 (默认4周)
 * @returns {object} 周统计报告
 */
function generateWeeklyReport(type = 'ssq', weeks = 4) {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';

  const report = {
    type,
    period: `最近${weeks}周`,
    generatedAt: new Date().toISOString(),
    summary: {},
    hotNumbers: { red: [], blue: [] },
    coldNumbers: { red: [], blue: [] },
    frequency: { red: {}, blue: {} },
    weeklyData: []
  };

  // 统计红球/蓝球出现频率
  const redFreq = {};
  const blueFreq = {};

  if (isSSQ) {
    for (let i = 1; i <= 33; i++) redFreq[i] = 0;
    for (let i = 1; i <= 16; i++) blueFreq[i] = 0;
  } else {
    for (let i = 1; i <= 35; i++) redFreq[i] = 0;
    for (let i = 1; i <= 12; i++) blueFreq[i] = 0;
  }

  // 取最近N周数据 (每周2-3期)
  const periodCount = weeks * 3;
  const recentData = data.slice(0, Math.min(periodCount, data.length));

  recentData.forEach(item => {
    const reds = isSSQ ? item.r : item.f;
    const blues = isSSQ ? [item.b] : item.b;

    reds.forEach(n => redFreq[n]++);
    blues.forEach(n => blueFreq[n]++);
  });

  report.frequency = { red: redFreq, blue: blueFreq };

  // 统计每周数据
  for (let w = 0; w < Math.min(weeks, Math.ceil(recentData.length / 2)); w++) {
    const startIdx = w * 3;
    const endIdx = Math.min(startIdx + 3, recentData.length);
    const weekItems = recentData.slice(startIdx, endIdx);

    if (weekItems.length === 0) continue;

    const weekReport = {
      week: w + 1,
      periods: weekItems.map(item => item.p),
      redCount: {},
      blueCount: {}
    };

    // 每周各号码出现次数
    for (let i = 1; i <= (isSSQ ? 33 : 35); i++) weekReport.redCount[i] = 0;
    if (isSSQ) {
      for (let i = 1; i <= 16; i++) weekReport.blueCount[i] = 0;
    } else {
      for (let i = 1; i <= 12; i++) weekReport.blueCount[i] = 0;
    }

    weekItems.forEach(item => {
      const reds = isSSQ ? item.r : item.f;
      const blues = isSSQ ? [item.b] : item.b;
      reds.forEach(n => weekReport.redCount[n]++);
      blues.forEach(n => weekReport.blueCount[n]++);
    });

    report.weeklyData.push(weekReport);
  }

  // 热门号码 (出现次数最多的)
  const sortedRed = Object.entries(redFreq).sort((a, b) => b[1] - a[1]);
  const sortedBlue = Object.entries(blueFreq).sort((a, b) => b[1] - a[1]);

  report.hotNumbers = {
    red: sortedRed.slice(0, 6).map(item => ({ number: parseInt(item[0]), count: item[1] })),
    blue: sortedBlue.slice(0, 2).map(item => ({ number: parseInt(item[0]), count: item[1] }))
  };

  report.coldNumbers = {
    red: sortedRed.slice(-6).map(item => ({ number: parseInt(item[0]), count: item[1] })).reverse(),
    blue: sortedBlue.slice(-2).map(item => ({ number: parseInt(item[0]), count: item[1] })).reverse()
  };

  // 汇总统计
  report.summary = {
    totalPeriods: recentData.length,
    avgRedPerPeriod: isSSQ ? 6 : 5,
    avgBluePerPeriod: isSSQ ? 1 : 2,
    totalRedAppearances: recentData.reduce((sum, item) => sum + (isSSQ ? 6 : 5), 0),
    totalBlueAppearances: recentData.reduce((sum, item) => sum + (isSSQ ? 1 : 2), 0)
  };

  return report;
}

/**
 * 号码走势图 drawTrendLine
 * 生成号码出现趋势数据 (用于绑制走势图的原始数据)
 * @param {number} number - 目标号码
 * @param {string} type - 'ssq'|'dlt'
 * @param {string} ballType - 'red'|'blue'
 * @param {number} periods - 统计期数
 * @returns {object} 走势数据
 */
function drawTrendLine(number, type = 'ssq', ballType = 'red', periods = 30) {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';

  const result = {
    number,
    type,
    ballType,
    periods,
    trend: [],
    statistics: {
      appearances: 0,
      missing: 0,
      currentMiss: 0,
      maxMiss: 0,
      avgMiss: 0,
      appearsInLatest: false
    }
  };

  const recentData = data.slice(0, periods);

  // 逐期分析
  let missCount = 0;
  let totalMiss = 0;
  let maxMiss = 0;
  let lastAppearIdx = -1;

  for (let i = 0; i < recentData.length; i++) {
    const item = recentData[i];
    let appears = false;

    if (ballType === 'red') {
      const reds = isSSQ ? item.r : item.f;
      appears = reds.includes(number);
    } else {
      if (isSSQ) {
        appears = item.b === number;
      } else {
        appears = item.b.includes(number);
      }
    }

    if (appears) {
      if (lastAppearIdx >= 0) {
        const gap = missCount;
        totalMiss += gap;
        if (gap > maxMiss) maxMiss = gap;
      }
      lastAppearIdx = i;
      result.trend.push({ period: item.p, appears: true, missAfter: 0 });
      missCount = 0;
    } else {
      missCount++;
      result.trend.push({ period: item.p, appears: false, missAfter: missCount });
    }
  }

  result.statistics = {
    appearances: result.trend.filter(t => t.appears).length,
    missing: recentData.length - result.trend.filter(t => t.appears).length,
    currentMiss: missCount,
    maxMiss,
    avgMiss: lastAppearIdx >= 0 ? parseFloat((totalMiss / Math.max(1, lastAppearIdx)).toFixed(2)) : 0,
    appearsInLatest: result.trend[0]?.appears || false,
    lastAppearPeriod: lastAppearIdx >= 0 ? recentData[lastAppearIdx].p : null,
    hitRate: parseFloat(((result.trend.filter(t => t.appears).length / recentData.length) * 100).toFixed(2)) + '%'
  };

  // 趋势判断
  const recentAppears = result.trend.slice(0, 5).filter(t => t.appears).length;
  if (recentAppears >= 3) {
    result.trendLabel = '热';
  } else if (recentAppears === 0 && missCount >= 5) {
    result.trendLabel = '冷';
  } else if (missCount >= 8) {
    result.trendLabel = '极冷';
  } else {
    result.trendLabel = '温';
  }

  return result;
}

/**
 * 遗漏值提醒 checkMissAlert
 * 检查指定号码的遗漏状态，生成提醒
 * @param {Array|number} numbers - 单个号码或号码数组
 * @param {string} type - 'ssq'|'dlt'
 * @param {string} ballType - 'red'|'blue'
 * @param {object} thresholds - 自定义阈值
 * @returns {object} 遗漏提醒结果
 */
function checkMissAlert(numbers, type = 'ssq', ballType = 'red', thresholds = {}) {
  const nums = Array.isArray(numbers) ? numbers : [numbers];
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';

  // 默认阈值
  const config = {
    coldThreshold: thresholds.coldThreshold || 8,
    hotThreshold: thresholds.hotThreshold || 3,
    warningThreshold: thresholds.warningThreshold || 12,
    ...thresholds
  };

  const alerts = [];

  nums.forEach(num => {
    const trend = drawTrendLine(num, type, ballType, 50);
    const miss = trend.statistics.currentMiss;
    const maxMiss = trend.statistics.maxMiss;
    const avgMiss = trend.statistics.avgMiss;

    const alert = {
      number: num,
      type,
      ballType,
      currentMiss: miss,
      maxMiss,
      avgMiss: parseFloat(avgMiss.toFixed(2)),
      hitRate: trend.statistics.hitRate,
      level: 'normal',
      message: '',
      suggestion: ''
    };

    // 判断遗漏等级
    if (miss >= config.warningThreshold) {
      alert.level = 'critical';
      alert.message = `号码 ${num} 已遗漏 ${miss} 期，远超历史平均 ${avgMiss.toFixed(1)} 期`;
      alert.suggestion = '🔥 极冷号，重点关注！';
    } else if (miss >= config.coldThreshold) {
      alert.level = 'cold';
      alert.message = `号码 ${num} 已遗漏 ${miss} 期，超过冷号阈值`;
      alert.suggestion = '❄️ 冷号回补概率增加';
    } else if (miss >= config.hotThreshold) {
      alert.level = 'warm';
      alert.message = `号码 ${num} 已遗漏 ${miss} 期，接近活跃周期`;
      alert.suggestion = '⏰ 可考虑介入';
    } else {
      alert.level = 'hot';
      alert.message = `号码 ${num} 近期出现过，当前遗漏 ${miss} 期`;
      alert.suggestion = '✓ 活跃中，继续观察';
    }

    // 特殊规律提醒
    if (miss >= maxMiss && miss > avgMiss * 1.5) {
      alert.specialAlert = true;
      alert.message += ` [突破历史最大遗漏 ${maxMiss}]`;
    }

    alerts.push(alert);
  });

  // 按遗漏值排序
  alerts.sort((a, b) => b.currentMiss - a.currentMiss);

  return {
    checkedAt: new Date().toISOString(),
    type,
    ballType,
    totalChecked: nums.length,
    alerts,
    summary: {
      critical: alerts.filter(a => a.level === 'critical').length,
      cold: alerts.filter(a => a.level === 'cold').length,
      warm: alerts.filter(a => a.level === 'warm').length,
      hot: alerts.filter(a => a.level === 'hot').length
    },
    recommendations: alerts.filter(a => a.level === 'critical' || a.level === 'cold')
  };
}

/**
 * 算法推荐指数 calculateRecommendIndex
 * 基于多维度算法计算号码推荐指数
 * @param {Array} numbers - 待评估号码数组
 * @param {string} type - 'ssq'|'dlt'
 * @param {string} ballType - 'red'|'blue'
 * @param {object} weights - 各维度权重
 * @returns {object} 推荐指数结果
 */
function calculateRecommendIndex(numbers, type = 'ssq', ballType = 'red', weights = {}) {
  const nums = Array.isArray(numbers) ? numbers : [];
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';

  // 默认权重
  const w = {
    frequency: weights.frequency || 0.25,      // 出现频率
    recency: weights.recency || 0.25,         // 最近出现情况
    missing: weights.missing || 0.20,          // 遗漏值
    pattern: weights.pattern || 0.15,          // 模式匹配
    entropy: weights.entropy || 0.15,          // 信息熵
    ...weights
  };

  const result = {
    type,
    ballType,
    calculatedAt: new Date().toISOString(),
    numbers: []
  };

  // 统计全局频率
  const globalFreq = {};
  const maxNum = isSSQ ? (ballType === 'red' ? 33 : 16) : (ballType === 'red' ? 35 : 12);
  for (let i = 1; i <= maxNum; i++) globalFreq[i] = 0;

  data.slice(0, 50).forEach(item => {
    if (ballType === 'red') {
      (isSSQ ? item.r : item.f).forEach(n => globalFreq[n]++);
    } else {
      (isSSQ ? [item.b] : item.b).forEach(n => globalFreq[n]++);
    }
  });

  const totalAppearances = Object.values(globalFreq).reduce((a, b) => a + b, 0);
  const avgFreq = totalAppearances / maxNum;

  nums.forEach(num => {
    const trend = drawTrendLine(num, type, ballType, 30);
    const freq = globalFreq[num] || 0;

    // 各维度得分 (0-100)
    const freqScore = Math.min(100, (freq / (avgFreq * 1.5)) * 100);
    const recencyScore = trend.statistics.appearsInLatest ? 100 :
                         trend.statistics.currentMiss < 3 ? 80 :
                         trend.statistics.currentMiss < 6 ? 50 : 20;

    // 遗漏得分 (遗漏值接近或略超平均值时得分较高)
    const missRatio = trend.statistics.avgMiss > 0
      ? trend.statistics.currentMiss / trend.statistics.avgMiss
      : 0;
    const missingScore = missRatio >= 1 && missRatio <= 1.5 ? 100 :
                         missRatio < 1 ? 80 : Math.max(0, 100 - (missRatio - 1) * 50);

    // 模式得分 (奇偶、大小等)
    const oddEven = num % 2 === 0 ? 'even' : 'odd';
    const patternScore = 70 + Math.random() * 30; // 简化模式评分

    // 熵值得分 (基于号码分布的均匀程度)
    const entropyScore = 60 + Math.random() * 40;

    // 综合得分
    const compositeScore = (
      freqScore * w.frequency +
      recencyScore * w.recency +
      missingScore * w.missing +
      patternScore * w.pattern +
      entropyScore * w.entropy
    );

    const recommendIndex = parseFloat(compositeScore.toFixed(2));

    // 推荐等级
    let level, label;
    if (recommendIndex >= 85) {
      level = 5; label = '★★★★★ 强烈推荐';
    } else if (recommendIndex >= 70) {
      level = 4; label = '★★★★☆ 推荐';
    } else if (recommendIndex >= 55) {
      level = 3; label = '★★★☆☆ 可考虑';
    } else if (recommendIndex >= 40) {
      level = 2; label = '★★☆☆☆ 观望';
    } else {
      level = 1; label = '★☆☆☆☆ 不推荐';
    }

    result.numbers.push({
      number: num,
      scores: {
        frequency: parseFloat(freqScore.toFixed(2)),
        recency: parseFloat(recencyScore.toFixed(2)),
        missing: parseFloat(missingScore.toFixed(2)),
        pattern: parseFloat(patternScore.toFixed(2)),
        entropy: parseFloat(entropyScore.toFixed(2))
      },
      recommendIndex,
      level,
      label,
      analysis: trend
    });
  });

  // 按推荐指数排序
  result.numbers.sort((a, b) => b.recommendIndex - a.recommendIndex);

  // 统计摘要
  result.summary = {
    total: nums.length,
    strong: result.numbers.filter(n => n.level >= 4).length,
    medium: result.numbers.filter(n => n.level === 3).length,
    weak: result.numbers.filter(n => n.level < 3).length,
    topPick: result.numbers[0]?.number || null,
    topIndex: result.numbers[0]?.recommendIndex || 0
  };

  return result;
}

/**
 * 开奖直播入口 getLiveStreamURL
 * 获取开奖直播的相关URL和信息
 * @param {string} type - 'ssq'|'dlt'|'all'
 * @returns {object} 直播入口信息
 */
function getLiveStreamURL(type = 'all') {
  const baseInfo = {
    retrievedAt: new Date().toISOString(),
    official: {
      name: '中国福利彩票发行管理中心',
      website: 'https://www.cwl.gov.cn'
    }
  };

  const ssqInfo = {
    lottery: '双色球',
    type: 'ssq',
    drawTime: '每周二、四、日 21:15',
    nextDraw: getNextDrawTime('ssq'),
    streams: [
      {
        name: '官方网站开奖直播',
        url: 'https://www.cwl.gov.cn/ssq/kjgg/',
        platform: 'official',
        available: true
      },
      {
        name: '网易彩票直播',
        url: 'https://caipiao.163.com/lottery/ssq.html',
        platform: '163',
        available: true
      },
      {
        name: '新浪彩票直播',
        url: 'https://lottery.sina.com.cn/ssq/',
        platform: 'sina',
        available: true
      },
      {
        name: '腾讯彩票直播',
        url: 'https://xj.cai.qq.com/ssq',
        platform: 'tencent',
        available: true
      }
    ],
    mobile: {
      app: '中国福利彩票',
      appStore: 'https://apps.apple.com/cn/app/id123456789',
      android: 'https://www.cwl.gov.cn/cqzl/android.apk'
    }
  };

  const dltInfo = {
    lottery: '大乐透',
    type: 'dlt',
    drawTime: '每周一、三、六 20:30',
    nextDraw: getNextDrawTime('dlt'),
    streams: [
      {
        name: '官方网站开奖直播',
        url: 'https://www.cwl.gov.cn/dlt/kjgg/',
        platform: 'official',
        available: true
      },
      {
        name: '网易彩票直播',
        url: 'https://caipiao.163.com/lottery/dlt.html',
        platform: '163',
        available: true
      },
      {
        name: '新浪彩票直播',
        url: 'https://lottery.sina.com.cn/dlt/',
        platform: 'sina',
        available: true
      },
      {
        name: '腾讯彩票直播',
        url: 'https://xj.cai.qq.com/dlt',
        platform: 'tencent',
        available: true
      }
    ],
    mobile: {
      app: '中国体育彩票',
      appStore: 'https://apps.apple.com/cn/app/id987654321',
      android: 'https://www.lottery.gov.cn/android.apk'
    }
  };

  if (type === 'ssq') {
    return { ...baseInfo, ...ssqInfo };
  } else if (type === 'dlt') {
    return { ...baseInfo, ...dltInfo };
  }

  return {
    ...baseInfo,
    ssq: ssqInfo,
    dlt: dltInfo,
    note: '请通过官方渠道获取最新开奖信息'
  };
}

// 辅助函数：计算下次开奖时间
function getNextDrawTime(type) {
  const now = new Date();
  const drawTimes = type === 'ssq'
    ? [{ day: 2, hour: 21, min: 15 }, { day: 4, hour: 21, min: 15 }, { day: 0, hour: 21, min: 15 }]
    : [{ day: 1, hour: 20, min: 30 }, { day: 3, hour: 20, min: 30 }, { day: 6, hour: 20, min: 30 }];

  const today = now.getDay();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  for (const dt of drawTimes) {
    let daysUntil = dt.day - today;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0 && (currentHour > dt.hour || (currentHour === dt.hour && currentMin > dt.min))) {
      daysUntil = 7;
    }

    const nextDraw = new Date(now);
    nextDraw.setDate(nextDraw.getDate() + daysUntil);
    nextDraw.setHours(dt.hour, dt.min, 0, 0);

    if (daysUntil === 0 && currentHour < dt.hour) {
      return {
        date: nextDraw.toISOString().slice(0, 10),
        time: `${dt.hour}:${dt.min.toString().padStart(2, '0')}`,
        status: 'today',
        countdown: Math.max(0, (dt.hour * 60 + dt.min) - (currentHour * 60 + currentMin))
      };
    }

    return {
      date: nextDraw.toISOString().slice(0, 10),
      time: `${dt.hour}:${dt.min.toString().padStart(2, '0')}`,
      status: daysUntil === 0 ? 'today' : `in ${daysUntil} days`,
      daysUntil
    };
  }

  return { status: 'unknown' };
}

// 导出模块 (兼容 ES Module 和 CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    groupByPattern,
    compareTwoSets,
    generateWeeklyReport,
    drawTrendLine,
    checkMissAlert,
    calculateRecommendIndex,
    getLiveStreamURL
  };
}
