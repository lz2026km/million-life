/**
 * 彩票算法增强功能
 * 5项高级算法增强：邻号分析、同尾对分析、波峰周期、位置分布、缩水过滤
 * 配合主算法库 algos.js 使用
 */

// ==================== 1. 邻号分析 ====================
/**
 * 邻号分析（分析上期号码的±1邻号出现概率）
 * @param {string} type - 'ssq' | 'dlt'
 * @returns {object} 邻号统计数据和推荐
 */
export function adjacentAnalysis(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  const maxNum = isSSQ ? 33 : 35;

  // 计算上期号码的邻号
  const getAdjacent = (num) => {
    const adj = [];
    if (num > 1) adj.push(num - 1);
    if (num < maxNum) adj.push(num + 1);
    return adj;
  };

  // 统计邻号出现次数
  const adjCount = {};
  for (let i = 1; i <= maxNum; i++) adjCount[i] = 0;

  // 统计每期邻号出现情况
  const periodStats = [];

  for (let i = 1; i < data.length; i++) {
    const prevNums = isSSQ ? data[i].r : data[i].f;
    const currNums = isSSQ ? data[i - 1].r : data[i - 1].f;

    // 收集上期所有邻号
    const adjNums = new Set();
    prevNums.forEach(n => getAdjacent(n).forEach(a => adjNums.add(a)));

    // 统计当期有多少个邻号出现
    const appeared = currNums.filter(n => adjNums.has(n)).length;
    periodStats.push({ period: data[i].p || data[i].period, appeared, total: prevNums.length * 2 });

    // 记录每个具体邻号的出现情况
    currNums.forEach(n => {
      if (adjNums.has(n)) adjCount[n]++;
    });
  }

  // 计算平均邻号数
  const avgAdj = periodStats.reduce((a, b) => a + b.appeared, 0) / periodStats.length;

  // 找出最常作为邻号出现的号码
  const adjRanking = Object.entries(adjCount)
    .map(([num, c]) => ({ num: parseInt(num), count: c }))
    .sort((a, b) => b.count - a.count);

  const topAdjNums = adjRanking.slice(0, 15).map(s => s.num);

  // 生成推荐：基于邻号分析
  const recommended = [];
  const lastNums = isSSQ ? data[0].r : data[0].f;

  for (let sim = 0; sim < 15 && recommended.length < 5; sim++) {
    const result = [];

    // 50%概率包含邻号
    const useAdj = Math.random() < 0.5;
    const adjFromLast = new Set();
    lastNums.forEach(n => getAdjacent(n).forEach(a => adjFromLast.add(a)));

    if (useAdj) {
      const adjList = [...adjFromLast].sort(() => Math.random() - 0.5);
      const adjPick = adjList.slice(0, Math.round(avgAdj));
      result.push(...adjPick);
    }

    // 补充其他号码
    const pool = Array.from({ length: maxNum }, (_, i) => i + 1)
      .filter(n => !result.includes(n))
      .sort(() => Math.random() - 0.5);

    while (result.length < count && pool.length > 0) {
      result.push(pool.shift());
    }

    if (result.length === count) {
      recommended.push([...new Set(result)].slice(0, count).sort((a, b) => a - b));
    }
  }

  return {
    type,
    avgAdjCount: avgAdj.toFixed(2),
    topAdjNums,
    adjRanking: adjRanking.slice(0, 10),
    recommended: recommended.slice(0, 5)
  };
}

// ==================== 2. 同尾对分析 ====================
/**
 * 同尾对分析（分析哪些尾数配对最常同时出现）
 * @param {string} type - 'ssq' | 'dlt'
 * @returns {object} 同尾对统计和推荐
 */
