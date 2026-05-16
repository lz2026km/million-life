/**
 * 百万人生体彩分析工具 - 投注玩法功能
 * 实现5种投注玩法：复式投注、胆拖投注、生肖幸运号、生日数字、守号功能
 */

// ==================== 工具函数 ====================

/**
 * 计算组合数 C(n, r)
 */
function combination(n, r) {
  if (r > n || r < 0) return 0;
  if (r === 0 || r === n) return 1;
  let result = 1;
  for (let i = 0; i < r; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

/**
 * 从数组中获取指定数量的随机组合
 */
function getRandomCombinations(arr, count, picks) {
  const results = [];
  const generate = () => {
    const sorted = [...arr].sort(() => Math.random() - 0.5);
    return sorted.slice(0, picks).sort((a, b) => a - b);
  };
  const seen = new Set();
  while (results.length < count) {
    const key = generate().join(',');
    if (!seen.has(key)) {
      seen.add(key);
      results.push(key.split(',').map(Number));
    }
  }
  return results;
}

/**
 * 排列组合 - 生成所有n选r的组合
 */
function combinations(arr, r) {
  const result = [];
  const combine = (start, combo) => {
    if (combo.length === r) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  };
  combine(0, []);
  return result;
}

// ==================== 1. 复式投注生成 ====================

/**
 * 复式投注生成器
 * @param {Object} params
 * @param {string} params.lotteryType - 'ssq' 双色球, 'dlt' 大乐透
 * @param {number[]} params.redBalls - 红球号码数组
 * @param {number[]} [params.blueBalls] - 蓝球号码数组（大乐透用）
 * @returns {Object} 包含注单列表和注数
 */
function generateCompoundBet({ lotteryType, redBalls, blueBalls = [] }) {
  const result = {
    type: lotteryType,
    bets: [],
    totalBets: 0,
    description: ''
  };

  if (lotteryType === 'ssq') {
    // 双色球：红球6个 + 蓝球1个
    const redCount = redBalls.length;
    if (redCount < 7 || redCount > 16) {
      result.description = `双色球复式红球数量需在7-16之间，当前：${redCount}个`;
      return result;
    }

    const betCount = combination(redCount, 6);
    result.totalBets = betCount;
    result.description = `红球${redCount}个，选${betCount}注`;

    // 生成所有6个红球的组合
    const redCombos = combinations(redBalls.sort((a, b) => a - b), 6);
    result.bets = redCombos.map(redCombo => ({
      red: redCombo,
      blue: [Math.floor(Math.random() * 16) + 1], // 随机蓝球
      formatted: `红球[${redCombo.join(',')}] 蓝球[${redCombo.length > 0 ? Math.floor(Math.random() * 16) + 1 : ''}]`
    }));

  } else if (lotteryType === 'dlt') {
    // 大乐透：前区5个 + 后区2个
    const frontCount = redBalls.length;
    const backCount = blueBalls.length;

    if (frontCount < 7 || frontCount > 15) {
      result.description = `大乐透前区数量需在7-15之间，当前：${frontCount}个`;
      return result;
    }
    if (backCount < 2) {
      result.description = `大乐透后区数量需在2个以上，当前：${backCount}个`;
      return result;
    }

    const frontBets = combination(frontCount, 5);
    const backBets = combination(backCount, 2);
    result.totalBets = frontBets * backBets;
    result.description = `前区${frontCount}个+后区${backCount}个，选${result.totalBets}注`;

    // 生成所有组合
    const frontCombos = combinations(redBalls.sort((a, b) => a - b), 5);
    const backCombos = combinations(blueBalls.sort((a, b) => a - b), 2);

    result.bets = [];
    frontCombos.forEach(front => {
      backCombos.forEach(back => {
        result.bets.push({
          front: front,
          back: back,
          formatted: `前区[${front.join(',')}] 后区[${back.join(',')}]`
        });
      });
    });
  }

  return result;
}

// ==================== 2. 胆拖投注生成 ====================

/**
 * 胆拖投注生成器
 * @param {Object} params
 * @param {string} params.lotteryType - 'ssq' 双色球, 'dlt' 大乐透
 * @param {number[]} params.danMa - 胆码数组
 * @param {number[]} params.tuoMa - 拖码数组
 * @param {number[]} [params.backBalls] - 后区号码（大乐透用）
 * @returns {Object} 包含注单列表和注数
 */
function generate胆拖Bet({ lotteryType, danMa, tuoMa, backBalls = [] }) {
  const result = {
    type: lotteryType,
    bets: [],
    totalBets: 0,
    description: ''
  };

  // 验证胆码不重复
  const uniqueDan = [...new Set(danMa)];
  if (uniqueDan.length !== danMa.length) {
    result.description = '胆码中有重复号码';
    return result;
  }

  // 验证胆码和拖码不重叠
  const overlap = danMa.filter(d => tuoMa.includes(d));
  if (overlap.length > 0) {
    result.description = `胆码和拖码有重叠：${overlap.join(',')}`;
    return result;
  }

  if (lotteryType === 'ssq') {
    // 双色球：胆码1-5个 + 拖码(6-胆码数)个以上
    const danCount = danMa.length;
    const tuoCount = tuoMa.length;
    const needCount = 6 - danCount;

    if (danCount < 1 || danCount > 5) {
      result.description = '双色球胆码需在1-5个之间';
      return result;
    }
    if (tuoCount < needCount) {
      result.description = `拖码至少需要${needCount}个（已选${danCount}个胆码），当前：${tuoCount}个`;
      return result;
    }

    // 从拖码中选 (6 - 胆码数) 个
    const tuoCombos = combinations(tuoMa, needCount);
    result.totalBets = tuoCombos.length;
    result.description = `胆码${danCount}个+拖码${tuoCount}个，选${result.totalBets}注`;

    result.bets = tuoCombos.map(tuo => ({
      dan: danMa,
      tuo: tuo,
      allRed: [...danMa, ...tuo].sort((a, b) => a - b),
      blue: [Math.floor(Math.random() * 16) + 1],
      formatted: `胆[${danMa.join(',')}] 拖[${tuo.join(',')}] 蓝球[${Math.floor(Math.random() * 16) + 1}]`
    }));

  } else if (lotteryType === 'dlt') {
    // 大乐透：前区胆码 + 前区拖码 + 后区
    const danCount = danMa.length;
    const tuoCount = tuoMa.length;
    const backCount = backBalls.length;
    const frontNeed = 5 - danCount;

    if (danCount < 1 || danCount > 5) {
      result.description = '大乐透前区胆码需在1-5个之间';
      return result;
    }
    if (tuoCount < frontNeed) {
      result.description = `前区拖码至少需要${frontNeed}个，当前：${tuoCount}个`;
      return result;
    }
    if (backCount < 2) {
      result.description = '后区至少需要2个号码';
      return result;
    }

    const frontCombos = combinations(tuoMa, frontNeed);
    const backCombos = combinations(backBalls, 2);
    result.totalBets = frontCombos.length * backCombos.length;
    result.description = `胆码${danCount}个+前区拖码${tuoCount}个+后区${backCount}个，选${result.totalBets}注`;

    result.bets = [];
    frontCombos.forEach(front => {
      backCombos.forEach(back => {
        result.bets.push({
          dan: danMa,
          tuo: front,
          frontAll: [...danMa, ...front].sort((a, b) => a - b),
          back: back,
          formatted: `前区胆[${danMa.join(',')}] 前区拖[${front.join(',')}] 后区[${back.join(',')}]`
        });
      });
    });
  }

  return result;
}

// ==================== 3. 生肖幸运号 ====================

const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/**
 * 根据出生年份计算生肖
 * @param {number} year - 出生年份
 * @returns {Object} 生肖信息和幸运号码
 */
function getZodiacLuckyNumber(year) {
  // 以2020年为鼠年（庚子年）基准
  const baseYear = 2020;
  const baseZodiacIndex = 0; // 鼠
  const yearDiff = year - baseYear;
  const zodiacIndex = ((yearDiff % 12) + 12) % 12;
  const zodiac = ZODIAC_ANIMALS[zodiacIndex];

  // 生肖幸运号码段（基于传统幸运数字说法）
  const luckyRanges = {
    '鼠': { red: [2, 12, 22, 32], blue: [3, 9], numbers: [2, 3, 9, 12, 22, 32] },
    '牛': { red: [5, 15, 25, 35], blue: [4, 10], numbers: [4, 5, 10, 15, 25, 35] },
    '虎': { red: [3, 13, 23, 33], blue: [5, 11], numbers: [3, 5, 11, 13, 23, 33] },
    '兔': { red: [4, 14, 24, 34], blue: [6, 12], numbers: [4, 6, 12, 14, 24, 34] },
    '龙': { red: [1, 11, 21, 31], blue: [7, 13], numbers: [1, 7, 11, 13, 21, 31] },
    '蛇': { red: [6, 16, 26, 36], blue: [8, 14], numbers: [6, 8, 14, 16, 26, 36] },
    '马': { red: [7, 17, 27, 37], blue: [9, 15], numbers: [7, 9, 15, 17, 27, 37] },
    '羊': { red: [8, 18, 28, 38], blue: [10, 16], numbers: [8, 10, 16, 18, 28, 38] },
    '猴': { red: [9, 19, 29], blue: [1, 7], numbers: [1, 7, 9, 19, 29] },
    '鸡': { red: [10, 20, 30], blue: [2, 8], numbers: [2, 8, 10, 20, 30] },
    '狗': { red: [11, 21, 31], blue: [3, 9], numbers: [3, 9, 11, 21, 31] },
    '猪': { red: [12, 22, 32], blue: [4, 10], numbers: [4, 10, 12, 22, 32] }
  };

  const info = luckyRanges[zodiac];
  
  // 生成幸运注单（红球33选6，蓝球16选1）
  const redLucky = info.red.sort(() => Math.random() - 0.5).slice(0, 6);
  while (redLucky.length < 6) {
    const num = Math.floor(Math.random() * 33) + 1;
    if (!redLucky.includes(num)) redLucky.push(num);
  }

  return {
    year: year,
    zodiac: zodiac,
    zodiacIndex: zodiacIndex,
    luckyRedNumbers: info.red,
    luckyBlueNumbers: info.blue,
    suggestedBet: {
      red: redLucky.sort((a, b) => a - b),
      blue: info.blue[Math.floor(Math.random() * info.blue.length)],
      formatted: `红球[${redLucky.sort((a, b) => a - b).join(',')}] 蓝球[${info.blue[0]}]`
    },
    allLuckyNumbers: info.numbers
  };
}

/**
 * 根据生肖名称获取幸运号
 * @param {string} zodiacName - 生肖名称
 * @returns {Object} 幸运号码信息
 */
function getZodiacByName(zodiacName) {
  const index = ZODIAC_ANIMALS.indexOf(zodiacName);
  if (index === -1) return null;
  
  // 计算该生肖对应的基准年份（以2020为鼠年倒推）
  const baseYear = 2020;
  const yearDiff = index; // 鼠为0，往后依次
  const zodiacYear = baseYear - (12 - index); // 计算该生肖对应的年份
  
  return getZodiacLuckyNumber(zodiacYear);
}

// ==================== 4. 生日数字生成 ====================

/**
 * 将生日日期转换为幸运数字组合
 * @param {string} dateStr - 生日日期，格式：YYYY-MM-DD 或 YYYYMMDD
 * @param {Object} options - 可选参数
 * @param {number} options.redCount - 红球数量，默认6
 * @param {number} options.blueCount - 蓝球数量，默认1
 * @returns {Object} 生日数字组合信息
 */
function generateBirthdayNumbers(dateStr, options = {}) {
  const { redCount = 6, blueCount = 1 } = options;
  
  // 解析日期
  let year, month, day;
  if (dateStr.includes('-')) {
    [year, month, day] = dateStr.split('-').map(Number);
  } else if (dateStr.length === 8) {
    year = parseInt(dateStr.substring(0, 4));
    month = parseInt(dateStr.substring(4, 6));
    day = parseInt(dateStr.substring(6, 8));
  } else {
    return { error: '日期格式错误，请使用 YYYY-MM-DD 或 YYYYMMDD 格式' };
  }

  // 验证日期有效性
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { error: '日期数值无效' };
  }

  // 提取数字
  const yearDigits = String(year).split('').map(Number);
  const monthDigits = String(month).padStart(2, '0').split('').map(Number);
  const dayDigits = String(day).padStart(2, '0').split('').map(Number);
  
  // 合并所有数字
  const allDigits = [...yearDigits, ...monthDigits, ...dayDigits];
  const uniqueDigits = [...new Set(allDigits)].sort((a, b) => a - b);

  // 生成多种组合方式
  const combinations = [];

  // 方式1：直接使用年月日数字
  combinations.push({
    type: '年月日数字',
    numbers: [...yearDigits, ...monthDigits, ...dayDigits],
    formatted: `年月日[${yearDigits.join('')}${monthDigits.join('').replace(/^0/, '')}${dayDigits.join('').replace(/^0/, '')}]`
  });

  // 方式2：月日组合（适合红球）
  if (monthDigits[1] !== 0 || dayDigits[1] !== 0) {
    const monthDay = [month, day].flatMap(d => String(d).split('').map(Number));
    combinations.push({
      type: '月日数字',
      numbers: monthDay,
      formatted: `月日[${monthDigits.join('').replace(/^0/, '')}, ${dayDigits.join('').replace(/^0/, '')}]`
    });
  }

  // 方式3：生日数字之和取余
  const digitSum = allDigits.reduce((a, b) => a + b, 0);
  combinations.push({
    type: '数字之和',
    numbers: [digitSum, digitSum * 2 % 33 + 1, digitSum * 3 % 16 + 1],
    formatted: `数字和[${digitSum}], 衍生[${digitSum * 2 % 33 + 1}, ${digitSum * 3 % 16 + 1}]`
  });

  // 方式4：使用唯一数字 + 随机补全
  const redPool = [...uniqueDigits];
  while (redPool.length < 6) {
    const rand = Math.floor(Math.random() * 33) + 1;
    if (!redPool.includes(rand)) redPool.push(rand);
  }
  combinations.push({
    type: '唯一数字+补全',
    numbers: redPool.slice(0, 6).sort((a, b) => a - b),
    formatted: `唯数[${uniqueDigits.join(',')}] → 红球[${redPool.slice(0, 6).sort((a, b) => a - b).join(',')}]`
  });

  // 方式5：幸运组合（基于出生日在当年的第几天）
  const startOfYear = new Date(year, 0, 1);
  const birthDate = new Date(year, month - 1, day);
  const dayOfYear = Math.floor((birthDate - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const dayDigits2 = String(dayOfYear).split('').map(Number);
  const luckyRed = [...new Set([...dayDigits2, ...uniqueDigits])].slice(0, 6);
  while (luckyRed.length < 6) {
    const rand = Math.floor(Math.random() * 33) + 1;
    if (!luckyRed.includes(rand)) luckyRed.push(rand);
  }
  combinations.push({
    type: '年内第几天',
    numbers: luckyRed.sort((a, b) => a - b),
    formatted: `年内第${dayOfYear}天 → 红球[${luckyRed.sort((a, b) => a - b).join(',')}]`
  });

  return {
    inputDate: dateStr,
    year: year,
    month: month,
    day: day,
    allDigits: allDigits,
    uniqueDigits: uniqueDigits,
    digitSum: digitSum,
    dayOfYear: dayOfYear,
    combinations: combinations,
    recommended: {
      red: combinations[3].numbers, // 使用方式4作为推荐
      blue: (month + day) % 16 + 1,
      formatted: `红球[${combinations[3].numbers.join(',')}] 蓝球[${(month + day) % 16 + 1}]`
    }
  };
}

// ==================== 5. 守号功能 ====================

const STORAGE_KEY = 'million_life_守号列表';

/**
 * 获取守号列表
 * @returns {Array} 守号列表
 */
function get守号列表() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('读取守号列表失败:', e);
    return [];
  }
}

/**
 * 保存守号列表到localStorage
 * @param {Array} list - 守号列表
 */
function save守号列表(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('保存守号列表失败:', e);
    return false;
  }
}

