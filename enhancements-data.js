/**
 * 数据层增强模块
 * 配合 SSQ_DATA (双色球) / DLT_DATA (大乐透) 使用
 */

// 数据版本标注
const DATA_VERSION = {
  ssq: { version: '1.0.0', lastUpdate: '2025-04-17', source: 'historical' },
  dlt: { version: '1.0.0', lastUpdate: '2025-04-17', source: 'historical' }
};

/**
 * 历史开奖查询
 * @param {string} period - 期号
 * @param {string} type - 'ssq' | 'dlt' | 'all' (默认 'all')
 * @returns {object|array} 查到的开奖记录
 */
function searchHistory(period, type = 'all') {
  const results = { ssq: null, dlt: null };

  if (type === 'ssq' || type === 'all') {
    results.ssq = SSQ_DATA.find(item => item.p === period) || null;
  }
  if (type === 'dlt' || type === 'all') {
    results.dlt = DLT_DATA.find(item => item.p === period) || null;
  }

  if (type === 'ssq' || type === 'dlt') {
    return results[type];
  }
  return results;
}

/**
 * 数据导出 CSV
 * @param {string} type - 'ssq' | 'dlt' | 'all' (默认 'all')
 * @param {string} filename - 自定义文件名 (可选)
 * @returns {string} CSV 格式字符串
 */
function exportCSV(type = 'all', filename = '') {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let csv = '';

  if (type === 'ssq' || type === 'all') {
    csv += '=== 双色球 (SSQ) ===\n';
    csv += '期号,红球1,红球2,红球3,红球4,红球5,红球6,蓝球\n';
    SSQ_DATA.forEach(item => {
      csv += `${item.p},${item.r.join(',')},${item.b}\n`;
    });
    if (type === 'all') csv += '\n';
  }

  if (type === 'dlt' || type === 'all') {
    csv += '=== 大乐透 (DLT) ===\n';
    csv += '期号,前区1,前区2,前区3,前区4,前区5,后区1,后区2\n';
    DLT_DATA.forEach(item => {
      csv += `${item.p},${item.f.join(',')},${item.b.join(',')}\n`;
    });
  }

  // 自动下载
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `lottery_export_${timestamp}${type === 'all' ? '' : '_' + type}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return csv;
}

/**
 * 数据纠错提交
 * @param {string} period - 期号
 * @param {object} data - 正确的开奖数据
 * @param {string} type - 'ssq' | 'dlt'
 * @returns {object} 纠错结果
 */
function submitCorrection(period, data, type) {
  const target = type === 'ssq' ? SSQ_DATA : DLT_DATA;
  const index = target.findIndex(item => item.p === period);

  const correction = {
    period,
    type,
    original: index !== -1 ? { ...target[index] } : null,
    corrected: data,
    timestamp: new Date().toISOString(),
    status: index !== -1 ? 'updated' : 'not_found'
  };

  if (index !== -1) {
    // 记录纠错历史
    if (!correction._history) correction._history = [];
    correction._history.push({ ...target[index], correctedAt: correction.timestamp });
    target[index] = { ...data, p: period, _corrected: true, _correctedAt: correction.timestamp };
  }

  return correction;
}

/**
 * 获取数据版本标注
 * @returns {object} 版本信息
 */
function getDataVersion() {
  return {
    ssq: { ...DATA_VERSION.ssq, recordCount: SSQ_DATA.length },
    dlt: { ...DATA_VERSION.dlt, recordCount: DLT_DATA.length },
    exportedAt: new Date().toISOString()
  };
}

/**
 * 数据统计概览
 * @param {string} type - 'ssq' | 'dlt' | 'all' (默认 'all')
 * @returns {object} 统计数据
 */
function getDataStats(type = 'all') {
  const stats = {};

  if (type === 'ssq' || type === 'all') {
    const redFreq = {}, blueFreq = {};
    SSQ_DATA.forEach(item => {
      item.r.forEach(n => { redFreq[n] = (redFreq[n] || 0) + 1; });
      blueFreq[item.b] = (blueFreq[item.b] || 0) + 1;
    });
    const redSorted = Object.entries(redFreq).sort((a, b) => b[1] - a[1]);
    const blueSorted = Object.entries(blueFreq).sort((a, b) => b[1] - a[1]);

    stats.ssq = {
      recordCount: SSQ_DATA.length,
      periodRange: { from: SSQ_DATA[SSQ_DATA.length - 1]?.p, to: SSQ_DATA[0]?.p },
      redBall: {
        range: { min: 1, max: 33 },
        hotNumbers: redSorted.slice(0, 6).map(e => ({ num: +e[0], freq: e[1] })),
        coldNumbers: redSorted.slice(-6).map(e => ({ num: +e[0], freq: e[1] }))
      },
      blueBall: {
        range: { min: 1, max: 16 },
        hotNumbers: blueSorted.slice(0, 4).map(e => ({ num: +e[0], freq: e[1] })),
        coldNumbers: blueSorted.slice(-4).map(e => ({ num: +e[0], freq: e[1] }))
      }
    };
  }

  if (type === 'dlt' || type === 'all') {
    const frontFreq = {}, backFreq = {};
    DLT_DATA.forEach(item => {
      item.f.forEach(n => { frontFreq[n] = (frontFreq[n] || 0) + 1; });
      item.b.forEach(n => { backFreq[n] = (backFreq[n] || 0) + 1; });
    });
    const frontSorted = Object.entries(frontFreq).sort((a, b) => b[1] - a[1]);
    const backSorted = Object.entries(backFreq).sort((a, b) => b[1] - a[1]);

    stats.dlt = {
      recordCount: DLT_DATA.length,
      periodRange: { from: DLT_DATA[DLT_DATA.length - 1]?.p, to: DLT_DATA[0]?.p },
      frontArea: {
        range: { min: 1, max: 35 },
        hotNumbers: frontSorted.slice(0, 5).map(e => ({ num: +e[0], freq: e[1] })),
        coldNumbers: frontSorted.slice(-5).map(e => ({ num: +e[0], freq: e[1] }))
      },
      backArea: {
        range: { min: 1, max: 12 },
        hotNumbers: backSorted.slice(0, 2).map(e => ({ num: +e[0], freq: e[1] })),
        coldNumbers: backSorted.slice(-2).map(e => ({ num: +e[0], freq: e[1] }))
      }
    };
  }

  return stats;
}

// 导出供外部调用
if (typeof window !== 'undefined') {
  window.DataLayer = {
    searchHistory,
    exportCSV,
    submitCorrection,
    getDataVersion,
    getDataStats
  };
}
