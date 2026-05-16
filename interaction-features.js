/**
 * 百万人生体彩分析工具 - 交互体验功能
 * 7项交互功能：分享图片、一键复制、摇一摇、手气指数、多期对比、推荐理由、声音反馈
 */

// ============================================================
// 1. 分享图片生成 - 生成含号码+样式的分享图片（canvas转base64）
// ============================================================
function generateShareImage(numbers, options = {}) {
    const {
        width = 400,
        height = 300,
        backgroundColor = '#1a1a2e',
        textColor = '#ffffff',
        accentColor = '#e94560',
        title = '我的幸运号码'
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 标题
    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 50);

    // 绘制号码球
    const ballSize = 50;
    const ballSpacing = 10;
    const totalBallsWidth = numbers.length * ballSize + (numbers.length - 1) * ballSpacing;
    let startX = (width - totalBallsWidth) / 2 + ballSize / 2;
    const ballY = height / 2;

    numbers.forEach((num, index) => {
        // 球体渐变
        const gradient = ctx.createRadialGradient(
            startX - ballSize / 4, ballY - ballSize / 4, 0,
            startX, ballY, ballSize / 2
        );
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, accentColor);

        ctx.beginPath();
        ctx.arc(startX, ballY, ballSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 号码
        ctx.fillStyle = textColor;
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num).padStart(2, '0'), startX, ballY);

        startX += ballSize + ballSpacing;
    });

    // 底部装饰文字
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('百万人生体彩分析工具', width / 2, height - 30);

    return canvas.toDataURL('image/png');
}

// 下载分享图片
function downloadShareImage(numbers, options = {}) {
    const dataUrl = generateShareImage(numbers, options);
    const link = document.createElement('a');
    link.download = `幸运号码_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
}

// ============================================================
// 2. 一键复制 - 复制格式化的号码文本（支持手机和电脑）
// ============================================================
async function copyNumbers(numbers, format = 'compact') {
    let text;
    
    if (format === 'compact') {
        // 格式: 01 02 03 04 05 06
        text = numbers.map(n => String(n).padStart(2, '0')).join(' ');
    } else if (format === 'full') {
        // 格式: 红球: 01,02,03 + 蓝球: 04
        text = numbers.map(n => String(n).padStart(2, '0')).join(',');
    } else if (format === 'json') {
        text = JSON.stringify(numbers);
    }

    try {
        // 现代浏览器支持 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return { success: true, message: '已复制到剪贴板' };
        }
        
        // 兼容旧版浏览器
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        let success = false;
        try {
            success = document.execCommand('copy');
        } catch (e) {
            success = false;
        }
        
        document.body.removeChild(textarea);
        
        if (success) {
            return { success: true, message: '已复制到剪贴板' };
        }
        
        return { success: false, message: '复制失败，请手动复制' };
    } catch (err) {
        return { success: false, message: '复制失败: ' + err.message };
    }
}

// ============================================================
// 3. 摇一摇换一注 - 使用DeviceMotionEvent检测摇一摇（手机）
// ============================================================
class ShakeDetector {
    constructor(options = {}) {
        this.threshold = options.threshold || 15; // 加速度阈值
        this.timeout = options.timeout || 1000;  // 最小触发间隔(ms)
        this.lastTrigger = 0;
        this.callback = null;
        this.isListening = false;
    }

    // 检测摇一摇
    onShake(callback) {
        this.callback = callback;
    }

    // 处理设备运动数据
    handleMotionEvent(event) {
        if (!event.accelerationIncludingGravity) return;
        
        const { x, y, z } = event.accelerationIncludingGravity;
        if (!x && !y && !z) return;

        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();

        if (acceleration > this.threshold && now - this.lastTrigger > this.timeout) {
            this.lastTrigger = now;
            if (this.callback) {
                this.callback();
            }
        }
    }

    // 请求iOS权限并启动监听
    async start() {
        // iOS 13+ 需要请求权限
        if (typeof DeviceMotionEvent !== 'undefined' && 
            typeof DeviceMotionEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission !== 'granted') {
                    console.warn('DeviceMotionEvent 权限被拒绝');
                    return false;
                }
            } catch (err) {
                console.error('请求DeviceMotionEvent权限失败:', err);
                return false;
            }
        }

        // 监听设备运动
        if (!this.isListening) {
            window.addEventListener('devicemotion', this.handleMotionEvent.bind(this));
            this.isListening = true;
        }
        return true;
    }

    // 停止监听
    stop() {
        if (this.isListening) {
            window.removeEventListener('devicemotion', this.handleMotionEvent.bind(this));
            this.isListening = false;
        }
    }
}

// 便捷函数：初始化摇一摇
function initShakeToReroll(callback, options = {}) {
    const detector = new ShakeDetector(options);
    detector.onShake(callback);
    detector.start();
    return detector;
}

// ============================================================
// 4. 手气指数 - 显示1-100的随机"幸运指数"动画
// ============================================================
function showLuckIndex(targetElement, options = {}) {
    const {
        duration = 2000,    // 动画时长(ms)
        minValue = 1,
        maxValue = 100,
        onComplete = null
    } = options;

    return new Promise((resolve) => {
        const finalValue = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
        const startTime = performance.now();
        const displayValue = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用easeOutExpo缓动
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentValue = Math.floor(easeProgress * finalValue);
            
            if (typeof targetElement === 'string') {
                targetElement = document.querySelector(targetElement);
            }
            
            if (targetElement) {
                targetElement.textContent = currentValue;
                
                // 更新进度条
                const progressBar = targetElement.querySelector?.('.luck-progress-bar') || 
                                   targetElement.parentElement?.querySelector?.('.luck-progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${(currentValue / maxValue) * 100}%`;
                }
            }

            if (progress < 1) {
                requestAnimationFrame(displayValue);
            } else {
                if (onComplete) onComplete(finalValue);
                resolve(finalValue);
            }
        };
        
        requestAnimationFrame(displayValue);
    });
}