/**
 * 添加守号
 * @param {Object} bet - 投注号码
 * @param {string} bet.type - 类型 'ssq' 或 'dlt'
 * @param {number[]} bet.red - 红球号码
 * @param {number[]} [bet.blue] - 蓝球号码
 * @param {number[]} [bet.front] - 前区号码（大乐透）
 * @param {number[]} [bet.back] - 后区号码（大乐透）
 * @param {string} [bet.name] - 名称/备注
 * @returns {Object} 结果
 */
function add守号(bet) {
  const list = get守号列表();
  const newBet = {
    id: Date.now(),
    type: bet.type,
    name: bet.name || `守号${list.length + 1}`,
    numbers: bet,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    trackCount: 0,
    hitRecords: []
  };
  list.push(newBet);
  
  if (save守号列表(list)) {
    return { success: true, data: newBet };
  }
  return { success: false, error: '保存失败' };
}

/**
 * 更新守号
 * @param {number} id - 守号ID
 * @param {Object} updates - 更新内容
 * @returns {Object} 结果
 */
function update守号(id, updates) {
  const list = get守号列表();
  const index = list.findIndex(item => item.id === id);
  
  if (index === -1) {
    return { success: false, error: '守号不存在' };
  }
  
  list[index] = {
    ...list[index],
    ...updates,
    id: id, // 保持ID不变
    lastUpdated: new Date().toISOString()
  };
  
  if (save守号列表(list)) {
    return { success: true, data: list[index] };
  }
  return { success: false, error: '保存失败' };
}

