/**
 * enhancements-play.js
 * 5项玩法扩展功能：
 * - 十二生肖选号 generateByZodiac
 * - 五行八卦选号 generateByWuxing
 * - 手机尾号推荐 generateByPhoneLast4
 * - 自定义胆拖 generateByCustomDanTuo
 * - 号码模板 saveTemplate/loadTemplate/listTemplates
 */

(function(global) {
    'use strict';

    const PlayEnhancements = {
        version: '1.0.0',

        // ==================== 内部状态 ====================
        _storageKey: 'million_life_play_templates',
        _templates: [],

        // ==================== 初始化 ====================
        init: function() {
            this._loadTemplates();
            return this;
        },

        _loadTemplates: function() {
            try {
                const saved = localStorage.getItem(this._storageKey);
                if (saved) {
                    this._templates = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('Failed to load templates:', e);
                this._templates = [];
            }
        },

        _saveTemplates: function() {
            try {
                localStorage.setItem(this._storageKey, JSON.stringify(this._templates));
            } catch (e) {
                console.warn('Failed to save templates:', e);
            }
        },

        // ==================== 工具函数 ====================

        /**
         * 计算组合数 C(n, r)
         */
        _combination: function(n, r) {
            if (r > n || r < 0) return 0;
            if (r === 0 || r === n) return 1;
            let result = 1;
            for (let i = 0; i < r; i++) {
                result = result * (n - i) / (i + 1);
            }
            return result;
        },

        /**
         * 生成所有n选r的组合
         */
        _combinations: function(arr, r) {
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
        },

        /**
         * 校验双色球号码范围
         */
        _validateSSQ: function(reds, blues) {
            const errors = [];
            reds.forEach(n => {
                if (n < 1 || n > 33) errors.push(`红球${n}超出范围(1-33)`);
            });
            blues.forEach(n => {
                if (n < 1 || n > 16) errors.push(`蓝球${n}超出范围(1-16)`);
            });
            return errors;
        },

        /**
         * 校验大乐透号码范围
         */
        _validateDLT: function(front, back) {
            const errors = [];
            front.forEach(n => {
                if (n < 1 || n > 35) errors.push(`前区${n}超出范围(1-35)`);
            });
            back.forEach(n => {
                if (n < 1 || n > 12) errors.push(`后区${n}超出范围(1-12)`);
            });
            return errors;
        },

        // ==================== 1. 十二生肖选号 ====================

        /** 十二生肖列表 */
        ZODIAC_ANIMALS: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],

        /** 生肖幸运号映射（红球区间/蓝球区间） */
        ZODIAC_LUCKY_MAP: {
            '鼠': { redMin: 2, redMax: 32, redStep: 10, blueNums: [3, 9], elements: '水' },
            '牛': { redMin: 5, redMax: 35, redStep: 10, blueNums: [4, 10], elements: '土' },
            '虎': { redMin: 3, redMax: 33, redStep: 10, blueNums: [5, 11], elements: '木' },
            '兔': { redMin: 4, redMax: 34, redStep: 10, blueNums: [6, 12], elements: '木' },
            '龙': { redMin: 1, redMax: 31, redStep: 10, blueNums: [7, 13], elements: '土' },
            '蛇': { redMin: 6, redMax: 36, redStep: 10, blueNums: [8, 14], elements: '火' },
            '马': { redMin: 7, redMax: 37, redStep: 10, blueNums: [9, 15], elements: '火' },
            '羊': { redMin: 8, redMax: 38, redStep: 10, blueNums: [10, 16], elements: '土' },
            '猴': { redMin: 9, redMax: 29, redStep: 10, blueNums: [1, 7], elements: '金' },
            '鸡': { redMin: 10, redMax: 30, redStep: 10, blueNums: [2, 8], elements: '金' },
            '狗': { redMin: 11, redMax: 31, redStep: 10, blueNums: [3, 9], elements: '土' },
            '猪': { redMin: 12, redMax: 32, redStep: 10, blueNums: [4, 10], elements: '水' }
        },

        /**
         * 根据生肖名称生成幸运号码
         * @param {string} zodiacName - 生肖名称（鼠/牛/虎/兔/龙/蛇/马/羊/猴/鸡/狗/猪）
         * @param {Object} options - 配置选项
         * @param {string} options.type - 'ssq' 双色球 或 'dlt' 大乐透
         * @param {number} options.count - 生成注数，默认1
         * @param {boolean} options.useLuckyRange - 是否使用幸运号段，默认true
         * @returns {Object} 包含生成结果和统计信息
         */
        generateByZodiac: function(zodiacName, options = {}) {
            const { type = 'ssq', count = 1, useLuckyRange = true } = options;
            const result = {
                zodiac: zodiacName,
                type: type,
                bets: [],
                totalBets: count,
                description: '',
                errors: []
            };

            const zodiacIndex = this.ZODIAC_ANIMALS.indexOf(zodiacName);
            if (zodiacIndex === -1) {
                result.errors.push(`无效生肖：${zodiacName}，有效值：${this.ZODIAC_ANIMALS.join(',')}`);
                return result;
            }

            const luckyInfo = this.ZODIAC_LUCKY_MAP[zodiacName];

            // 生成幸运红球池
            let redPool = [];
            if (useLuckyRange && luckyInfo) {
                // 使用生肖幸运号段
                for (let i = luckyInfo.redMin; i <= Math.min(luckyInfo.redMax, 33); i += luckyInfo.redStep) {
                    redPool.push(i);
                }
                // 确保有足够的号码
                if (redPool.length < 6) {
                    for (let i = 1; i <= 33; i++) {
                        if (!redPool.includes(i)) redPool.push(i);
                        if (redPool.length >= 15) break;
                    }
                }
            } else {
                // 全部号码池
                redPool = Array.from({ length: 33 }, (_, i) => i + 1);
            }

            // 蓝球池
            const bluePool = type === 'ssq'
                ? (luckyInfo ? luckyInfo.blueNums : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
                : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

            // 生成注单
            const seen = new Set();
            while (result.bets.length < count) {
                let reds, blue;

                if (type === 'ssq') {
                    // 双色球：红球33选6，蓝球16选1
                    const sortedRedPool = [...redPool].sort(() => Math.random() - 0.5);
                    reds = sortedRedPool.slice(0, 6).sort((a, b) => a - b);
                    blue = bluePool[Math.floor(Math.random() * bluePool.length)];

                    const key = reds.join(',') + '|' + blue;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    result.bets.push({
                        red: reds,
                        blue: blue,
                        formatted: `红球[${reds.join(',')}] 蓝球[${blue}]`
                    });
                } else {
                    // 大乐透：前区35选5，后区12选2
                    const sortedRedPool = [...redPool].sort(() => Math.random() - 0.5);
                    const front = sortedRedPool.slice(0, 5).sort((a, b) => a - b);
                    const backPool = [...bluePool].sort(() => Math.random() - 0.5);
                    const back = backPool.slice(0, 2).sort((a, b) => a - b);

                    const key = front.join(',') + '|' + back.join(',');
                    if (seen.has(key)) continue;
                    seen.add(key);

                    result.bets.push({
                        front: front,
                        back: back,
                        formatted: `前区[${front.join(',')}] 后区[${back.join(',')}]`
                    });
                }
            }

            result.description = `生肖【${zodiacName}】${luckyInfo ? '·' + luckyInfo.elements + '行' : ''}，生成${count}注`;

            return result;
        },

        /**
         * 根据出生年份获取生肖并生成号码
         * @param {number} year - 出生年份
         * @param {Object} options - 同 generateByZodiac
         * @returns {Object} 生成结果
         */
        generateByBirthYear: function(year, options = {}) {
            const baseYear = 2020; // 鼠年
            const baseIndex = 0;    // 鼠的索引
            const yearDiff = year - baseYear;
            const zodiacIndex = ((yearDiff % 12) + 12) % 12;
            const zodiac = this.ZODIAC_ANIMALS[zodiacIndex];
            return this.generateByZodiac(zodiac, options);
        },

        /**
         * 获取所有生肖信息
         * @returns {Array} 生肖信息列表
         */
        getAllZodiacInfo: function() {
            return this.ZODIAC_ANIMALS.map((zodiac, index) => ({
                index: index,
                name: zodiac,
                element: this.ZODIAC_LUCKY_MAP[zodiac]?.elements || '未知',
                blueNums: this.ZODIAC_LUCKY_MAP[zodiac]?.blueNums || [],
                description: `属${zodiac}，五行${this.ZODIAC_LUCKY_MAP[zodiac]?.elements || '未知'}`
            }));
        },

        // ==================== 2. 五行八卦选号 ====================

        /** 八卦名称 */
        BAGUA: ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'],

        /** 八卦对应数字（1-8） */
        BAGUA_NUMBERS: {
            '乾': 1, '兑': 2, '离': 3, '震': 4,
            '巽': 5, '坎': 6, '艮': 7, '坤': 8
        },

        /** 五行对应关系 */
        WUXING_ELEMENTS: {
            '金': { bagua: ['乾', '兑'], numbers: [4, 9, 14, 19, 24, 29], colors: ['白色', '金色'] },
            '木': { bagua: ['震', '巽'], numbers: [3, 8, 13, 18, 23, 28, 33], colors: ['绿色', '青色'] },
            '水': { bagua: ['坎'], numbers: [1, 6, 11, 16, 21, 26, 31], colors: ['黑色', '蓝色'] },
            '火': { bagua: ['离'], numbers: [2, 7, 12, 17, 22, 27, 32], colors: ['红色', '紫色'] },
            '土': { bagua: ['艮', '坤'], numbers: [5, 10, 15, 20, 25, 30], colors: ['黄色', '棕色'] }
        },

        /**
         * 五行八卦选号生成
         * @param {Object} params - 参数
         * @param {string} params.wuxing - 五行（金/木/水/火/土）
         * @param {string} params.bagua - 八卦（乾/兑/离/震/巽/坎/艮/坤），可选
         * @param {string} params.type - 'ssq' 或 'dlt'
         * @param {number} params.count - 生成注数
         * @returns {Object} 生成结果
         */
        generateByWuxing: function(params) {
            const { wuxing, bagua, type = 'ssq', count = 1 } = params;
            const result = {
                wuxing: wuxing,
                bagua: bagua || null,
                type: type,
                bets: [],
                totalBets: count,
                description: '',
                errors: []
            };

            // 校验五行
            if (!this.WUXING_ELEMENTS[wuxing]) {
                result.errors.push(`无效五行：${wuxing}，有效值：${Object.keys(this.WUXING_ELEMENTS).join(',')}`);
                return result;
            }

            // 校验八卦
            if (bagua && !this.BAGUA.includes(bagua)) {
                result.errors.push(`无效八卦：${bagua}，有效值：${this.BAGUA.join(',')}`);
                return result;
            }

            const elementInfo = this.WUXING_ELEMENTS[wuxing];

            // 八卦五行校验一致性
            if (bagua) {
                const baguaInElement = elementInfo.bagua;
                if (!baguaInElement.includes(bagua)) {
                    result.errors.push(`八卦【${bagua}】不属于五行【${wuxing}】，该八卦属：${this.BAGUA_NUMBERS[bagua]}`);
                    return result;
                }
            }

            // 构建号码池
            let numberPool = [...elementInfo.numbers];

            // 如果指定了八卦，添加八卦数字
            if (bagua) {
                const baguaNum = this.BAGUA_NUMBERS[bagua];
                if (!numberPool.includes(baguaNum)) {
                    numberPool.push(baguaNum);
                }
            }

            // 扩展号码池到足够数量
            if (type === 'ssq') {
                while (numberPool.length < 20) {
                    const num = Math.floor(Math.random() * 33) + 1;
                    if (!numberPool.includes(num)) numberPool.push(num);
                }
            } else {
                while (numberPool.length < 20) {
                    const num = Math.floor(Math.random() * 35) + 1;
                    if (!numberPool.includes(num)) numberPool.push(num);
                }
            }

            // 生成注单
            const seen = new Set();
            while (result.bets.length < count) {
                if (type === 'ssq') {
                    const sorted = [...numberPool].sort(() => Math.random() - 0.5);
                    const reds = sorted.slice(0, 6).sort((a, b) => a - b);
                    const blue = Math.floor(Math.random() * 16) + 1;

                    const key = reds.join(',') + '|' + blue;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    result.bets.push({
                        red: reds,
                        blue: blue,
                        wuxingTag: wuxing,
                        baguaTag: bagua || null,
                        formatted: `红球[${reds.join(',')}] 蓝球[${blue}]`
                    });
                } else {
                    const sorted = [...numberPool].sort(() => Math.random() - 0.5);
                    const front = sorted.slice(0, 5).sort((a, b) => a - b);
                    const back = [];
                    for (let i = 1; i <= 12 && back.length < 2; i++) {
                        if (!back.includes(i)) back.push(i);
                    }
                    back.sort((a, b) => a - b);

                    const key = front.join(',') + '|' + back.join(',');
                    if (seen.has(key)) continue;
                    seen.add(key);

                    result.bets.push({
                        front: front,
                        back: back,
                        wuxingTag: wuxing,
                        baguaTag: bagua || null,
                        formatted: `前区[${front.join(',')}] 后区[${back.join(',')}]`
                    });
                }
            }

            const tag = bagua ? `${wuxing}行·${bagua}` : wuxing;
            result.description = `五行【${tag}】，生成${count}注`;
            result.elementInfo = elementInfo;

            return result;
        },

        /**
         * 获取所有五行八卦组合信息
         * @returns {Array} 五行八卦信息列表
         */
        getAllWuxingBaguaInfo: function() {
            const result = [];
            for (const [wuxing, info] of Object.entries(this.WUXING_ELEMENTS)) {
                for (const bagua of info.bagua) {
                    result.push({
                        wuxing: wuxing,
                        bagua: bagua,
                        baguaNum: this.BAGUA_NUMBERS[bagua],
                        numbers: info.numbers,
                        colors: info.colors
                    });
                }
            }
            return result;
        },

        // ==================== 3. 手机尾号推荐 ====================

        /**
         * 手机尾号推荐选号
         * @param {string} phoneLast4 - 手机尾号后4位
         * @param {Object} options - 配置选项
         * @param {string} options.type - 'ssq' 或 'dlt'
         * @param {number} options.count - 生成注数
         * @param {boolean} options.useSum - 是否使用数字和生成额外注单，默认true
         * @returns {Object} 推荐结果
         */
        generateByPhoneLast4: function(phoneLast4, options = {}) {
            const { type = 'ssq', count = 1, useSum = true } = options;
            const result = {
                phoneLast4: phoneLast4,
                type: type,
                bets: [],
                totalBets: 0,
                description: '',
                errors: []
            };

            // 解析尾号
            if (!/^\d{4}$/.test(phoneLast4)) {
                result.errors.push('手机尾号需为4位数字');
                return result;
            }

            const digits = phoneLast4.split('').map(Number);

            // 直接使用尾号生成红球
            let redPool = [...digits];

            // 添加数字和衍生号码
            if (useSum) {
                const sum = digits.reduce((a, b) => a + b, 0);
                const digitSum = String(sum).split('').map(Number);
                digitSum.forEach(d => {
                    if (!redPool.includes(d)) redPool.push(d);
                });

                // 乘积取余生成
                const product = digits.reduce((a, b) => a * b, 0);
                const modNum = product % 33 + 1;
                if (!redPool.includes(modNum)) redPool.push(modNum);

                // 差值生成
                const diff = Math.abs(digits[0] - digits[3]) * 11 % 33 + 1;
                if (!redPool.includes(diff)) redPool.push(diff);
            }

            // 扩展号码池
            const maxNum = type === 'ssq' ? 33 : 35;
            while (redPool.length < 20) {
                const num = Math.floor(Math.random() * maxNum) + 1;
                if (!redPool.includes(num)) redPool.push(num);
            }

            // 去除超出范围的号码
            redPool = redPool.filter(n => n >= 1 && n <= maxNum);

            // 生成注单
            const seen = new Set();
            while (result.bets.length < count) {
                if (type === 'ssq') {
                    const sorted = [...redPool].sort(() => Math.random() - 0.5);
                    const reds = sorted.slice(0, 6).sort((a, b) => a - b);
                    const blue = Math.floor(Math.random() * 16) + 1;

                    const key = reds.join(',') + '|' + blue;
                    if (seen.has(key)) continue;
                    seen.add(key);

                    result.bets.push({
                        red: reds,
                        blue: blue,
                        phoneDigits: digits,
                        formatted: `红球[${reds.join(',')}] 蓝球[${blue}]`
                    });
                } else {
                    const sorted = [...redPool].sort(() => Math.random() - 0.5);
                    const front = sorted.slice(0, 5).sort((a, b) => a - b);
                    const back = [];
                    for (let i = 1; i <= 12 && back.length < 2; i++) {
                        if (!back.includes(i)) back.push(i);
                    }
                    back.sort((a, b) => a - b);

                    const key = front.join(',') + '|' + back.join(',');
                    if (seen.has(key)) continue;
                    seen.add(key);

                    result.bets.push({
                        front: front,
                        back: back,
                        phoneDigits: digits,
                        formatted: `前区[${front.join(',')}] 后区[${back.join(',')}]`
                    });
                }
            }

            result.totalBets = result.bets.length;
            result.description = `手机尾号【${phoneLast4}】，生成${count}注`;

            return result;
        },

        // ==================== 4. 自定义胆拖 ====================

        /**
         * 自定义胆拖投注生成
         * @param {Object} params - 参数
         * @param {string} params.type - 'ssq' 或 'dlt'
         * @param {number[]} params.redDan - 红球/前区胆码
         * @param {number[]} params.redTuo - 红球/前区拖码
         * @param {number[]} [params.blueDan] - 蓝球胆码（大乐透用）
         * @param {number[]} [params.blueTuo] - 蓝球拖码（大乐透用）
         * @returns {Object} 胆拖结果
         */
        generateByCustomDanTuo: function(params) {
            const { type, redDan = [], redTuo = [], blueDan = [], blueTuo = [] } = params;
            const result = {
                type: type,
                danMa: redDan,
                tuoMa: redTuo,
                bets: [],
                totalBets: 0,
                cost: 0,
                description: '',
                errors: []
            };

            if (type === 'ssq') {
                // 双色球胆拖验证
                const redErrors = this._validateSSQ(redDan, redTuo);
                if (redErrors.length > 0) {
                    result.errors.push(...redErrors);
                }

                if (redDan.length < 1 || redDan.length > 5) {
                    result.errors.push('双色球胆码需在1-5个之间');
                }
                if (redDan.length + redTuo.length < 7) {
                    result.errors.push('胆码+拖码至少需要7个');
                }
                if (redDan.length + redTuo.length > 16) {
                    result.errors.push('胆码+拖码最多16个');
                }

                if (result.errors.length > 0) return result;

                // 生成组合
                const frontCombos = this._combinations(redTuo, 6 - redDan.length);
                const bluePool = blueTuo.length > 0 ? blueTuo : [Math.floor(Math.random() * 16) + 1];

                result.totalBets = frontCombos.length * bluePool.length;
                result.cost = result.totalBets * 2;

                frontCombos.forEach(front => {
                    bluePool.forEach(blue => {
                        result.bets.push({
                            redDan: redDan,
                            redTuo: front,
                            redAll: [...redDan, ...front].sort((a, b) => a - b),
                            blue: blue,
                            formatted: `胆[${redDan.join(',')}] 拖[${front.join(',')}] 蓝[${blue}]`
                        });
                    });
                });

                result.description = `红球胆${redDan.length}个+拖${redTuo.length}个，蓝球${bluePool.length}个，共${result.totalBets}注`;

            } else if (type === 'dlt') {
                // 大乐透胆拖验证
                const frontErrors = this._validateDLT(redDan, redTuo);
                const backErrors = this._validateDLT(blueDan, blueTuo);
                if (frontErrors.length > 0) result.errors.push(...frontErrors);
                if (backErrors.length > 0) result.errors.push(...backErrors);

                if (redDan.length < 1 || redDan.length > 4) {
                    result.errors.push('大乐透前区胆码需在1-4个之间');
                }
                if (blueDan.length < 1 || blueDan.length > 2) {
                    result.errors.push('大乐透后区胆码需在1-2个之间');
                }
                if (redDan.length + redTuo.length < 5) {
                    result.errors.push('前区胆码+拖码至少需要5个');
                }
                if (blueDan.length + blueTuo.length < 2) {
                    result.errors.push('后区胆码+拖码至少需要2个');
                }

                if (result.errors.length > 0) return result;

                // 生成组合
                const frontCombos = this._combinations(redTuo, 5 - redDan.length);
                const backCombos = this._combinations(blueTuo, 2 - blueDan.length);

                result.totalBets = frontCombos.length * backCombos.length;
                result.cost = result.totalBets * 2;

                frontCombos.forEach(front => {
                    backCombos.forEach(back => {
                        result.bets.push({
                            frontDan: redDan,
                            frontTuo: front,
                            frontAll: [...redDan, ...front].sort((a, b) => a - b),
                            backDan: blueDan,
                            backTuo: back,
                            backAll: [...blueDan, ...back].sort((a, b) => a - b),
                            formatted: `前区胆[${redDan.join(',')}] 前区拖[${front.join(',')}] 后区胆[${blueDan.join(',')}] 后区拖[${back.join(',')}]`
                        });
                    });
                });

                result.description = `前区胆${redDan.length}个+拖${redTuo.length}个，后区胆${blueDan.length}个+拖${blueTuo.length}个，共${result.totalBets}注`;

            } else {
                result.errors.push(`无效类型：${type}，有效值：ssq, dlt`);
            }

            return result;
        },

        // ==================== 5. 号码模板管理 ====================

        /**
         * 保存号码模板
         * @param {Object} template - 模板对象
         * @param {string} template.name - 模板名称
         * @param {string} template.type - 'ssq' 或 'dlt'
         * @param {Object} template.numbers - 号码数据
         * @param {string} [template.description] - 模板描述
         * @returns {Object} 保存结果
         */
        saveTemplate: function(template) {
            const result = { success: false, errors: [], template: null };

            if (!template.name || template.name.trim() === '') {
                result.errors.push('模板名称不能为空');
                return result;
            }

            if (!template.type || !['ssq', 'dlt'].includes(template.type)) {
                result.errors.push('无效类型，需为 ssq 或 dlt');
                return result;
            }

            if (!template.numbers) {
                result.errors.push('号码数据不能为空');
                return result;
            }

            const newTemplate = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: template.name.trim(),
                type: template.type,
                numbers: template.numbers,
                description: template.description || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 检查重名
            const exists = this._templates.find(t => t.name === newTemplate.name);
            if (exists) {
                // 更新现有模板
                exists.numbers = newTemplate.numbers;
                exists.description = newTemplate.description;
                exists.updatedAt = newTemplate.updatedAt;
                result.template = exists;
            } else {
                this._templates.push(newTemplate);
                result.template = newTemplate;
            }

            this._saveTemplates();
            result.success = true;
            result.description = exists ? `模板【${newTemplate.name}】已更新` : `模板【${newTemplate.name}】已保存`;

            return result;
        },

        /**
         * 加载模板
         * @param {string} nameOrId - 模板名称或ID
         * @returns {Object|null} 模板对象或null
         */
        loadTemplate: function(nameOrId) {
            const template = this._templates.find(
                t => t.name === nameOrId || t.id === nameOrId
            );

            if (!template) {
                return { success: false, error: `模板【${nameOrId}】不存在` };
            }

            return { success: true, template: template };
        },

        /**
         * 列出所有模板
         * @param {Object} filter - 过滤条件
         * @param {string} [filter.type] - 按类型过滤
         * @param {string} [filter.keyword] - 按关键词搜索名称
         * @returns {Array} 模板列表
         */
        listTemplates: function(filter = {}) {
            let list = [...this._templates];

            if (filter.type) {
                list = list.filter(t => t.type === filter.type);
            }

            if (filter.keyword) {
                const kw = filter.keyword.toLowerCase();
                list = list.filter(t =>
                    t.name.toLowerCase().includes(kw) ||
                    t.description.toLowerCase().includes(kw)
                );
            }

            // 按更新时间倒序
            list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            return list.map(t => ({
                id: t.id,
                name: t.name,
                type: t.type,
                description: t.description,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt
            }));
        },

        /**
         * 删除模板
         * @param {string} nameOrId - 模板名称或ID
         * @returns {Object} 删除结果
         */
        deleteTemplate: function(nameOrId) {
            const index = this._templates.findIndex(
                t => t.name === nameOrId || t.id === nameOrId
            );

            if (index === -1) {
                return { success: false, error: `模板【${nameOrId}】不存在` };
            }

            const deleted = this._templates.splice(index, 1)[0];
            this._saveTemplates();

            return { success: true, deleted: deleted };
        },

        /**
         * 清空所有模板
         */
        clearAllTemplates: function() {
            this._templates = [];
            this._saveTemplates();
            return { success: true };
        },

        /**
         * 导出模板为JSON
         * @returns {string} JSON字符串
         */
        exportTemplates: function() {
            return JSON.stringify(this._templates, null, 2);
        },

        /**
         * 从JSON导入模板
         * @param {string} jsonStr - JSON字符串
         * @returns {Object} 导入结果
         */
        importTemplates: function(jsonStr) {
            const result = { success: false, imported: 0, errors: [] };

            try {
                const imported = JSON.parse(jsonStr);
                if (!Array.isArray(imported)) {
                    result.errors.push('导入数据格式错误，需为数组');
                    return result;
                }

                let count = 0;
                imported.forEach(item => {
                    if (item.name && item.numbers) {
                        const saveResult = this.saveTemplate({
                            name: item.name + '_imported',
                            type: item.type || 'ssq',
                            numbers: item.numbers,
                            description: item.description || ''
                        });
                        if (saveResult.success) count++;
                    }
                });

                result.success = true;
                result.imported = count;
            } catch (e) {
                result.errors.push('JSON解析失败：' + e.message);
            }

            return result;
        }
    };

    // 初始化并挂载到全局
    PlayEnhancements.init();

    // 支持多种导出方式
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PlayEnhancements;
    } else if (typeof define === 'function' && define.amd) {
        define(function() { return PlayEnhancements; });
    } else {
        global.PlayEnhancements = PlayEnhancements;
    }

})(typeof window !== 'undefined' ? window : this);
