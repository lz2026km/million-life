/**
 * 彩票分析算法库
 * 数据来源: SSQ_DATA (双色球), DLT_DATA (大乐透)
 */

// 工具函数：深拷贝
const clone = arr => Array.isArray(arr) ? arr.map(v => Array.isArray(v) ? [...v] : v) : arr;

// ==================== 1. 冷热号分析 ====================
/**
 * 冷热号分析（频率+遗漏值加权采样）
 * @param {string} type - 'ssq' | 'dlt'
 * @param {object} opts - {topN: 选取前N个, hotWeight: 热号权重, coldWeight: 冷号权重}
 */
export function hotCold(type = 'ssq', opts = {}) {
  const { topN = 6, hotWeight = 0.7, coldWeight = 0.3 } = opts;
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const maxNum = isSSQ ? 33 : 35;
  const count = isSSQ ? 6 : 5;
  
  // 统计频率和遗漏
  const freq = {}, miss = {};
  for (let i = 1; i <= maxNum; i++) { freq[i] = 0; miss[i] = 0; }
  
  let currentMiss = {};
  for (let i = 1; i <= maxNum; i++) currentMiss[i] = 0;
  
  data.forEach((row, idx) => {
    const nums = isSSQ ? row.r : row.f;
    nums.forEach(n => freq[n]++);
    // 更新遗漏
    for (let i = 1; i <= maxNum; i++) {
      if (nums.includes(i)) currentMiss[i] = 0;
      else currentMiss[i]++;
    }
    // 记录最后遗漏
    if (idx === 0) {
      for (let i = 1; i <= maxNum; i++) miss[i] = currentMiss[i];
    }
  });
  
  // 计算加权分数 (热号频率高+冷号遗漏大)
  const scores = [];
  const maxFreq = Math.max(...Object.values(freq));
  const maxMiss = Math.max(...Object.values(miss), 1);
  
  for (let i = 1; i <= maxNum; i++) {
    const hotScore = (freq[i] / maxFreq) * hotWeight;
    const coldScore = (miss[i] / maxMiss) * coldWeight;
    scores.push({ num: i, score: hotScore + coldScore, freq: freq[i], miss: miss[i] });
  }
  
  scores.sort((a, b) => b.score - a.score);
  const selected = scores.slice(0, topN).map(s => s.num).sort((a, b) => a - b);
  
  return { type, selected, scores: scores.slice(0, topN * 2), hotWeight, coldWeight };
}

// ==================== 2. 奇偶分析 ====================
/**
 * 奇偶分析（历史奇偶比例模拟）
 * @param {string} type - 'ssq' | 'dlt'
 */
export function oddEven(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  
  // 统计历史奇偶比例
  const stats = { odd: 0, even: 0, total: 0 };
  const ratioHistory = [];
  
  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    let odd = 0, even = 0;
    nums.forEach(n => n % 2 === 1 ? odd++ : even++);
    stats.odd += odd;
    stats.even += even;
    stats.total += nums.length;
    ratioHistory.push({ odd, even, total: nums.length });
  });
  
  // 计算平均奇偶比例
  const avgOddRatio = stats.odd / stats.total;
  const avgEvenRatio = stats.even / stats.total;
  const count = isSSQ ? 6 : 5;
  
  // 生成推荐：基于历史比例模拟
  const recommended = [];
  const targetOdd = Math.round(avgOddRatio * count);
  
  // 随机模拟生成多组
  for (let sim = 0; sim < 10; sim++) {
    const simResult = [];
    let oddLeft = targetOdd;
    const nums = isSSQ ? Array.from({length: 33}, (_, i) => i + 1) : Array.from({length: 35}, (_, i) => i + 1);
    const shuffled = nums.sort(() => Math.random() - 0.5);
    
    shuffled.forEach(n => {
      if (simResult.length >= count) return;
      const isOdd = n % 2 === 1;
      if (isOdd && oddLeft > 0) {
        simResult.push(n);
        oddLeft--;
      } else if (!isOdd && simResult.length - (targetOdd - oddLeft) < (count - targetOdd)) {
        simResult.push(n);
      }
    });
    
    if (simResult.length === count) {
      recommended.push(simResult.sort((a, b) => a - b));
    }
  }
  
  return { 
    type, 
    avgOddRatio: avgOddRatio.toFixed(3), 
    avgEvenRatio: avgEvenRatio.toFixed(3),
    targetOdd,
    recommended: recommended.slice(0, 5),
    history: ratioHistory.slice(0, 10)
  };
}

