/**
 * enhancements-ux.js
 * 10项用户体验增强功能 - 纯JS函数
 */

(function(global) {
    'use strict';

    const UXEnhancements = {
        version: '1.0.0',
        
        // ============ 内部状态 ============
        _state: {
            guideShown: false,
            guideStep: 0,
            keyboardShortcuts: {},
            soundEnabled: true,
            themeColor: '#3498db',
            fullscreen: false,
            numberStaging: [],
            numberColors: {},
            historyFilter: '',
            historySort: 'date-desc'
        },

        // ============ 1. 引导教程 showGuide ============
        /**
         * 启动引导教程
         * @param {object} steps - 教程步骤配置
         * @param {function} onComplete - 完成回调
         */
        showGuide: function(steps, onComplete) {
            const defaultSteps = [
                { target: '.gen-btn', title: '生成号码', content: '点击此处生成推荐号码' },
                { target: '.history-list', title: '历史记录', content: '查看历史生成记录' },
                { target: '.favorites', title: '收藏夹', content: '收藏心仪的号码组合' },
                { target: '.settings', title: '设置', content: '自定义主题和偏好' }
            ];
            const guideSteps = steps || defaultSteps;
            const state = this._state;
            
            if (state.guideShown) return;
            state.guideShown = true;
            state.guideStep = 0;

            // 创建引导层
            const overlay = document.createElement('div');
            overlay.id = 'ux-guide-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            const card = document.createElement('div');
            card.style.cssText = `
                background: #fff; border-radius: 12px; padding: 24px;
                max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;

            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                height: 4px; background: #eee; border-radius: 2px; margin-bottom: 16px;
            `;
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                height: 100%; background: #3498db; border-radius: 2px;
                transition: width 0.3s ease;
            `;
            progressBar.appendChild(progressFill);

            const title = document.createElement('h3');
            title.style.cssText = 'margin: 0 0 12px; color: #333; font-size: 18px;';

            const content = document.createElement('p');
            content.style.cssText = 'margin: 0 0 20px; color: #666; font-size: 14px; line-height: 1.5;';

            const btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

            const skipBtn = document.createElement('button');
            skipBtn.textContent = '跳过';
            skipBtn.style.cssText = `
                padding: 8px 16px; border: 1px solid #ddd; background: #fff;
                border-radius: 6px; cursor: pointer; color: #666;
            `;

            const nextBtn = document.createElement('button');
            nextBtn.textContent = '下一步';
            nextBtn.style.cssText = `
                padding: 8px 16px; border: none; background: #3498db;
                border-radius: 6px; cursor: pointer; color: #fff;
            `;

            btnGroup.appendChild(skipBtn);
            btnGroup.appendChild(nextBtn);
            card.appendChild(progressBar);
            card.appendChild(title);
            card.appendChild(content);
            card.appendChild(btnGroup);
            overlay.appendChild(card);
            document.body.appendChild(overlay);

            const renderStep = (index) => {
                const step = guideSteps[index];
                title.textContent = `${index + 1}. ${step.title}`;
                content.textContent = step.content;
                progressFill.style.width = `${((index + 1) / guideSteps.length) * 100}%`;
                nextBtn.textContent = index === guideSteps.length - 1 ? '完成' : '下一步';
                state.guideStep = index;

                // 高亮目标元素
                document.querySelectorAll('.ux-guide-highlight').forEach(el => {
                    el.classList.remove('ux-guide-highlight');
                    el.style.boxShadow = '';
                });
                const target = document.querySelector(step.target);
                if (target) {
                    target.classList.add('ux-guide-highlight');
                    target.style.boxShadow = '0 0 0 4px rgba(52, 152, 219, 0.5)';
                }
            };

            const closeGuide = (complete) => {
                document.querySelectorAll('.ux-guide-highlight').forEach(el => {
                    el.classList.remove('ux-guide-highlight');
                    el.style.boxShadow = '';
                });
                overlay.remove();
                state.guideShown = false;
                if (complete && onComplete) onComplete();
            };

            skipBtn.onclick = () => closeGuide(false);
            nextBtn.onclick = () => {
                if (state.guideStep < guideSteps.length - 1) {
                    renderStep(state.guideStep + 1);
                } else {
                    closeGuide(true);
                }
            };

            renderStep(0);
            return overlay;
        },

        // ============ 2. 快捷键 initKeyboardShortcuts ============
        /**
         * 初始化键盘快捷键
         * @param {object} shortcuts - 快捷键配置 { key: { handler, description, scope } }
         */
        initKeyboardShortcuts: function(shortcuts) {
            const defaultShortcuts = {
                'g': { handler: () => document.querySelector('.gen-btn')?.click(), description: '生成号码' },
                'f': { handler: () => document.querySelector('.filter-input')?.focus(), description: '搜索过滤' },
                's': { handler: () => this.toggleSound(), description: '音效开关' },
                't': { handler: () => this.toggleFullscreen(), description: '全屏模式' },
                'h': { handler: () => document.querySelector('.history-list')?.scrollIntoView(), description: '历史记录' },
                'Escape': { handler: () => document.exitFullscreen?.(), description: '退出全屏' },
                'Ctrl+Enter': { handler: () => document.querySelector('.confirm-btn')?.click(), description: '确认' }
            };
            
            const allShortcuts = { ...defaultShortcuts, ...shortcuts };
            this._state.keyboardShortcuts = allShortcuts;

            const handler = (e) => {
                const key = e.ctrlKey || e.metaKey ? `Ctrl+${e.key}` : e.key;
                const shortcut = allShortcuts[key] || allShortcuts[e.key];
                if (shortcut && (!shortcut.scope || shortcut.scope === document.activeElement?.dataset.scope)) {
                    e.preventDefault();
                    shortcut.handler();
                }
            };

            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        },

        // ============ 3. 批量生成 batchGenerate ============
        /**
         * 批量生成号码
         * @param {number} count - 生成数量
         * @param {function} generatorFn - 生成函数 (index) => number[]
         * @param {object} options - 配置 { onProgress, onComplete, delay }
         */
        batchGenerate: function(count, generatorFn, options = {}) {
            const defaults = { onProgress: null, onComplete: null, delay: 0 };
            const opts = { ...defaults, ...options };
            const results = [];

            let completed = 0;
            const processNext = () => {
                if (completed >= count) {
                    if (opts.onComplete) opts.onComplete(results);
                    return;
                }
                const numbers = generatorFn(completed);
                results.push(numbers);
                completed++;
                if (opts.onProgress) opts.onProgress(completed, count, numbers);
                if (opts.delay > 0) {
                    setTimeout(processNext, opts.delay);
                } else {
                    processNext();
                }
            };

            processNext();
            return results;
        },

        // ============ 4. 号码暂存区 numberStaging ============
        /**
         * 添加号码到暂存区
         * @param {number[]} numbers - 号码数组
         * @param {string} label - 标签
         */
        addToStaging: function(numbers, label = '') {
            const staging = this._state.numberStaging;
            const id = Date.now();
            staging.push({ id, numbers: [...numbers], label, time: new Date() });
            this._renderStagingArea();
            return id;
        },

        /**
         * 从暂存区移除
         * @param {number} id - 记录ID
         */
        removeFromStaging: function(id) {
            const staging = this._state.numberStaging;
            const index = staging.findIndex(item => item.id === id);
            if (index > -1) {
                staging.splice(index, 1);
                this._renderStagingArea();
                return true;
            }
            return false;
        },

        /**
         * 清空暂存区
         */
        clearStaging: function() {
            this._state.numberStaging = [];
            this._renderStagingArea();
        },

        /**
         * 获取暂存区数据
         */
        getStaging: function() {
            return [...this._state.numberStaging];
        },

        /**
         * 渲染暂存区UI
         */
        _renderStagingArea: function() {
            let container = document.getElementById('ux-staging-area');
            if (!container) {
                container = document.createElement('div');
                container.id = 'ux-staging-area';
                container.style.cssText = `
                    position: fixed; bottom: 20px; right: 20px;
                    width: 280px; max-height: 300px;
                    background: #fff; border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    padding: 16px; z-index: 1000; overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                `;
                document.body.appendChild(container);
            }

            const staging = this._state.numberStaging;
            if (staging.length === 0) {
                container.innerHTML = '<div style="color:#999;text-align:center;font-size:13px;">暂存区为空</div>';
                return;
            }

            container.innerHTML = `
                <div style="font-size:14px;font-weight:600;color:#333;margin-bottom:12px;">
                    暂存区 (${staging.length})
                </div>
                <div style="max-height:220px;overflow-y:auto;">
                    ${staging.map(item => `
                        <div style="display:flex;align-items:center;justify-content:space-between;
                                    padding:8px;background:#f8f9fa;border-radius:8px;margin-bottom:8px;">
                            <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1;">
                                ${item.numbers.map(n => `
                                    <span style="padding:2px 8px;background:${this._state.numberColors[n] || '#eee'};
                                                border-radius:4px;font-size:12px;">${String(n).padStart(2,'0')}</span>
                                `).join('')}
                            </div>
                            <button onclick="UXEnhancements.removeFromStaging(${item.id})"
                                    style="border:none;background:#ff4444;color:#fff;border-radius:4px;
                                           padding:4px 8px;cursor:pointer;font-size:11px;margin-left:8px;">×</button>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        // ============ 5. 号码标记颜色 setNumberColor ============
        /**
         * 设置号码颜色标记
         * @param {number} number - 号码
         * @param {string} color - 颜色值
         */
        setNumberColor: function(number, color) {
            if (color) {
                this._state.numberColors[number] = color;
            } else {
                delete this._state.numberColors[number];
            }
            // 触发颜色更新事件
            document.dispatchEvent(new CustomEvent('numberColorChanged', {
                detail: { number, color: this._state.numberColors[number] }
            }));
        },

        /**
         * 批量设置号码颜色
         * @param {object} colorMap - { number: color }
         */
        setNumberColors: function(colorMap) {
            Object.assign(this._state.numberColors, colorMap);
            document.dispatchEvent(new CustomEvent('numberColorChanged', {
                detail: { colors: this._state.numberColors }
            }));
        },

        /**
         * 获取号码颜色
         * @param {number} number - 号码
         */
        getNumberColor: function(number) {
            return this._state.numberColors[number] || null;
        },

        /**
         * 获取所有颜色标记
         */
        getAllNumberColors: function() {
            return { ...this._state.numberColors };
        },

        // ============ 6. 搜索过滤 filterHistory ============
        /**
         * 过滤历史记录
         * @param {array} history - 历史记录数组
         * @param {string} keyword - 搜索关键词
         * @param {function} formatter - 格式化函数 (item) => string
         */
        filterHistory: function(history, keyword, formatter) {
            if (!keyword || !keyword.trim()) return history;
            const lower = keyword.toLowerCase().trim();
            return history.filter(item => {
                const text = formatter ? formatter(item) : JSON.stringify(item);
                return text.toLowerCase().includes(lower);
            });
        },

        /**
         * 创建搜索过滤器UI
         * @param {HTMLElement} container - 容器
         * @param {function} onFilter - 过滤回调 (filteredHistory) => void
         * @param {array} historyRef - 历史记录引用
         * @param {function} formatter - 格式化函数
         */
        createFilterUI: function(container, onFilter, historyRef, formatter) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex; gap: 8px; margin-bottom: 12px;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            `;

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = '搜索历史记录...';
            input.style.cssText = `
                flex: 1; padding: 10px 14px; border: 1px solid #ddd;
                border-radius: 8px; font-size: 14px; outline: none;
                transition: border-color 0.2s;
            `;
            input.onfocus = () => input.style.borderColor = '#3498db';
            input.onblur = () => input.style.borderColor = '#ddd';

            const clearBtn = document.createElement('button');
            clearBtn.textContent = '×';
            clearBtn.title = '清除搜索';
            clearBtn.style.cssText = `
                width: 36px; height: 36px; border: 1px solid #ddd;
                background: #fff; border-radius: 8px; cursor: pointer;
                font-size: 18px; color: #666;
            `;
            clearBtn.onclick = () => {
                input.value = '';
                this._state.historyFilter = '';
                if (onFilter) onFilter(historyRef);
            };

            input.oninput = () => {
                this._state.historyFilter = input.value;
                if (onFilter) {
                    const filtered = this.filterHistory(historyRef, input.value, formatter);
                    onFilter(filtered);
                }
            };

            wrapper.appendChild(input);
            wrapper.appendChild(clearBtn);
            container.appendChild(wrapper);
            return wrapper;
        },

        // ============ 7. 排序切换 sortHistory ============
        /**
         * 排序历史记录
         * @param {array} history - 历史记录数组
         * @param {string} sortKey - 排序字段
         * @param {string} order - 排序顺序 'asc' | 'desc'
         */
        sortHistory: function(history, sortKey = 'date', order = 'desc') {
            const sorted = [...history];
            sorted.sort((a, b) => {
                let valA = a[sortKey];
                let valB = b[sortKey];
                if (valA instanceof Date) valA = valA.getTime();
                if (valB instanceof Date) valB = valB.getTime();
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            });
            return sorted;
        },

        /**
         * 创建排序切换UI
         * @param {HTMLElement} container - 容器
         * @param {array} options - [{ key, label }]
         * @param {function} onSort - 排序回调 (sortedHistory) => void
         * @param {array} historyRef - 历史记录引用
         */
        createSortUI: function(container, options, onSort, historyRef) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex; gap: 8px; margin-bottom: 12px;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            `;

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.textContent = opt.label;
                btn.dataset.sort = opt.key;
                btn.style.cssText = `
                    padding: 8px 14px; border: 1px solid #ddd;
                    background: #fff; border-radius: 8px; cursor: pointer;
                    font-size: 13px; color: #666; transition: all 0.2s;
                `;
                btn.onclick = () => {
                    wrapper.querySelectorAll('button').forEach(b => {
                        b.style.background = '#fff';
                        b.style.color = '#666';
                    });
                    btn.style.background = '#3498db';
                    btn.style.color = '#fff';
                    this._state.historySort = opt.key;
                    const sorted = this.sortHistory(historyRef, opt.key, 'desc');
                    if (onSort) onSort(sorted);
                };
                wrapper.appendChild(btn);
            });

            container.appendChild(wrapper);
            return wrapper;
        },

        // ============ 8. 全屏模式 toggleFullscreen ============
        /**
         * 切换全屏模式
         * @param {HTMLElement} target - 全屏目标元素，默认 document.body
         */
        toggleFullscreen: function(target) {
            const el = target || document.documentElement;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                const requestFS = el.requestFullscreen || el.webkitRequestFullscreen;
                if (requestFS) {
                    requestFS.call(el).then(() => {
                        this._state.fullscreen = true;
                        document.dispatchEvent(new CustomEvent('fullscreenChanged', { detail: true }));
                    });
                }
            } else {
                const exitFS = document.exitFullscreen || document.webkitExitFullscreen;
                if (exitFS) {
                    exitFS.call(document).then(() => {
                        this._state.fullscreen = false;
                        document.dispatchEvent(new CustomEvent('fullscreenChanged', { detail: false }));
                    });
                }
            }
        },

        /**
         * 获取当前全屏状态
         */
        isFullscreen: function() {
            return !!(document.fullscreenElement || document.webkitFullscreenElement);
        },

        // ============ 9. 音效开关 toggleSound ============
        /**
         * 切换音效开关
         */
        toggleSound: function() {
            this._state.soundEnabled = !this._state.soundEnabled;
            document.dispatchEvent(new CustomEvent('soundChanged', {
                detail: { enabled: this._state.soundEnabled }
            }));
            return this._state.soundEnabled;
        },

        /**
         * 设置音效开关
         * @param {boolean} enabled
         */
        setSound: function(enabled) {
            this._state.soundEnabled = !!enabled;
            document.dispatchEvent(new CustomEvent('soundChanged', {
                detail: { enabled: this._state.soundEnabled }
            }));
        },

        /**
         * 获取音效状态
         */
        isSoundEnabled: function() {
            return this._state.soundEnabled;
        },

        /**
         * 播放音效
         * @param {string} type - 音效类型 'success' | 'error' | 'click'
         */
        playSound: function(type) {
            if (!this._state.soundEnabled) return;
            const sounds = {
                success: { freq: 880, dur: 150 },
                error: { freq: 220, dur: 300 },
                click: { freq: 440, dur: 50 }
            };
            const cfg = sounds[type] || sounds.click;
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = cfg.freq;
                gain.gain.value = 0.1;
                osc.start();
                osc.stop(ctx.currentTime + cfg.dur / 1000);
            } catch (e) {
                // AudioContext not available
            }
        },

        // ============ 10. 主题色切换 setThemeColor ============
        /**
         * 设置主题色
         * @param {string} color - 颜色值
         * @param {string} scope - 应用范围 'primary' | 'all'
         */
        setThemeColor: function(color, scope = 'primary') {
            this._state.themeColor = color;
            const root = document.documentElement;
            
            if (scope === 'all' || scope === 'primary') {
                root.style.setProperty('--theme-primary', color);
                root.style.setProperty('--ux-primary-color', color);
            }
            
            // 计算深浅变体
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const lighter = `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
            const darker = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
            
            root.style.setProperty('--theme-primary-light', lighter);
            root.style.setProperty('--theme-primary-dark', darker);

            document.dispatchEvent(new CustomEvent('themeColorChanged', {
                detail: { color, lighter, darker }
            }));
        },

        /**
         * 获取当前主题色
         */
        getThemeColor: function() {
            return this._state.themeColor;
        },

        /**
         * 重置主题色
         */
        resetThemeColor: function() {
            this.setThemeColor('#3498db');
        },

        // ============ 预设主题色 ============
        presetColors: [
            '#3498db', // 蓝色
            '#e74c3c', // 红色
            '#2ecc71', // 绿色
            '#9b59b6', // 紫色
            '#f39c12', // 橙色
            '#1abc9c', // 青色
            '#34495e', // 深灰
            '#e91e63'  // 粉色
        ],

        /**
         * 创建主题色选择器UI
         * @param {HTMLElement} container - 容器
         * @param {function} onSelect - 选择回调 (color) => void
         */
        createThemeColorPicker: function(container, onSelect) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex; gap: 8px; flex-wrap: wrap;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            `;

            this.presetColors.forEach(color => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    width: 32px; height: 32px; border-radius: 50%;
                    background: ${color}; border: 3px solid transparent;
                    cursor: pointer; transition: transform 0.2s, border-color 0.2s;
                `;
                if (color === this._state.themeColor) {
                    btn.style.borderColor = '#333';
                }
                btn.onmouseenter = () => btn.style.transform = 'scale(1.15)';
                btn.onmouseleave = () => btn.style.transform = 'scale(1)';
                btn.onclick = () => {
                    this.setThemeColor(color);
                    wrapper.querySelectorAll('button').forEach(b => b.style.borderColor = 'transparent');
                    btn.style.borderColor = '#333';
                    if (onSelect) onSelect(color);
                };
                wrapper.appendChild(btn);
            });

            container.appendChild(wrapper);
            return wrapper;
        }
    };

    // 暴露到全局
    global.UXEnhancements = UXEnhancements;

})(typeof window !== 'undefined' ? window : this);