export function tailPairAnalysis(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;

  // 统计每个尾数出现次数
  const tailFreq = Array(10).fill(0);
  // 统计同尾对出现次数
  const tailPairCount = {};
  for (let t1 = 0; t1 < 10; t1++) {
    for (let t2 = 0; t2 < 10; t2++) {
      tailPairCount[`${t1}-${t2}`] = 0;
    }
  }

  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    const tails = nums.map(n => n % 10);

    tails.forEach(t => tailFreq[t]++);

    // 统计同尾对
    for (let i = 0; i < tails.length; i++) {
      for (let j = i + 1; j < tails.length; j++) {
        const key = tails[i] <= tails[j] ? `${tails[i]}-${tails[j]}` : `${tails[j]}-${tails[i]}`;
        tailPairCount[key]++;
      }
    }
  });

  // 找出最热的同尾对
  const pairRanking = Object.entries(tailPairCount)
    .filter(([key, count]) => count > 0)
    .map(([key, count]) => {
      const [t1, t2] = key.split('-').map(Number);
      return { pair: [t1, t2], count };
    })
    .sort((a, b) => b.count - a.count);

  const topPairs = pairRanking.slice(0, 5).map(p => p.pair);

  // 计算每个尾数的热度分数
  const maxFreq = Math.max(...tailFreq);
  const tailScores = tailFreq.map((f, t) => ({
    tail: t,
    freq: f,
    score: (f / maxFreq).toFixed(3)
  })).sort((a, b) => b.freq - a.freq);

  // 生成推荐：基于同尾对
  const recommended = [];

  for (let sim = 0; sim < 20 && recommended.length < 5; sim++) {
    const result = [];
    const usedTails = new Set();

    // 优先使用热门同尾对
    const shuffledPairs = [...topPairs].sort(() => Math.random() - 0.5);
    for (const pair of shuffledPairs) {
      if (result.length >= count) break;
      for (const t of pair) {
        if (result.length >= count) break;
        if (!usedTails.has(t)) {
          const maxNum = isSSQ ? 33 : 35;
          const withTail = Array.from({ length: maxNum }, (_, i) => i + 1)
            .filter(n => n % 10 === t && !result.includes(n));
          if (withTail.length > 0) {
            result.push(withTail[Math.floor(Math.random() * withTail.length)]);
            usedTails.add(t);
          }
        }
      }
    }

    // 补充至count个
    const maxNum = isSSQ ? 33 : 35;
    while (result.length < count) {
      const remaining = Array.from({ length: maxNum }, (_, i) => i + 1)
        .filter(n => !result.includes(n));
      if (remaining.length === 0) break;
      result.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }

    if (result.length === count) {
      recommended.push(result.sort((a, b) => a - b));
    }
  }

  return {
    type,
    tailScores,
    topPairs: pairRanking.slice(0, 10),
    recommended: recommended.slice(0, 5)
  };
}

// ==================== 3. 波峰周期分析 ====================
/**
 * 波峰周期分析（分析号码出现的周期性波峰）
 * @param {string} type - 'ssq' | 'dlt'
 * @returns {object} 波峰周期数据和推荐
 */