// ==================== 3. 区间分析 ====================
/**
 * 区间分析（号码在区间分布统计）
 * @param {string} type - 'ssq' | 'dlt'
 * @param {number} zones - 分成几个区间
 */
export function zone(type = 'ssq', zones = 4) {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const maxNum = isSSQ ? 33 : 35;
  const count = isSSQ ? 6 : 5;
  
  // 定义区间
  const zoneSize = Math.ceil(maxNum / zones);
  const zoneRanges = [];
  for (let i = 0; i < zones; i++) {
    const start = i * zoneSize + 1;
    const end = Math.min((i + 1) * zoneSize, maxNum);
    zoneRanges.push({ zone: i + 1, start, end });
  }
  
  // 统计每个区间出现次数
  const zoneCount = Array(zones).fill(0);
  
  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    nums.forEach(n => {
      const z = Math.floor((n - 1) / zoneSize);
      if (z >= 0 && z < zones) zoneCount[z]++;
    });
  });
  
  // 计算各区间热门程度
  const zoneStats = zoneRanges.map((zr, i) => ({
    ...zr,
    count: zoneCount[i],
    ratio: (zoneCount[i] / (data.length * count)).toFixed(4)
  }));
  
  // 生成推荐：按区间热度分配号码
  const recommended = [];
  const topZones = zoneStats.sort((a, b) => b.count - a.count).slice(0, Math.ceil(count / 2));
  
  for (let sim = 0; sim < 10; sim++) {
    const result = [];
    const nums = isSSQ ? Array.from({length: 33}, (_, i) => i + 1) : Array.from({length: 35}, (_, i) => i + 1);
    
    topZones.forEach(z => {
      const inZone = nums.filter(n => n >= z.start && n <= z.end);
      const shuffled = inZone.sort(() => Math.random() - 0.5);
      result.push(...shuffled.slice(0, Math.ceil(count / 3)));
    });
    
    if (result.length < count) {
      const remaining = nums.filter(n => !result.includes(n)).sort(() => Math.random() - 0.5);
      result.push(...remaining.slice(0, count - result.length));
    }
    
    recommended.push([...new Set(result)].slice(0, count).sort((a, b) => a - b));
  }
  
  return { type, zones, zoneStats, recommended: recommended.slice(0, 5) };
}

// ==================== 4. 尾数分析 ====================
/**
 * 尾数分析（0-9尾数热态分布）
 * @param {string} type - 'ssq' | 'dlt'
 */
export function tail(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  
  // 统计各尾数出现频率
  const tailCount = Array(10).fill(0);
  const tailMiss = Array(10).fill(0);
  let totalCount = 0;
  
  // 计算当前遗漏
  const currentMiss = Array(10).fill(0);
  
  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    nums.forEach(n => {
      const t = n % 10;
      tailCount[t]++;
      totalCount++;
    });
    // 更新遗漏
    for (let t = 0; t < 10; t++) {
      const hasTail = nums.some(n => n % 10 === t);
      if (hasTail) currentMiss[t] = 0;
      else currentMiss[t]++;
    }
  });
  
  // 复制最后遗漏值
  for (let t = 0; t < 10; t++) tailMiss[t] = currentMiss[t];
  
  // 计算综合分数 (频率+遗漏)
  const maxCount = Math.max(...tailCount);
  const maxMiss = Math.max(...tailMiss, 1);
  
  const tailStats = [];
  for (let t = 0; t < 10; t++) {
    const hotScore = (tailCount[t] / maxCount) * 0.6;
    const coldScore = (tailMiss[t] / maxMiss) * 0.4;
    tailStats.push({
      tail: t,
      count: tailCount[t],
      miss: tailMiss[t],
      score: (hotScore + coldScore).toFixed(3)
    });
  }
  
  tailStats.sort((a, b) => b.score - a.score);
  const topTails = tailStats.slice(0, 5).map(s => s.tail);
  
  // 生成推荐：每个尾数选1-2个号码
  const recommended = [];
  const count = isSSQ ? 6 : 5;
  
  for (let sim = 0; sim < 10; sim++) {
    const result = [];
    const nums = isSSQ ? Array.from({length: 33}, (_, i) => i + 1) : Array.from({length: 35}, (_, i) => i + 1);
    
    topTails.forEach(t => {
      const withTail = nums.filter(n => n % 10 === t && !result.includes(n));
      if (withTail.length > 0) {
        result.push(withTail[Math.floor(Math.random() * withTail.length)]);
      }
    });
    
    while (result.length < count) {
      const remaining = nums.filter(n => !result.includes(n));
      if (remaining.length === 0) break;
      result.push(remaining[Math.floor(Math.random() * remaining.length)]);
    }
    
    recommended.push(result.slice(0, count).sort((a, b) => a - b));
  }
  
  return { type, tailStats, topTails, recommended: recommended.slice(0, 5) };
}