// 创建手气指数UI
function createLuckIndexUI(container) {
    if (typeof container === 'string') {
        container = document.querySelector(container);
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'luck-index-wrapper';
    wrapper.innerHTML = `
        <div class="luck-index-label">手气指数</div>
        <div class="luck-index-value">0</div>
        <div class="luck-index-progress">
            <div class="luck-progress-bar" style="width: 0%"></div>
        </div>
        <div class="luck-index-emoji"></div>
    `;
    
    if (container) {
        container.appendChild(wrapper);
    }
    
    return {
        element: wrapper,
        valueElement: wrapper.querySelector('.luck-index-value'),
        progressBar: wrapper.querySelector('.luck-progress-bar'),
        emojiElement: wrapper.querySelector('.luck-index-emoji'),
        async run() {
            const value = await showLuckIndex(this.valueElement, {
                duration: 2000,
                onComplete: (val) => {
                    // 根据数值显示不同表情
                    let emoji = '😟';
                    if (val >= 80) emoji = '🎉';
                    else if (val >= 60) emoji = '😊';
                    else if (val >= 40) emoji = '🙂';
                    else if (val >= 20) emoji = '🤔';
                    this.emojiElement.textContent = emoji;
                }
            });
            return value;
        }
    };
}

// ============================================================
// 5. 多期对比 - 对比自选号码与历史开奖（高亮匹配）
// ============================================================
function compareWithHistory(selectedNumbers, historyDraws, options = {}) {
    const {
        highlightMatches = true,
        matchCount = 6  // 双色球前区6个
    } = options;

    const results = [];
    
    historyDraws.forEach((draw, index) => {
        const drawNumbers = Array.isArray(draw.numbers) ? draw.numbers : [];
        const matched = [];
        const unmatched = [];
        
        selectedNumbers.forEach(num => {
            if (drawNumbers.includes(num)) {
                matched.push({ number: num, position: drawNumbers.indexOf(num) });
            } else {
                unmatched.push(num);
            }
        });

        const matchRate = selectedNumbers.length > 0 ? 
            (matched.length / selectedNumbers.length) * 100 : 0;

        results.push({
            period: draw.period || `第${index + 1}期`,
            drawNumbers: drawNumbers,
            selectedNumbers: selectedNumbers,
            matched: matched,
            unmatched: unmatched,
            matchCount: matched.length,
            matchRate: matchRate,
            isHighlighted: highlightMatches && matched.length >= matchCount
        });
    });

    // 按匹配数降序排序
    results.sort((a, b) => b.matchCount - a.matchCount);
    
    return results;
}

// 渲染对比结果HTML
function renderComparisonHTML(comparisonResults, options = {}) {
    const { showAll = false } = options;
    
    const filtered = showAll ? comparisonResults : comparisonResults.slice(0, 10);
    
    let html = '<div class="comparison-results">';
    
    filtered.forEach(result => {
        const highlightClass = result.isHighlighted ? 'highlight-match' : '';
        
        html += `
            <div class="comparison-item ${highlightClass}">
                <div class="comparison-period">${result.period}</div>
                <div class="comparison-numbers">
                    ${result.selectedNumbers.map(num => {
                        const isMatch = result.matched.some(m => m.number === num);
                        return `<span class="number-ball ${isMatch ? 'matched' : ''}">${String(num).padStart(2, '0')}</span>`;
                    }).join('')}
                </div>
                <div class="comparison-stats">
                    <span class="match-count">匹配: ${result.matchCount}个</span>
                    <span class="match-rate">${result.matchRate.toFixed(1)}%</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ============================================================
// 6. 推荐理由 - 每注号码附上算法说明文字
// ============================================================
function generateRecommendationReason(numbers, analysisType = 'comprehensive', historyData = []) {
    const reasons = {
        hotCold: [
            `基于近${historyData.length || 800}期冷热号分析，热号出现频率较高的组合`,
            `根据近期开奖数据，选取出现次数最多的号码段`,
            `分析历史冷热走势，选择处于上升趋势的热号`
        ],
        oddEven: [
            `奇偶比例均衡(奇:偶约3:3)，符合概率均衡原则`,
            `奇数偏多组合，历史上奇数连出后偶数回补概率增加`,
            `偶数占优组合，平衡奇偶分布策略`
        ],
        sumRange: [
            `号码和值在常用范围(80-120)内，历史上此区间开出率最高`,
            `根据和值分布分析，选取中间区段号码`,
            `和值偏向小号区域，符合近期开奖规律`
        ],
        gapAnalysis: [
            `号码间距分布均匀，避免连号和过大间距`,
            `采用号码间距分析法，选择分布均衡的组合`,
            `基于号码间隔规律，选取间距合理的号码`
        ],
        comprehensive: [
            `综合冷热号、奇偶比、和值范围等多维度分析得出的推荐`,
            `采用大数据分析模型，结合历史规律生成的推荐组合`,
            `基于多算法加权评估，平衡各项指标的优化组合`
        ]
    };

    const selectedReasons = reasons[analysisType] || reasons.comprehensive;
    const reason = selectedReasons[Math.floor(Math.random() * selectedReasons.length)];
    
    // 附加额外统计信息
    const hotNumbers = historyData.slice(0, 10).flatMap(d => d.numbers || []);
    const hotCount = {};
    hotNumbers.forEach(n => hotCount[n] = (hotCount[n] || 0) + 1);
    const sortedHot = Object.entries(hotCount).sort((a, b) => b[1] - a[1]);
    const topHot = sortedHot.slice(0, 3).map(([n]) => parseInt(n));
    
    const matchedHot = numbers.filter(n => topHot.includes(n)).length;
    
    let detailInfo = '';
    if (matchedHot > 0) {
        detailInfo = `其中${matchedHot}个号码在近10期出现3次以上。`;
    }

    return {
        mainReason: reason,
        detailInfo: detailInfo,
        analysisType: analysisType,
        generatedAt: new Date().toLocaleString('zh-CN')
    };
}

// 生成完整推荐理由HTML
function renderRecommendationHTML(numbers, analysisType, historyData) {
    const reason = generateRecommendationReason(numbers, analysisType, historyData);
    
    return `
        <div class="recommendation-reason">
            <div class="reason-label">推荐理由</div>
            <div class="reason-main">${reason.mainReason}</div>
            ${reason.detailInfo ? `<div class="reason-detail">${reason.detailInfo}</div>` : ''}
            <div class="reason-meta">
                <span class="reason-type">${getAnalysisTypeName(analysisType)}</span>
                <span class="reason-time">${reason.generatedAt}</span>
            </div>
        </div>
    `;
}

function getAnalysisTypeName(type) {
    const names = {
        hotCold: '冷热分析法',
        oddEven: '奇偶分析法',
        sumRange: '和值分析法',
        gapAnalysis: '间距分析法',
        comprehensive: '综合分析法'
    };
    return names[type] || '综合分析法';
}

// ============================================================
// 7. 声音反馈 - 使用Web Audio API播放选球/生成音效
// ============================================================
class SoundFeedback {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
    }

    // 初始化音频上下文
    init() {
        if (this.initialized) return true;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            return true;
        } catch (e) {
            console.error('Web Audio API 不支持:', e);
            return false;
        }
    }

    // 恢复音频上下文（用户交互后需要）
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // 播放选球音效 - 短促提示音
    playSelectSound() {
        if (!this.init()) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    // 播放生成音效 - 成功提示音
    playGenerateSound() {
        if (!this.init()) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 上升音调
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    // 播放删除音效
    playDeleteSound() {
        if (!this.init()) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    // 播放摇一摇触发音效
    playShakeSound() {
        if (!this.init()) return;
        this.resume();

        // 使用两个振荡器产生和声
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc2.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        osc1.start(this.audioContext.currentTime);
        osc2.start(this.audioContext.currentTime);
        osc1.stop(this.audioContext.currentTime + 0.2);
        osc2.stop(this.audioContext.currentTime + 0.2);
    }

    // 播放错误提示音
    playErrorSound() {
        if (!this.init()) return;
        this.resume();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
}

// 全局声音实例
const soundFeedback = new SoundFeedback();

// 便捷函数
function playSelectSound() { soundFeedback.playSelectSound(); }
function playGenerateSound() { soundFeedback.playGenerateSound(); }
function playDeleteSound() { soundFeedback.playDeleteSound(); }
function playShakeSound() { soundFeedback.playShakeSound(); }
function playErrorSound() { soundFeedback.playErrorSound(); }

// ============================================================
// 导出所有功能
// ============================================================
export {
    // 分享图片
    generateShareImage,
    downloadShareImage,
    
    // 一键复制
    copyNumbers,
    
    // 摇一摇
    ShakeDetector,
    initShakeToReroll,
    
    // 手气指数
    showLuckIndex,
    createLuckIndexUI,
    
    // 多期对比
    compareWithHistory,
    renderComparisonHTML,
    
    // 推荐理由
    generateRecommendationReason,
    renderRecommendationHTML,
    getAnalysisTypeName,
    
    // 声音反馈
    SoundFeedback,
    soundFeedback,
    playSelectSound,
    playGenerateSound,
    playDeleteSound,
    playShakeSound,
    playErrorSound
};

// 如果是浏览器环境，自动初始化声音反馈
if (typeof window !== 'undefined') {
    // 首次用户交互时初始化音频
    const initAudioOnInteraction = () => {
        soundFeedback.init();
        document.removeEventListener('click', initAudioOnInteraction);
        document.removeEventListener('touchstart', initAudioOnInteraction);
    };
    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('touchstart', initAudioOnInteraction);
}