export function waveCycleAnalysis(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  const maxNum = isSSQ ? 33 : 35;

  // 记录每个号码的出现期数间隔
  const appearIntervals = {};
  for (let i = 1; i <= maxNum; i++) {
    appearIntervals[i] = [];
  }

  // 追踪每个号码的出现历史
  const numHistory = {};
  for (let i = 1; i <= maxNum; i++) numHistory[i] = [];

  data.forEach((row, idx) => {
    const nums = isSSQ ? row.r : row.f;
    nums.forEach(n => numHistory[n].push(idx));
  });

  // 计算间隔
  Object.keys(numHistory).forEach(n => {
    const history = numHistory[n];
    for (let i = 1; i < history.length; i++) {
      appearIntervals[n].push(history[i] - history[i - 1]);
    }
  });

  // 分析波峰：计算每个号码的平均间隔和当前遗漏
  const waveStats = [];
  for (let i = 1; i <= maxNum; i++) {
    const intervals = appearIntervals[i];
    const history = numHistory[i];

    let currentMiss = 0;
    // 当前遗漏：从最后一期到现在
    if (history.length > 0) {
      currentMiss = data.length - 1 - history[history.length - 1];
    } else {
      currentMiss = data.length;
    }

    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : maxNum;

    // 波峰分数：遗漏接近平均间隔时加分
    const missRatio = currentMiss / avgInterval;
    let waveScore = 0;
    if (missRatio >= 0.8 && missRatio <= 1.2) {
      waveScore = 1.0; // 最佳区间
    } else if (missRatio >= 0.5 && missRatio <= 1.5) {
      waveScore = 0.6;
    } else if (missRatio > 1.5) {
      waveScore = 0.8; // 冷号回调
    } else {
      waveScore = 0.3;
    }

    waveStats.push({
      num: i,
      avgInterval: avgInterval.toFixed(2),
      currentMiss,
      missRatio: missRatio.toFixed(2),
      waveScore
    });
  }

  // 按波峰分数排序
  waveStats.sort((a, b) => b.waveScore - a.waveScore);
  const topWaveNums = waveStats.slice(0, 15).map(s => s.num);

  // 生成推荐
  const recommended = [];
  for (let sim = 0; sim < 15 && recommended.length < 5; sim++) {
    const result = [];
    const pool = [...topWaveNums].sort(() => Math.random() - 0.5);

    // 优先从波峰号码中选择
    const hotPool = waveStats.filter(s => s.waveScore >= 0.8).map(s => s.num);
    const shuffledHot = hotPool.sort(() => Math.random() - 0.5);

    while (result.length < count && shuffledHot.length > 0) {
      const n = shuffledHot.shift();
      if (!result.includes(n)) result.push(n);
    }

    // 补充
    const maxNum = isSSQ ? 33 : 35;
    while (result.length < count) {
      const remaining = Array.from({ length: maxNum }, (_, i) => i + 1)
        .filter(n => !result.includes(n));
      if (remaining.length === 0) break;
      result.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }

    if (result.length === count) {
      recommended.push(result.sort((a, b) => a - b));
    }
  }

  return {
    type,
    waveStats: waveStats.slice(0, 10),
    topWaveNums,
    recommended: recommended.slice(0, 5)
  };
}

// ==================== 4. 位置分布分析 ====================
/**
 * 位置分布分析（分析每个位置号码的历史分布）
 * @param {string} type - 'ssq' | 'dlt'
 * @returns {object} 位置统计数据和推荐
 */
export function positionAnalysis(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  const maxNum = isSSQ ? 33 : 35;

  // 统计每个位置上出现最多的号码
  const positionStats = [];
  for (let pos = 0; pos < count; pos++) {
    const posCount = {};
    for (let i = 1; i <= maxNum; i++) posCount[i] = 0;

    data.forEach(row => {
      const nums = isSSQ ? row.r : row.f;
      if (nums[pos] !== undefined) {
        posCount[nums[pos]]++;
      }
    });

    const ranking = Object.entries(posCount)
      .map(([num, c]) => ({ num: parseInt(num), count: c }))
      .sort((a, b) => b.count - a.count);

    positionStats.push({ position: pos + 1, topNums: ranking.slice(0, 5) });
  }

  // 计算每个位置的平均值和标准差
  const positionAvg = [];
  positionStats.forEach((ps, idx) => {
    const nums = data.map(row => (isSSQ ? row.r : row.f)[idx]).filter(n => n !== undefined);
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const variance = nums.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / nums.length;
    positionAvg.push({
      position: idx + 1,
      avg: avg.toFixed(2),
      std: Math.sqrt(variance).toFixed(2)
    });
  });

  // 生成推荐：每个位置参考历史热门
  const recommended = [];
  for (let sim = 0; sim < 15 && recommended.length < 5; sim++) {
    const result = [];

    for (let pos = 0; pos < count; pos++) {
      const topNums = positionStats[pos].topNums.map(s => s.num);
      // 70%概率选热门，30%概率随机
      if (Math.random() < 0.7 && topNums.length > 0) {
        const pick = topNums[Math.floor(Math.random() * Math.min(3, topNums.length))];
        result[pos] = pick;
      }
    }

    // 填充空位
    const maxNum = isSSQ ? 33 : 35;
    for (let pos = 0; pos < count; pos++) {
      if (result[pos] === undefined) {
        const remaining = Array.from({ length: maxNum }, (_, i) => i + 1)
          .filter(n => !result.includes(n));
        if (remaining.length > 0) {
          result[pos] = remaining[Math.floor(Math.random() * remaining.length)];
        }
      }
    }

    if (result.length === count && result.every(n => n !== undefined)) {
      recommended.push(result);
    }
  }

  return {
    type,
    positionStats,
    positionAvg,
    recommended: recommended.slice(0, 5)
  };
}