// ==================== 5. 蒙特卡洛模拟 ====================
/**
 * 蒙特卡洛模拟（1000次随机）
 * @param {string} type - 'ssq' | 'dlt'
 * @param {number} times - 模拟次数
 */
export function monteCarlo(type = 'ssq', times = 1000) {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const maxNum = isSSQ ? 33 : 35;
  const count = isSSQ ? 6 : 5;
  
  // 统计每个号码出现频率用于加权
  const freq = {};
  for (let i = 1; i <= maxNum; i++) freq[i] = 0;
  
  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    nums.forEach(n => freq[n]++);
  });
  
  const maxFreq = Math.max(...Object.values(freq));
  const nums = Array.from({ length: maxNum }, (_, i) => i + 1);
  
  // 加权随机选择
  const weightedRandom = (exclude = []) => {
    const weights = nums.map(n => {
      if (exclude.includes(n)) return 0;
      return (freq[n] / maxFreq) * 0.5 + 0.5;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < nums.length; i++) {
      r -= weights[i];
      if (r <= 0) return nums[i];
    }
    return nums[nums.length - 1];
  };
  
  // 执行蒙特卡洛模拟
  const results = {};
  nums.forEach(n => results[n] = 0);
  
  for (let i = 0; i < times; i++) {
    const selected = [];
    while (selected.length < count) {
      const n = weightedRandom(selected);
      if (!selected.includes(n)) selected.push(n);
    }
    selected.forEach(n => results[n]++);
  }
  
  // 排序
  const sorted = Object.entries(results)
    .map(([num, count]) => ({ num: parseInt(num), count }))
    .sort((a, b) => b.count - a.count);
  
  // 生成推荐组合
  const recommended = [];
  for (let i = 0; i < 5; i++) {
    const selected = sorted.slice(i * 3, i * 3 + count).map(s => s.num).sort((a, b) => a - b);
    if (selected.length === count) recommended.push(selected);
  }
  
  return { type, times, topFreq: sorted.slice(0, 10), recommended };
}

// ==================== 6. AC值分析 ====================
/**
 * AC值分析（号码复杂度）
 * AC值 = 所有号码两两差值的不同值数量 - (count - 1)
 * @param {string} type - 'ssq' | 'dlt'
 */
export function acValue(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  
  // 计算一组号码的AC值
  const calcAC = (nums) => {
    const diffs = new Set();
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        diffs.add(Math.abs(nums[i] - nums[j]));
      }
    }
    return diffs.size - (nums.length - 1);
  };
  
  // 统计历史AC值分布
  const acStats = {};
  const acHistory = [];
  
  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    const ac = calcAC(nums);
    acStats[ac] = (acStats[ac] || 0) + 1;
    acHistory.push({ ac, nums: [...nums] });
  });
  
  // 找出最常见的AC值
  const sortedAC = Object.entries(acStats).sort((a, b) => b[1] - a[1]);
  const commonAC = sortedAC.slice(0, 3).map(([ac]) => parseInt(ac));
  
  // 生成推荐：生成AC值接近常见的组合
  const recommended = [];
  const maxNum = isSSQ ? 33 : 35;
  const count = isSSQ ? 6 : 5;
  
  for (let sim = 0; sim < 20 && recommended.length < 5; sim++) {
    const shuffled = Array.from({ length: maxNum }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count).sort((a, b) => a - b);
    const ac = calcAC(selected);
    
    if (commonAC.includes(ac)) {
      recommended.push({ nums: selected, ac });
    }
  }
  
  // 如果推荐不足，补充随机组合
  while (recommended.length < 5) {
    const shuffled = Array.from({ length: maxNum }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count).sort((a, b) => a - b);
    recommended.push({ nums: selected, ac: calcAC(selected) });
  }
  
  return { 
    type, 
    acStats: Object.fromEntries(sortedAC.slice(0, 10).map(([k, v]) => [k, v])),
    commonAC,
    recommended: recommended.map(r => r.nums)
  };
}

