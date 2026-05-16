/**
 * 百万人生体彩分析工具 - UI/UX功能模块 v3.0
 * 清新简约风格
 */

// ============ 双语支持 (i18n) ============
const i18n = {
  zh: {
    // 通用
    appName: '百万人生体彩分析',
    loading: '加载中...',
    empty: '暂无数据',
    confirm: '确认',
    cancel: '取消',
    delete: '删除',
    copy: '复制',
    share: '分享',
    print: '打印',
    save: '保存',
    close: '关闭',
    success: '操作成功',
    fail: '操作失败',

    // 收藏功能
    favorites: '我的收藏',
    addFavorite: '收藏号码',
    removeFavorite: '取消收藏',
    favoriteSuccess: '已添加到收藏',
    favoriteFull: '收藏已满（最多50注）',
    favoriteEmpty: '暂无收藏记录',

    // 历史记录
    history: '历史记录',
    historyEmpty: '暂无历史记录',
    clearHistory: '清空历史',

    // 深色模式
    darkMode: '深色模式',
    lightMode: '浅色模式',
    themeToggle: '切换主题',

    // 分享
    shareTitle: '分享我的幸运号码',
    shareCopySuccess: '分享内容已复制',

    // 打印
    printTitle: '推荐号码单',
    printDate: '打印日期',

    // 复制
    copySuccess: '号码已复制到剪贴板',

    // 空状态
    emptyNumbers: '暂无推荐号码',
    emptyResult: '暂无分析结果',

    // 响应式提示
    mobileTip: '手机端',
    desktopTip: '电脑端'
  },
  en: {
    // General
    appName: 'Million Life Lottery Analysis',
    loading: 'Loading...',
    empty: 'No Data',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    copy: 'Copy',
    share: 'Share',
    print: 'Print',
    save: 'Save',
    close: 'Close',
    success: 'Success',
    fail: 'Failed',

    // Favorites
    favorites: 'My Favorites',
    addFavorite: 'Add to Favorites',
    removeFavorite: 'Remove Favorite',
    favoriteSuccess: 'Added to favorites',
    favoriteFull: 'Favorites full (max 50)',
    favoriteEmpty: 'No favorites yet',

    // History
    history: 'History',
    historyEmpty: 'No history records',
    clearHistory: 'Clear History',

    // Dark mode
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    themeToggle: 'Toggle Theme',

    // Share
    shareTitle: 'Share My Lucky Numbers',
    shareCopySuccess: 'Share content copied',

    // Print
    printTitle: 'Recommendation List',
    printDate: 'Print Date',

    // Copy
    copySuccess: 'Numbers copied to clipboard',

    // Empty state
    emptyNumbers: 'No recommended numbers',
    emptyResult: 'No analysis results',

    // Responsive tips
    mobileTip: 'Mobile',
    desktopTip: 'Desktop'
  }
};

// 当前语言
let currentLang = localStorage.getItem('lang') || 'zh';

/**
 * 获取当前语言的文本
 * @param {string} key - i18n键名
 * @returns {string} 对应语言文本
 */
function t(key) {
  return i18n[currentLang][key] || key;
}

/**
 * 切换语言
 * @param {string} lang - 'zh' 或 'en'
 */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  // 触发语言切换事件
  window.dispatchEvent(new CustomEvent('langChange', { detail: { lang } }));
}

/**
 * 获取当前语言
 * @returns {string} 当前语言代码
 */
function getCurrentLanguage() {
  return currentLang;
}

// ============ 深色模式 ============
const DARK_THEME = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  accent: '#3B82F6'
};

const LIGHT_THEME = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  accent: '#3B82F6'
};

let isDarkMode = localStorage.getItem('darkMode') === 'true';

/**
 * 初始化主题
 */
function initTheme() {
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  document.documentElement.style.setProperty('--bg', theme.bg);
  document.documentElement.style.setProperty('--card', theme.card);
  document.documentElement.style.setProperty('--text', theme.text);
  document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
  document.documentElement.style.setProperty('--border', theme.border);
  document.documentElement.style.setProperty('--accent', theme.accent);
  
  document.body.classList.toggle('dark-mode', isDarkMode);
}

/**
 * 切换深色模式
 */
function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);
  initTheme();
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDarkMode } }));
}

/**
 * 获取当前是否为深色模式
 * @returns {boolean}
 */
function getIsDarkMode() {
  return isDarkMode;
}