// ==================== 5. 缩水过滤 ====================
/**
 * 缩水过滤（基于多种条件过滤无效组合）
 * @param {string} type - 'ssq' | 'dlt'
 * @param {object} opts - 过滤条件配置
 * @returns {object} 过滤结果统计
 */
export function shrinkFilter(type = 'ssq', opts = {}) {
  const {
    minSum = 0,
    maxSum = 999,
    allowRepeatTail = true,
    maxConsecutive = 3,
    targetAC = null,
    minGap = 1
  } = opts;

  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  const maxNum = isSSQ ? 33 : 35;

  // 收集历史数据用于统计
  const historySums = data.map(row => {
    const nums = isSSQ ? row.r : row.f;
    return nums.reduce((a, b) => a + b, 0);
  });

  const sumAvg = historySums.reduce((a, b) => a + b, 0) / historySums.length;
  const sumMin = Math.min(...historySums);
  const sumMax = Math.max(...historySums);

  // 过滤函数
  const filterConditions = {
    sum: (nums) => {
      const s = nums.reduce((a, b) => a + b, 0);
      return s >= (minSum || sumAvg - 20) && s <= (maxSum || sumAvg + 20);
    },
    repeatTail: (nums) => {
      if (allowRepeatTail) return true;
      const tails = nums.map(n => n % 10);
      return new Set(tails).size === tails.length;
    },
    consecutive: (nums) => {
      const sorted = [...nums].sort((a, b) => a - b);
      let maxConsec = 1;
      let current = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 1) {
          current++;
          maxConsec = Math.max(maxConsec, current);
        } else {
          current = 1;
        }
      }
      return maxConsec <= maxConsecutive;
    },
    gap: (nums) => {
      const sorted = [...nums].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] < minGap) return false;
      }
      return true;
    },
    acValue: (nums, target) => {
      if (!target) return true;
      const diffs = new Set();
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          diffs.add(Math.abs(nums[i] - nums[j]));
        }
      }
      const ac = diffs.size - (nums.length - 1);
      return Math.abs(ac - target) <= 2;
    }
  };

  // 生成随机池并过滤
  const poolSize = 1000;
  const allCandidates = [];

  for (let i = 0; i < poolSize; i++) {
    const shuffled = Array.from({ length: maxNum }, (_, idx) => idx + 1)
      .sort(() => Math.random() - 0.5);
    allCandidates.push(shuffled.slice(0, count).sort((a, b) => a - b));
  }

  // 应用过滤
  const filtered = allCandidates.filter(nums => {
    if (!filterConditions.sum(nums)) return false;
    if (!filterConditions.repeatTail(nums)) return false;
    if (!filterConditions.consecutive(nums)) return false;
    if (!filterConditions.gap(nums)) return false;
    if (!filterConditions.acValue(nums, targetAC)) return false;
    return true;
  });

  // 统计过滤效果
  const stats = {
    totalGenerated: poolSize,
    afterSumFilter: allCandidates.filter(nums => filterConditions.sum(nums)).length,
    afterConsecutiveFilter: allCandidates.filter(nums => filterConditions.consecutive(nums)).length,
    afterGapFilter: allCandidates.filter(nums => filterConditions.gap(nums)).length,
    finalFiltered: filtered.length
  };

  // 推荐的缩水结果
  const recommended = filtered.slice(0, 5);

  return {
    type,
    sumRange: { min: sumMin, max: sumMax, avg: sumAvg.toFixed(2) },
    filterConfig: { minSum, maxSum, allowRepeatTail, maxConsecutive, targetAC, minGap },
    stats,
    recommended
  };
}

// ==================== 导出增强算法集合 ====================
export const enhancements = {
  adjacentAnalysis,
  tailPairAnalysis,
  waveCycleAnalysis,
  positionAnalysis,
  shrinkFilter
};

export default enhancements;