// ==================== 7. 和值分析 ====================
/**
 * 和值分析（统计和值分布生成）
 * @param {string} type - 'ssq' | 'dlt'
 */
export function sumValue(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const maxNum = isSSQ ? 33 : 35;
  const count = isSSQ ? 6 : 5;
  
  // 最小/最大和值
  const minSum = count * 1;
  const maxSum = count * maxNum;
  
  // 统计历史和值分布
  const sumStats = {};
  const sumHistory = [];
  
  data.forEach(row => {
    const nums = isSSQ ? row.r : row.f;
    const sum = nums.reduce((a, b) => a + b, 0);
    sumStats[sum] = (sumStats[sum] || 0) + 1;
    sumHistory.push({ sum, nums: [...nums] });
  });
  
  // 计算和值统计
  const sums = Object.keys(sumStats).map(Number);
  const avgSum = sums.reduce((a, s) => a + s * (sumStats[s] || 0), 0) / data.length;
  
  // 最常见的和值区间
  const sortedSums = Object.entries(sumStats).sort((a, b) => b[1] - a[1]);
  const commonSums = sortedSums.slice(0, 5).map(([s]) => parseInt(s));
  const targetSum = commonSums[Math.floor(commonSums.length / 2)];
  
  // 生成推荐：和值接近常见的组合
  const recommended = [];
  
  for (let sim = 0; sim < 100 && recommended.length < 5; sim++) {
    const shuffled = Array.from({ length: maxNum }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const sum = selected.reduce((a, b) => a + b, 0);
    
    if (Math.abs(sum - targetSum) < 10) {
      recommended.push({ nums: selected.sort((a, b) => a - b), sum });
    }
  }
  
  return { 
    type,
    sumRange: { min: minSum, max: maxSum },
    avgSum: avgSum.toFixed(2),
    commonSums,
    targetSum,
    sumStats: Object.fromEntries(sortedSums.slice(0, 10).map(([k, v]) => [k, v])),
    recommended: recommended.slice(0, 5).map(r => r.nums)
  };
}

// ==================== 8. 重号/连号分析 ====================
/**
 * 重号/连号分析（基于历史重号连号概率）
 * @param {string} type - 'ssq' | 'dlt'
 */
export function repeatLink(type = 'ssq') {
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  
  // 统计重号个数（上期开奖号在当期出现）
  const repeatStats = [];
  for (let i = 1; i < data.length; i++) {
    const prevNums = isSSQ ? data[i].r : data[i].f;
    const currNums = isSSQ ? data[i - 1].r : data[i - 1].f;
    const repeat = prevNums.filter(n => currNums.includes(n)).length;
    repeatStats.push(repeat);
  }
  
  // 统计连号情况（相邻号码同时出现）
  const linkStats = [];
  for (let i = 0; i < data.length; i++) {
    const nums = isSSQ ? data[i].r : data[i].f;
    const sorted = [...nums].sort((a, b) => a - b);
    let links = 0;
    for (let j = 1; j < sorted.length; j++) {
      if (sorted[j] - sorted[j - 1] === 1) links++;
    }
    linkStats.push(links);
  }
  
  // 计算概率
  const avgRepeat = repeatStats.reduce((a, b) => a + b, 0) / repeatStats.length;
  const avgLink = linkStats.reduce((a, b) => a + b, 0) / linkStats.length;
  
  // 重号分布
  const repeatDist = {};
  repeatStats.forEach(r => { repeatDist[r] = (repeatDist[r] || 0) + 1; });
  
  // 连号分布
  const linkDist = {};
  linkStats.forEach(l => { linkDist[l] = (linkDist[l] || 0) + 1; });
  
  // 生成推荐
  const lastNums = isSSQ ? data[0].r : data[0].f;
  const recommended = [];
  
  for (let sim = 0; sim < 10; sim++) {
    const result = [];
    // 模拟重号
    const repeatCount = Math.round(avgRepeat);
    const repeatFromLast = lastNums.sort(() => Math.random() - 0.5).slice(0, repeatCount);
    result.push(...repeatFromLast);
    
    // 补充其他号码
    const maxNum = isSSQ ? 33 : 35;
    const remaining = Array.from({ length: maxNum }, (_, i) => i + 1).filter(n => !result.includes(n));
    while (result.length < count) {
      const n = remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0];
      if (n) result.push(n);
    }
    
    // 检查连号
    const sorted = result.sort((a, b) => a - b);
    let links = 0;
    for (let j = 1; j < sorted.length; j++) {
      if (sorted[j] - sorted[j - 1] === 1) links++;
    }
    
    recommended.push({ nums: sorted, repeat: repeatCount, links });
  }
  
  return { 
    type,
    avgRepeat: avgRepeat.toFixed(2),
    avgLink: avgLink.toFixed(2),
    repeatDist,
    linkDist,
    lastNums,
    recommended: recommended.slice(0, 5).map(r => r.nums)
  };
}