// ============ 收藏功能 ============
const MAX_FAVORITES = 50;
const FAVORITES_KEY = 'million_life_favorites';

/**
 * 获取所有收藏
 * @returns {Array} 收藏数组
 */
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * 添加收藏
 * @param {Object} numberObj - 号码对象 { id, numbers, type, createdAt }
 * @returns {Object} { success: boolean, message: string }
 */
function addFavorite(numberObj) {
  const favorites = getFavorites();
  
  if (favorites.length >= MAX_FAVORITES) {
    return { success: false, message: t('favoriteFull') };
  }
  
  // 检查是否已存在
  const exists = favorites.some(f => f.id === numberObj.id);
  if (exists) {
    return { success: false, message: '号码已存在' };
  }
  
  favorites.unshift({
    ...numberObj,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent('favoritesChange', { detail: { favorites } }));
  
  return { success: true, message: t('favoriteSuccess') };
}

/**
 * 移除收藏
 * @param {string} id - 收藏ID
 * @returns {boolean} 是否成功
 */
function removeFavorite(id) {
  let favorites = getFavorites();
  favorites = favorites.filter(f => f.id !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent('favoritesChange', { detail: { favorites } }));
  return true;
}

/**
 * 检查号码是否已收藏
 * @param {string} id - 号码ID
 * @returns {boolean}
 */
function isFavorited(id) {
  const favorites = getFavorites();
  return favorites.some(f => f.id === id);
}

/**
 * 清空所有收藏
 */
function clearFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('favoritesChange', { detail: { favorites: [] } }));
}

// ============ 历史记录 ============
const MAX_HISTORY = 20;
const HISTORY_KEY = 'million_life_history';

/**
 * 获取历史记录
 * @returns {Array} 历史记录数组
 */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * 添加历史记录
 * @param {Object} record - 记录对象 { id, numbers, type, analysis, createdAt }
 * @returns {boolean} 是否成功
 */
function addHistory(record) {
  let history = getHistory();
  
  history.unshift({
    ...record,
    createdAt: new Date().toISOString()
  });
  
  // 限制最大条数
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent('historyChange', { detail: { history } }));
  return true;
}

/**
 * 清空历史记录
 */
function clearHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent('historyChange', { detail: { history: [] } }));
}

// ============ 加载动画 ============
/**
 * 显示骨架屏/加载动画
 * @param {string} containerId - 容器ID
 * @param {string} type - 'skeleton' | 'spinner' | 'pulse'
 */
function showLoading(containerId, type = 'skeleton') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const loadingHTML = {
    skeleton: `
      <div class="skeleton-container">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    `,
    spinner: `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>${t('loading')}</span>
      </div>
    `,
    pulse: `
      <div class="loading-pulse">
        <div class="pulse-dot"></div>
        <span>${t('loading')}</span>
      </div>
    `
  };
  
  container.innerHTML = loadingHTML[type];
  container.classList.add('loading-active');
}

/**
 * 隐藏加载动画
 * @param {string} containerId - 容器ID
 */
function hideLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.classList.remove('loading-active');
}

// ============ 空状态 ============
/**
 * 显示空状态
 * @param {string} containerId - 容器ID
 * @param {string} type - 空状态类型
 * @param {Object} options - 自定义选项
 */
