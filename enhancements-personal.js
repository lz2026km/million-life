/**
 * enhancements-personal.js
 * 5项个性化功能 + 4项工具功能
 * 配合主模块使用，存储于 localStorage
 */

(function(global) {
    'use strict';

    const PersonalEnhancements = {
        version: '1.0.0',

        // ==================== 内部状态 ====================
        _storageKey: 'million_life_personal',
        _state: {
            profile: { nickname: '幸运用户', avatar: 'default' },
            preferences: { theme: 'gold', algorithms: [], displayMode: 'card', soundEnabled: true },
            favorites: [],
            history: [],
            budget: { monthly: 200, spent: 0, records: [] },
            tracking: []
        },

        // ==================== 初始化 ====================
        init: function() {
            this._loadState();
            return this;
        },

        _loadState: function() {
            try {
                const saved = localStorage.getItem(this._storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    this._state = { ...this._state, ...parsed };
                }
            } catch (e) {
                console.warn('Failed to load personal state:', e);
            }
        },

        _saveState: function() {
            try {
                localStorage.setItem(this._storageKey, JSON.stringify(this._state));
            } catch (e) {
                console.warn('Failed to save personal state:', e);
            }
        },

        // ========== 1. 个人资料 (Profile) ==========
        /**
         * 获取/设置用户资料
         * @param {object} profile - { nickname, avatar } 或 null(获取)
         * @returns {object} 当前 profile
         */
        profile: function(profile) {
            if (profile === undefined) return { ...this._state.profile };
            this._state.profile = { ...this._state.profile, ...profile };
            this._saveState();
            return this._state.profile;
        },

        /**
         * 生成随机昵称
         * @returns {string} 随机昵称
         */
        generateNickname: function() {
            const prefixes = ['幸运', '财运', '福气', '吉祥', '如意', '开心', '快乐'];
            const suffixes = ['玩家', '之星', '达人', '高手', '富翁', '小子', '宝宝'];
            const p = prefixes[Math.floor(Math.random() * prefixes.length)];
            const s = suffixes[Math.floor(Math.random() * suffixes.length)];
            const num = Math.floor(Math.random() * 99) + 1;
            return `${p}${s}${num}`;
        },

        // ========== 2. 收藏夹 (Favorites) ==========
        /**
         * 添加号码到收藏夹
         * @param {object} numbers - { reds: [], blue: 13 } 或 { front: [], back: [] }
         * @param {string} type - 'ssq' | 'dlt'
         * @param {string} note - 备注 (可选)
         * @returns {object} 添加的收藏项
         */
        addFavorite: function(numbers, type = 'ssq', note = '') {
            const item = {
                id: Date.now(),
                type,
                numbers: JSON.parse(JSON.stringify(numbers)),
                note,
                createdAt: new Date().toISOString()
            };
            this._state.favorites.unshift(item);
            this._saveState();
            return item;
        },

        /**
         * 获取收藏列表
         * @returns {array} 收藏列表
         */
        getFavorites: function() {
            return this._state.favorites.map(f => ({ ...f }));
        },

        /**
         * 删除收藏
         * @param {number} id - 收藏ID
         * @returns {boolean} 是否成功
         */
        removeFavorite: function(id) {
            const idx = this._state.favorites.findIndex(f => f.id === id);
            if (idx > -1) {
                this._state.favorites.splice(idx, 1);
                this._saveState();
                return true;
            }
            return false;
        },

        /**
         * 更新收藏备注
         * @param {number} id - 收藏ID
         * @param {string} note - 新备注
         * @returns {boolean} 是否成功
         */
        updateFavoriteNote: function(id, note) {
            const item = this._state.favorites.find(f => f.id === id);
            if (item) {
                item.note = note;
                this._saveState();
                return true;
            }
            return false;
        },

        // ========== 3. 生成历史 (History) ==========
        /**
         * 记录生成历史
         * @param {array} results - 生成结果数组
         * @param {string} type - 'ssq' | 'dlt'
         * @param {array} algorithms - 使用的算法
         * @returns {object} 历史记录项
         */
        addHistory: function(results, type, algorithms = []) {
            const item = {
                id: Date.now(),
                type,
                results: JSON.parse(JSON.stringify(results)),
                algorithms: [...algorithms],
                createdAt: new Date().toISOString()
            };
            this._state.history.unshift(item);
            // 只保留最近100条
            if (this._state.history.length > 100) {
                this._state.history = this._state.history.slice(0, 100);
            }
            this._saveState();
            return item;
        },

        /**
         * 获取生成历史
         * @param {object} options - { limit, type, dateFrom, dateTo }
         * @returns {array} 过滤后的历史
         */
        getHistory: function(options = {}) {
            let filtered = [...this._state.history];
            if (options.type) {
                filtered = filtered.filter(h => h.type === options.type);
            }
            if (options.dateFrom) {
                const from = new Date(options.dateFrom);
                filtered = filtered.filter(h => new Date(h.createdAt) >= from);
            }
            if (options.dateTo) {
                const to = new Date(options.dateTo);
                filtered = filtered.filter(h => new Date(h.createdAt) <= to);
            }
            return filtered.slice(0, options.limit || 50);
        },

        /**
         * 清空历史
         * @returns {boolean} 是否成功
         */
        clearHistory: function() {
            this._state.history = [];
            this._saveState();
            return true;
        },

        /**
         * 删除单条历史
         * @param {number} id - 历史ID
         * @returns {boolean} 是否成功
         */
        removeHistory: function(id) {
            const idx = this._state.history.findIndex(h => h.id === id);
            if (idx > -1) {
                this._state.history.splice(idx, 1);
                this._saveState();
                return true;
            }
            return false;
        },

        // ========== 4. 用户偏好设置 (Preferences) ==========
        /**
         * 获取/设置用户偏好
         * @param {object} prefs - 新偏好 或 null(获取)
         * @returns {object} 当前偏好
         */
        preferences: function(prefs) {
            if (prefs === undefined) return { ...this._state.preferences };
            this._state.preferences = { ...this._state.preferences, ...prefs };
            this._saveState();
            return this._state.preferences;
        },

        /**
         * 设置算法选择
         * @param {array} algorithms - 算法数组
         * @returns {array} 更新后的偏好
         */
        setAlgorithmPreferences: function(algorithms) {
            this._state.preferences.algorithms = [...algorithms];
            this._saveState();
            return this._state.preferences.algorithms;
        },

        /**
         * 切换主题
         * @param {string} theme - 'gold' | 'blue' | 'purple'
         * @returns {string} 新主题
         */
        setTheme: function(theme) {
            this._state.preferences.theme = theme;
            this._saveState();
            return theme;
        },

        // ========== 5. 布局偏好 (Layout) ==========
        /**
         * 获取/设置显示模式
         * @param {string} mode - 'card' | 'compact' | 'list' 或 null(获取)
         * @returns {string} 当前模式
         */
        displayMode: function(mode) {
            if (mode === undefined) return this._state.preferences.displayMode || 'card';
            this._state.preferences.displayMode = mode;
            this._saveState();
            return mode;
        },

        /**
         * 获取布局配置
         * @returns {object} 布局配置
         */
        getLayoutConfig: function() {
            const mode = this._state.preferences.displayMode || 'card';
            const configs = {
                card: { ballSize: 36, showAnimation: true, density: 'normal' },
                compact: { ballSize: 28, showAnimation: false, density: 'dense' },
                list: { ballSize: 32, showAnimation: true, density: 'normal' }
            };
            return configs[mode] || configs.card;
        },

        // ========== 6. 工具：号码对比 (Compare Tool) ==========
        /**
         * 对比号码与历史开奖
         * @param {array} numbers - 待对比号码 { reds: [], blue: 13 }
         * @param {string} type - 'ssq' | 'dlt'
         * @param {number} periods - 对比最近多少期 (默认10)
         * @returns {object} 对比结果
         */
        compareWithHistory: function(numbers, type = 'ssq', periods = 10) {
            const data = type === 'ssq' ? SSQ_DATA : DLT_DATA;
            const results = [];
            const count = type === 'ssq' ? 6 : 5;

            for (let i = 0; i < Math.min(periods, data.length); i++) {
                const draw = data[i];
                const drawNums = type === 'ssq' ? draw.r : draw.f;
                const bonusNums = type === 'ssq' ? [draw.b] : draw.b;

                const userNums = type === 'ssq' ? numbers.reds : numbers.front;
                const userBonus = type === 'ssq' ? [numbers.blue] : numbers.back;

                // 计算红球/前区匹配数
                let matched = 0;
                const matchedNums = [];
                userNums.forEach(n => {
                    if (drawNums.includes(n)) {
                        matched++;
                        matchedNums.push(n);
                    }
                });

                // 计算蓝球/后区匹配数
                let bonusMatched = 0;
                userBonus.forEach(n => {
                    if (bonusNums.includes(n)) bonusMatched++;
                });

                results.push({
                    period: draw.p || draw.period,
                    matched,
                    bonusMatched,
                    total: count + (type === 'ssq' ? 1 : 2),
                    matchedNums,
                    bonusMatchedNums: userBonus.filter(n => bonusNums.includes(n))
                });
            }

            // 统计
            const best = results.reduce((a, b) => a.matched > b.matched ? a : b);
            const avgMatched = results.reduce((a, b) => a + b.matched, 0) / results.length;

            return {
                type,
                results,
                bestMatch: best,
                averageMatched: avgMatched.toFixed(1)
            };
        },

        // ========== 7. 工具：守号跟踪 (Tracking Tool) ==========
        /**
         * 添加守号计划
         * @param {object} numbers - 号码 { reds: [], blue: 13 }
         * @param {string} type - 'ssq' | 'dlt'
         * @param {string} name - 计划名称
         * @returns {object} 守号计划
         */
        addTracking: function(numbers, type, name = '') {
            const item = {
                id: Date.now(),
                name: name || `守号计划${this._state.tracking.length + 1}`,
                type,
                numbers: JSON.parse(JSON.stringify(numbers)),
                startDate: new Date().toISOString().slice(0, 10),
                checkCount: 0,
                bestMatch: 0,
                records: []
            };
            this._state.tracking.push(item);
            this._saveState();
            return item;
        },

        /**
         * 获取守号列表
         * @returns {array} 守号计划列表
         */
        getTrackingList: function() {
            return this._state.tracking.map(t => ({ ...t }));
        },

        /**
         * 更新守号记录（检查最新开奖）
         * @param {number} id - 计划ID
         * @returns {object|null} 更新后的记录
         */
        updateTracking: function(id) {
            const item = this._state.tracking.find(t => t.id === id);
            if (!item) return null;

            const data = item.type === 'ssq' ? SSQ_DATA : DLT_DATA;
            const draw = data[0];
            const drawNums = item.type === 'ssq' ? draw.r : draw.f;

            const userNums = item.type === 'ssq' ? item.numbers.reds : item.numbers.front;
            const matched = userNums.filter(n => drawNums.includes(n)).length;

            item.checkCount++;
            item.records.unshift({
                date: new Date().toISOString().slice(0, 10),
                period: draw.p || draw.period,
                matched
            });

            if (matched > item.bestMatch) {
                item.bestMatch = matched;
            }

            this._saveState();
            return { ...item };
        },

        /**
         * 删除守号计划
         * @param {number} id - 计划ID
         * @returns {boolean}
         */
        removeTracking: function(id) {
            const idx = this._state.tracking.findIndex(t => t.id === id);
            if (idx > -1) {
                this._state.tracking.splice(idx, 1);
                this._saveState();
                return true;
            }
            return false;
        },

        // ========== 8. 工具：预算管理 (Budget Tool) ==========
        /**
         * 获取/设置月预算
         * @param {number} amount - 预算金额 或 null(获取)
         * @returns {object} { monthly, spent, remaining }
         */
        budget: function(amount) {
            if (amount === undefined) {
                return {
                    monthly: this._state.budget.monthly,
                    spent: this._state.budget.spent,
                    remaining: Math.max(0, this._state.budget.monthly - this._state.budget.spent)
                };
            }
            this._state.budget.monthly = amount;
            this._state.budget.spent = 0;
            this._saveState();
            return this.budget();
        },

        /**
         * 记录消费
         * @param {number} amount - 消费金额
         * @param {string} note - 备注
         * @returns {object} 更新后的预算状态
         */
        recordExpense: function(amount, note = '') {
            this._state.budget.spent += amount;
            this._state.budget.records.push({
                date: new Date().toISOString().slice(0, 10),
                amount,
                note
            });
            this._saveState();
            return this.budget();
        },

        /**
         * 重置月消费（月初调用）
         * @returns {object} 重置后的预算状态
         */
        resetBudget: function() {
            this._state.budget.spent = 0;
            this._state.budget.records = [];
            this._saveState();
            return this.budget();
        },

        /**
         * 获取消费记录
         * @param {number} limit - 返回条数
         * @returns {array} 消费记录
         */
        getExpenseRecords: function(limit = 30) {
            return this._state.budget.records.slice(-limit).reverse();
        },

        // ========== 9. 工具：中奖统计 (Win Stats Tool) ==========
        /**
         * 记录中奖
         * @param {object} numbers - 号码
         * @param {string} type - 'ssq' | 'dlt'
         * @param {object} result - { matchedRed, matchedBlue, prize }
         * @returns {object} 统计更新后的记录
         */
        recordWin: function(numbers, type, result = {}) {
            const record = {
                id: Date.now(),
                type,
                numbers: JSON.parse(JSON.stringify(numbers)),
                matchedRed: result.matchedRed || 0,
                matchedBlue: result.matchedBlue || 0,
                prize: result.prize || 0,
                date: new Date().toISOString().slice(0, 10)
            };

            if (!this._state.budget.records) {
                this._state.budget.records = [];
            }

            // 累加奖金
            if (result.prize > 0) {
                this.recordExpense(-result.prize, '中奖返奖'); // 负数表示收入
            }

            return record;
        },

        /**
         * 获取中奖统计
         * @param {object} options - { type, dateFrom, dateTo }
         * @returns {object} 统计数据
         */
        getWinStats: function(options = {}) {
            const records = this.getExpenseRecords(365).filter(r => r.amount < 0);
            let filtered = records;

            if (options.type) {
                filtered = filtered.filter(r => r.type === options.type);
            }

            const totalWins = filtered.length;
            const totalPrize = filtered.reduce((a, b) => a + Math.abs(b.amount), 0);
            const avgPrize = totalWins > 0 ? (totalPrize / totalWins).toFixed(2) : 0;

            return {
                totalWins,
                totalPrize: totalPrize.toFixed(2),
                averagePrize: avgPrize
            };
        },

        // ========== 导出/导入 ==========
        /**
         * 导出所有数据
         * @returns {string} JSON 字符串
         */
        exportData: function() {
            return JSON.stringify(this._state, null, 2);
        },

        /**
         * 导入数据
         * @param {string} jsonStr - JSON 字符串
         * @returns {boolean} 是否成功
         */
        importData: function(jsonStr) {
            try {
                const data = JSON.parse(jsonStr);
                this._state = { ...this._state, ...data };
                this._saveState();
                return true;
            } catch (e) {
                console.error('Import failed:', e);
                return false;
            }
        },

        /**
         * 重置所有数据
         */
        resetAll: function() {
            this._state = {
                profile: { nickname: '幸运用户', avatar: 'default' },
                preferences: { theme: 'gold', algorithms: [], displayMode: 'card', soundEnabled: true },
                favorites: [],
                history: [],
                budget: { monthly: 200, spent: 0, records: [] },
                tracking: []
            };
            this._saveState();
        }
    };

    // 初始化
    PersonalEnhancements.init();

    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PersonalEnhancements;
    } else {
        global.PersonalEnhancements = PersonalEnhancements;
    }

})(typeof window !== 'undefined' ? window : global);