/**
 * 删除守号
 * @param {number} id - 守号ID
 * @returns {Object} 结果
 */
function delete守号(id) {
  const list = get守号列表();
  const filtered = list.filter(item => item.id !== id);
  
  if (filtered.length === list.length) {
    return { success: false, error: '守号不存在' };
  }
  
  if (save守号列表(filtered)) {
    return { success: true };
  }
  return { success: false, error: '删除失败' };
}

/**
 * 查询守号
 * @param {number} id - 守号ID
 * @returns {Object|null} 守号信息
 */
function get守号ById(id) {
  const list = get守号列表();
  return list.find(item => item.id === id) || null;
}

/**
 * 更新守号跟踪记录（开奖后调用）
 * @param {number} id - 守号ID
 * @param {Object} drawResult - 开奖结果
 * @param {number} [betCount] - 投注注数
 * @returns {Object} 结果
 */
function update守号Track(id, drawResult, betCount = 1) {
  const list = get守号列表();
  const index = list.findIndex(item => item.id === id);
  
  if (index === -1) {
    return { success: false, error: '守号不存在' };
  }
  
  // 检查是否中奖
  let hitCount = 0;
  const bet = list[index].numbers;
  
  if (bet.type === 'ssq') {
    const redHit = bet.red.filter(r => drawResult.red.includes(r)).length;
    const blueHit = bet.blue && drawResult.blue ? bet.blue.includes(drawResult.blue) : false;
    hitCount = redHit + (blueHit ? 0.5 : 0);
  } else if (bet.type === 'dlt') {
    const frontHit = bet.front ? bet.front.filter(f => drawResult.front.includes(f)).length : 0;
    const backHit = bet.back ? bet.back.filter(b => drawResult.back.includes(b)).length : 0;
    hitCount = frontHit + backHit * 0.1;
  }
  
  list[index].trackCount += betCount;
  list[index].hitRecords.push({
    date: new Date().toISOString(),
    drawResult: drawResult,
    hitCount: hitCount
  });
  
  if (save守号列表(list)) {
    return { success: true, data: list[index] };
  }
  return { success: false, error: '更新失败' };
}

/**
 * 清除所有守号
 * @returns {Object} 结果
 */
function clear所有守号() {
  if (save守号列表([])) {
    return { success: true };
  }
  return { success: false, error: '清除失败' };
}

// ==================== 导出模块 ====================

// 如果是Node.js环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // 工具函数
    combination,
    getRandomCombinations,
    combinations,
    
    // 复式投注
    generateCompoundBet,
    
    // 胆拖投注
    generate胆拖Bet,
    
    // 生肖幸运号
    ZODIAC_ANIMALS,
    getZodiacLuckyNumber,
    getZodiacByName,
    
    // 生日数字
    generateBirthdayNumbers,
    
    // 守号功能
    get守号列表,
    save守号列表,
    add守号,
    update守号,
    delete守号,
    get守号ById,
    update守号Track,
    clear所有守号
  };
}