function showEmptyState(containerId, type = 'default', options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const emptyMessages = {
    default: t('empty'),
    numbers: t('emptyNumbers'),
    result: t('emptyResult'),
    favorites: t('favoriteEmpty'),
    history: t('historyEmpty')
  };
  
  const icon = options.icon || '📭';
  const message = options.message || emptyMessages[type] || t('empty');
  
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-message">${message}</div>
      ${options.action ? `<button class="empty-action" onclick="${options.action}">${options.actionText || t('confirm')}</button>` : ''}
    </div>
  `;
}

/**
 * 清除空状态
 * @param {string} containerId - 容器ID
 */
function clearEmptyState(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) {
    container.removeChild(emptyState);
  }
}

// ============ 号码复制 ============
/**
 * 复制号码到剪贴板
 * @param {string|Array} numbers - 号码字符串或数组
 * @returns {Promise<boolean>} 是否成功
 */
async function copyToClipboard(numbers) {
  try {
    const text = Array.isArray(numbers) ? numbers.join(', ') : numbers;
    await navigator.clipboard.writeText(text);
    showToast(t('copySuccess'), 'success');
    return true;
  } catch (err) {
    // 降级处理
    const textarea = document.createElement('textarea');
    textarea.value = Array.isArray(numbers) ? numbers.join(', ') : numbers;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      showToast(t('copySuccess'), 'success');
      return true;
    } catch {
      showToast(t('fail'), 'error');
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// ============ 结果分享 ============
/**
 * 生成分享受文本
 * @param {Object} data - 分享数据 { numbers, type, analysis, date }
 * @returns {string} 分享文本
 */
function generateShareText(data) {
  const { numbers, type, analysis, date } = data;
  const numberStr = Array.isArray(numbers) ? numbers.join(' ') : numbers;
  const dateStr = date || new Date().toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US');
  
  const template = {
    zh: `
🎯 ${t('appName')}
📅 ${dateStr}
🎰 推荐号码: ${numberStr}
📊 类型: ${type || '未知'}
${analysis ? `💡 分析: ${analysis}` : ''}
---
由百万人生体彩分析工具生成
    `.trim(),
    en: `
🎯 ${t('appName')}
📅 ${dateStr}
🎰 Recommended: ${numberStr}
📊 Type: ${type || 'Unknown'}
${analysis ? `💡 Analysis: ${analysis}` : ''}
---
Generated by Million Life Lottery Analysis
    `.trim()
  };
  
  return template[currentLang];
}

/**
 * 分享功能
 * @param {Object} data - 分享数据
 * @returns {Promise<void>}
 */
async function shareResult(data) {
  const shareText = generateShareText(data);
  
  // 尝试使用原生分享API
  if (navigator.share) {
    try {
      await navigator.share({
        title: t('shareTitle'),
        text: shareText
      });
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        // 如果用户取消分享，降级到复制
        await copyToClipboard(shareText);
      }
    }
  } else {
    // 降级到复制
    await copyToClipboard(shareText);
    showToast(t('shareCopySuccess'), 'success');
  }
}

// ============ 打印导出 ============
/**
 * 生成可打印的内容并调用打印
 * @param {Object} data - 打印数据 { numbers, type, analysis, date }
 */
function printRecommendation(data) {
  const { numbers, type, analysis } = data;
  const numberStr = Array.isArray(numbers) ? numbers.join(' ') : numbers;
  const dateStr = new Date().toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US');
  const title = t('printTitle');
  
  // 创建打印内容
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px; 
          color: #1a1a1a;
          max-width: 800px;
          margin: 0 auto;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3B82F6;
        }
        .header h1 { 
          font-size: 24px; 
          color: #3B82F6;
          margin-bottom: 8px;
        }
        .header .date { color: #666; font-size: 14px; }
        .section { margin-bottom: 24px; }
        .section-title { 
          font-size: 14px; 
          color: #666; 
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .numbers { 
          font-size: 28px; 
          font-weight: bold; 
          color: #3B82F6;
          letter-spacing: 4px;
          padding: 16px;
          background: #f0f7ff;
          border-radius: 8px;
          text-align: center;
        }
        .analysis { 
          font-size: 16px; 
          line-height: 1.6;
          color: #333;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .footer { 
          text-align: center; 
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #999;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .numbers { background: #e0f0ff !important; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="date">${t('printDate')}: ${dateStr}</div>
      </div>
      
      <div class="section">
        <div class="section-title">${currentLang === 'zh' ? '推荐号码' : 'Recommended Numbers'}</div>
        <div class="numbers">${numberStr}</div>
      </div>
      
      ${type ? `
      <div class="section">
        <div class="section-title">${currentLang === 'zh' ? '类型' : 'Type'}</div>
        <div class="analysis">${type}</div>
      </div>
      ` : ''}
      
      ${analysis ? `
      <div class="section">
        <div class="section-title">${currentLang === 'zh' ? '分析说明' : 'Analysis'}</div>
        <div class="analysis">${analysis}</div>
      </div>
      ` : ''}
      
      <div class="footer">
        ${t('appName')} | ${new Date().getFullYear()}
      </div>
    </body>
    </html>
  `;
  
  // 打开新窗口并打印
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

// ============ 响应式布局 ============
const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1920
};

/**
 * 获取当前设备类型
 * @returns {string} 'mobile' | 'tablet' | 'desktop' | 'wide'
 */
function getDeviceType() {
  const width = window.innerWidth;
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  if (width < BREAKPOINTS.wide) return 'desktop';
  return 'wide';
}

/**
 * 初始化响应式布局
 * @param {string} containerId - 主容器ID
 */