// ==================== 9. 胆码分析 ====================
/**
 * 胆码分析（固定胆拖组合）
 * @param {string} type - 'ssq' | 'dlt'
 * @param {object} opts - {danma: 胆码数组, tuomaCount: 拖码个数}
 */
export function danMa(type = 'ssq', opts = {}) {
  const { danma = [], tuomaCount } = opts;
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  const maxNum = isSSQ ? 33 : 35;
  
  // 自动生成胆码：选择历史热门号
  if (danma.length === 0) {
    const freq = {};
    for (let i = 1; i <= maxNum; i++) freq[i] = 0;
    data.forEach(row => {
      const nums = isSSQ ? row.r : row.f;
      nums.forEach(n => freq[n]++);
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const danCount = isSSQ ? 2 : 1;
    danma.push(...sorted.slice(0, danCount).map(([n]) => parseInt(n)));
  }
  
  // 计算拖码数量
  const actualTuomaCount = tuomaCount || (count - danma.length);
  const tuomaNeed = count - danma.length;
  
  // 生成拖码池（排除胆码）
  const tuomaPool = Array.from({ length: maxNum }, (_, i) => i + 1).filter(n => !danma.includes(n));
  
  // 生成推荐组合
  const recommended = [];
  
  for (let sim = 0; sim < 20 && recommended.length < 5; sim++) {
    const shuffled = [...tuomaPool].sort(() => Math.random() - 0.5);
    const tuoma = shuffled.slice(0, tuomaNeed);
    const full = [...danma, ...tuoma].sort((a, b) => a - b);
    if (full.length === count) {
      recommended.push(full);
    }
  }
  
  return { 
    type,
    danma: danma.sort((a, b) => a - b),
    tuomaCount: actualTuomaCount,
    recommended
  };
}

// ==================== 10. 旋转矩阵缩水 ====================
/**
 * 旋转矩阵缩水（中7保6矩阵）
 * @param {string} type - 'ssq' | 'dlt'
 * @param {object} opts - {nums: 精选号码数组, guarantee: 保障等级}
 */
export function rotateMatrix(type = 'ssq', opts = {}) {
  const { nums, guarantee = '6保5' } = opts;
  const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const isSSQ = type === 'ssq';
  const count = isSSQ ? 6 : 5;
  const maxNum = isSSQ ? 33 : 35;
  
  // 默认使用前10个热门号码
  let selectedNums = nums;
  if (!selectedNums || selectedNums.length === 0) {
    const freq = {};
    for (let i = 1; i <= maxNum; i++) freq[i] = 0;
    data.forEach(row => {
      const rowNums = isSSQ ? row.r : row.f;
      rowNums.forEach(n => freq[n]++);
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    selectedNums = sorted.slice(0, 10).map(([n]) => parseInt(n));
  }
  
  // 简化的旋转矩阵实现（组合覆盖）
  // 中N保M: 从selectedNums中选取子集，确保每M个号码的组合都被覆盖
  const n = selectedNums.length;
  
  // 生成所有n中取count的组合
  const allCombinations = [];
  const combine = (arr, k, start, current) => {
    if (current.length === k) {
      allCombinations.push([...current]);
      return;
    }
    for (let i = start; i < arr.length && arr.length - i + current.length >= k; i++) {
      current.push(arr[i]);
      combine(arr, k, i + 1, current);
      current.pop();
    }
  };
  combine(selectedNums, count, 0, []);
  
  // 简化：随机选取一定数量的组合作为矩阵
  const matrixSize = Math.min(20, allCombinations.length);
  const shuffled = allCombinations.sort(() => Math.random() - 0.5);
  const matrix = shuffled.slice(0, matrixSize);
  
  return {
    type,
    guarantee,
    inputNums: selectedNums.sort((a, b) => a - b),
    matrixSize,
    matrix
  };
}

// ==================== 导出算法集合 ====================
export const algos = {
  hotCold,
  oddEven,
  zone,
  tail,
  monteCarlo,
  acValue,
  sumValue,
  repeatLink,
  danMa,
  rotateMatrix
};

export default algos;