function initResponsiveLayout(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const handleResize = () => {
    const deviceType = getDeviceType();
    container.dataset.device = deviceType;
    
    // 添加对应类名
    container.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'device-wide');
    container.classList.add(`device-${deviceType}`);
    
    // 触发resize事件
    window.dispatchEvent(new CustomEvent('responsiveChange', { 
      detail: { deviceType, width: window.innerWidth } 
    }));
  };
  
  // 初始化
  handleResize();
  
  // 监听resize事件（防抖）
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 100);
  });
}

/**
 * 获取响应式CSS变量
 * @returns {Object} 响应式尺寸配置
 */
function getResponsiveConfig() {
  const deviceType = getDeviceType();
  
  const configs = {
    mobile: {
      fontSize: '14px',
      padding: '12px',
      cardPadding: '16px',
      gridColumns: 1,
      gap: '12px'
    },
    tablet: {
      fontSize: '15px',
      padding: '16px',
      cardPadding: '20px',
      gridColumns: 2,
      gap: '16px'
    },
    desktop: {
      fontSize: '16px',
      padding: '24px',
      cardPadding: '24px',
      gridColumns: 3,
      gap: '20px'
    },
    wide: {
      fontSize: '16px',
      padding: '32px',
      cardPadding: '28px',
      gridColumns: 4,
      gap: '24px'
    }
  };
  
  return configs[deviceType];
}

// ============ Toast提示 ============
/**
 * 显示Toast提示
 * @param {string} message - 提示消息
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - 显示时长(ms)
 */
function showToast(message, type = 'info', duration = 2000) {
  // 移除已有的toast
  const existingToast = document.querySelector('.toast-container');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = `toast-container toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;
  
  // 添加样式
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: toastIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  document.body.appendChild(toast);
  
  // 自动移除
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============ 导出所有功能 ============
const MillionLifeUI = {
  // i18n
  t,
  setLanguage,
  getCurrentLanguage,
  i18n,
  
  // 主题
  initTheme,
  toggleDarkMode,
  getIsDarkMode,
  isDarkMode,
  DARK_THEME,
  LIGHT_THEME,
  
  // 收藏
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorited,
  clearFavorites,
  MAX_FAVORITES,
  
  // 历史
  getHistory,
  addHistory,
  clearHistory,
  MAX_HISTORY,
  
  // 加载
  showLoading,
  hideLoading,
  
  // 空状态
  showEmptyState,
  clearEmptyState,
  
  // 复制
  copyToClipboard,
  
  // 分享
  shareResult,
  generateShareText,
  
  // 打印
  printRecommendation,
  
  // 响应式
  initResponsiveLayout,
  getDeviceType,
  getResponsiveConfig,
  BREAKPOINTS,
  
  // Toast
  showToast
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MillionLifeUI;
}
if (typeof window !== 'undefined') {
  window.MillionLifeUI = MillionLifeUI;
}

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    /* Toast动画 */
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(-50%) translateY(0); }
      to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
    
    /* 骨架屏样式 */
    .skeleton-container { padding: 16px; }
    .skeleton-line, .skeleton-card {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton 1.5s infinite;
      border-radius: 4px;
    }
    .skeleton-line { height: 16px; margin-bottom: 12px; }
    .skeleton-line.short { width: 60%; }
    .skeleton-card { height: 80px; margin-bottom: 12px; border-radius: 8px; }
    
    @keyframes skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* 加载动画 */
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 12px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-pulse {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 12px;
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      background: #3B82F6;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.5; }
    }
    
    /* 空状态 */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
    .empty-message { color: #94A3B8; font-size: 14px; margin-bottom: 16px; }
    .empty-action {
      padding: 8px 20px;
      background: #3B82F6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }
    .empty-action:hover { background: #2563EB; }
    
    /* 深色模式骨架屏 */
    .dark-mode .skeleton-line, .dark-mode .skeleton-card {
      background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
      background-size: 200% 100%;
    }
    
    /* 响应式网格 */
    [data-device="mobile"] .responsive-grid { grid-template-columns: 1fr !important; }
    [data-device="tablet"] .responsive-grid { grid-template-columns: repeat(2, 1fr) !important; }
    [data-device="desktop"] .responsive-grid { grid-template-columns: repeat(3, 1fr) !important; }
    [data-device="wide"] .responsive-grid { grid-template-columns: repeat(4, 1fr) !important; }
  `;
  document.head.appendChild(style);
});

console.log('✅ MillionLifeUI v3.0 已加载 - 10项UI/UX功能就绪');
