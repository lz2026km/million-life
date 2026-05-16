/**
 * enhancements-visual.js
 * 8项可视化功能 - 纯JS+CSS，不依赖外部库
 */

(function(global) {
    'use strict';

    const VisualEnhancements = {
        version: '1.0.0'
    };

    /**
     * 1. 号码出现动画 animateBallNumber
     * @param {HTMLElement} container - 容器元素
     * @param {number[]} numbers - 号码数组
     * @param {object} options - 配置选项
     */
    VisualEnhancements.animateBallNumber = function(container, numbers, options = {}) {
        const defaults = {
            duration: 800,
            stagger: 150,
            ballSize: 48,
            colors: {
                red: '#e74c3c',
                blue: '#3498db',
                text: '#fff'
            },
            onComplete: null
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.gap = '12px';
        container.style.flexWrap = 'wrap';

        numbers.forEach((num, index) => {
            const ball = document.createElement('div');
            const isRed = num <= 33;
            ball.className = 'vball-animate';
            ball.textContent = String(num).padStart(2, '0');
            ball.style.cssText = `
                width: ${opts.ballSize}px;
                height: ${opts.ballSize}px;
                border-radius: 50%;
                background: ${isRed ? opts.colors.red : opts.colors.blue};
                color: ${opts.colors.text};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${opts.ballSize * 0.4}px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                opacity: 0;
                transform: scale(0) rotate(-180deg);
                transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes vball-appear-${Date.now()} {
                    0% { opacity: 0; transform: scale(0) rotate(-180deg); }
                    60% { opacity: 1; transform: scale(1.2) rotate(10deg); }
                    100% { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes vball-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .vball-animate.bounce {
                    animation: vball-bounce 0.6s ease-in-out;
                }
            `;
            if (!document.querySelector('#vball-styles')) {
                style.id = 'vball-styles';
                document.head.appendChild(style);
            }

            container.appendChild(ball);

            setTimeout(() => {
                ball.style.opacity = '1';
                ball.style.transform = 'scale(1) rotate(0deg)';
            }, index * opts.stagger);

            setTimeout(() => {
                ball.classList.add('bounce');
                setTimeout(() => ball.classList.remove('bounce'), 600);
            }, index * opts.stagger + opts.duration);
        });

        const totalTime = numbers.length * opts.stagger + opts.duration;
        if (opts.onComplete) {
            setTimeout(opts.onComplete, totalTime);
        }
    };

    /**
     * 2. 趋势折线图 drawTrendChart
     * @param {HTMLElement} container - 容器元素
     * @param {number[]} data - 数据数组
     * @param {object} options - 配置选项
     */
    VisualEnhancements.drawTrendChart = function(container, data, options = {}) {
        const defaults = {
            width: 600,
            height: 300,
            lineColor: '#3498db',
            lineWidth: 2,
            fillColor: 'rgba(52, 152, 219, 0.2)',
            gridColor: '#eee',
            textColor: '#666',
            showDots: true,
            dotRadius: 4,
            animate: true,
            duration: 1000
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        const padding = 40;
        const chartWidth = opts.width - padding * 2;
        const chartHeight = opts.height - padding * 2;

        container.innerHTML = '';
        container.style.cssText = `position:relative;width:${opts.width}px;height:${opts.height}px;font-family:Arial,sans-serif;`;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', opts.width);
        svg.setAttribute('height', opts.height);
        svg.style.overflow = 'visible';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', `trend-grad-${Date.now()}`);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', opts.lineColor);
        stop1.setAttribute('stop-opacity', '0.4');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', opts.lineColor);
        stop2.setAttribute('stop-opacity', '0');
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);

        // Grid lines
        const maxVal = Math.max(...data, 1);
        const minVal = Math.min(...data, 0);
        const range = maxVal - minVal || 1;

        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            const val = maxVal - (range / 4) * i;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding);
            line.setAttribute('y1', y);
            line.setAttribute('x2', opts.width - padding);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', opts.gridColor);
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', padding - 10);
            label.setAttribute('y', y + 4);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('fill', opts.textColor);
            label.setAttribute('font-size', '12');
            label.textContent = Math.round(val);
            svg.appendChild(label);
        }

        // X axis labels
        data.forEach((_, i) => {
            if (data.length > 10 && i % Math.ceil(data.length / 10) !== 0) return;
            const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', opts.height - 10);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', opts.textColor);
            label.setAttribute('font-size', '12');
            label.textContent = i + 1;
            svg.appendChild(label);
        });

        // Area path
        let points = data.map((v, i) => {
            const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
            const y = padding + chartHeight - ((v - minVal) / range) * chartHeight;
            return { x, y };
        });

        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let areaD = `M ${points[0].x} ${opts.height - padding}`;
        points.forEach(p => areaD += ` L ${p.x} ${p.y}`);
        areaD += ` L ${points[points.length - 1].x} ${opts.height - padding} Z`;
        areaPath.setAttribute('d', areaD);
        areaPath.setAttribute('fill', `url(#${gradient.getAttribute('id')})`);
        if (!opts.animate) areaPath.style.opacity = '1';
        svg.appendChild(areaPath);

        // Line path
        const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let lineD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            lineD += ` L ${points[i].x} ${points[i].y}`;
        }
        linePath.setAttribute('d', lineD);
        linePath.setAttribute('fill', 'none');
        linePath.setAttribute('stroke', opts.lineColor);
        linePath.setAttribute('stroke-width', opts.lineWidth);
        linePath.setAttribute('stroke-linecap', 'round');
        linePath.setAttribute('stroke-linejoin', 'round');

        if (opts.animate) {
            const length = linePath.getTotalLength ? linePath.getTotalLength() : 1000;
            linePath.style.strokeDasharray = length;
            linePath.style.strokeDashoffset = length;
            linePath.style.transition = `stroke-dashoffset ${opts.duration}ms ease-out`;
            svg.appendChild(linePath);
            requestAnimationFrame(() => {
                linePath.style.strokeDashoffset = '0';
            });
            areaPath.style.opacity = '0';
            areaPath.style.transition = `opacity ${opts.duration}ms ease-out`;
            setTimeout(() => areaPath.style.opacity = '1', opts.duration / 2);
        } else {
            svg.appendChild(linePath);
        }

        // Dots
        if (opts.showDots) {
            points.forEach((p, i) => {
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', p.x);
                dot.setAttribute('cy', p.y);
                dot.setAttribute('r', opts.dotRadius);
                dot.setAttribute('fill', opts.lineColor);
                dot.setAttribute('stroke', '#fff');
                dot.setAttribute('stroke-width', '2');
                if (opts.animate) {
                    dot.style.opacity = '0';
                    dot.style.transition = `opacity 0.3s ease-out ${opts.duration / 2 + i * 30}ms`;
                    svg.appendChild(dot);
                    setTimeout(() => dot.style.opacity = '1', opts.duration / 2 + i * 30);
                } else {
                    svg.appendChild(dot);
                }
            });
        }

        container.appendChild(svg);
    };

    /**
     * 3. 热力图矩阵 drawHeatmap
     * @param {HTMLElement} container - 容器元素
     * @param {number[][]} matrix - 二维矩阵数据
     * @param {object} options - 配置选项
     */
    VisualEnhancements.drawHeatmap = function(container, matrix, options = {}) {
        const defaults = {
            rows: 6,
            cols: 11,
            cellSize: 40,
            cellGap: 2,
            minColor: '#e8f5e9',
            maxColor: '#c62828',
            rowLabels: ['红1区', '红2区', '红3区', '红4区', '红5区', '蓝区'],
            colLabels: null,
            animate: true,
            duration: 800
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = '';
        container.style.cssText = `display:inline-block;font-family:Arial,sans-serif;`;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;';

        // Header row with column labels
        const headerRow = document.createElement('div');
        headerRow.style.cssText = 'display:flex;margin-bottom:8px;';

        const cornerSpacer = document.createElement('div');
        cornerSpacer.style.cssText = `width:${opts.cellSize}px;height:20px;`;
        headerRow.appendChild(cornerSpacer);

        for (let c = 0; c < opts.cols; c++) {
            const label = document.createElement('div');
            label.textContent = opts.colLabels ? opts.colLabels[c] : c + 1;
            label.style.cssText = `
                width:${opts.cellSize}px;
                text-align:center;
                font-size:11px;
                color:#666;
            `;
            headerRow.appendChild(label);
        }
        wrapper.appendChild(headerRow);

        // Data rows
        matrix.forEach((row, r) => {
            const rowEl = document.createElement('div');
            rowEl.style.cssText = 'display:flex;margin-bottom:' + opts.cellGap + 'px;';

            const rowLabel = document.createElement('div');
            rowLabel.textContent = opts.rowLabels[r] || '';
            rowLabel.style.cssText = `
                width:${opts.cellSize}px;
                height:${opts.cellSize}px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:10px;
                color:#666;
            `;
            rowEl.appendChild(rowLabel);

            row.forEach((val, c) => {
                const cell = document.createElement('div');
                cell.className = 'vheatmap-cell';
                cell.textContent = val;
                cell.style.cssText = `
                    width:${opts.cellSize}px;
                    height:${opts.cellSize}px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:12px;
                    font-weight:bold;
                    border-radius:4px;
                    cursor:default;
                    opacity:0;
                    transform:scale(0.8);
                    transition:all 0.3s ease-out;
                `;

                const minVal = Math.min(...matrix.flat());
                const maxVal = Math.max(...matrix.flat());
                const norm = maxVal > minVal ? (val - minVal) / (maxVal - minVal) : 0.5;
                cell.style.background = VisualEnhancements._interpolateColor(opts.minColor, opts.maxColor, norm);
                cell.style.color = norm > 0.5 ? '#fff' : '#333';

                if (opts.animate) {
                    const delay = (r * opts.cols + c) * 20;
                    setTimeout(() => {
                        cell.style.opacity = '1';
                        cell.style.transform = 'scale(1)';
                    }, delay);
                } else {
                    cell.style.opacity = '1';
                    cell.style.transform = 'scale(1)';
                }

                rowEl.appendChild(cell);
            });

            wrapper.appendChild(rowEl);
        });

        container.appendChild(wrapper);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position:fixed;
            background:rgba(0,0,0,0.8);
            color:#fff;
            padding:8px 12px;
            border-radius:4px;
            font-size:12px;
            pointer-events:none;
            opacity:0;
            transition:opacity 0.2s;
            z-index:1000;
        `;
        document.body.appendChild(tooltip);

        wrapper.addEventListener('mouseover', (e) => {
            const cell = e.target.closest('.vheatmap-cell');
            if (cell) {
                tooltip.textContent = cell.textContent;
                tooltip.style.opacity = '1';
            }
        });
        wrapper.addEventListener('mouseout', () => tooltip.style.opacity = '0');
        wrapper.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.clientX + 15 + 'px';
            tooltip.style.top = e.clientY + 15 + 'px';
        });
    };

    VisualEnhancements._interpolateColor = function(color1, color2, factor) {
        const hex = (c) => parseInt(c, 16);
        const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7));
        const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7));
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        return `rgb(${r},${g},${b})`;
    };

    /**
     * 4. 饼图分布 drawPieChart
     * @param {HTMLElement} container - 容器元素
     * @param {object} data - 数据对象 {label: value}
     * @param {object} options - 配置选项
     */
    VisualEnhancements.drawPieChart = function(container, data, options = {}) {
        const defaults = {
            size: 300,
            innerRadius: 0,
            animate: true,
            duration: 1000,
            colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'],
            showLabels: true,
            showPercent: true
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = '';
        container.style.cssText = `position:relative;width:${opts.size}px;height:${opts.size}px;font-family:Arial,sans-serif;`;

        const total = Object.values(data).reduce((a, b) => a + b, 0);
        if (total === 0) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', opts.size);
        svg.setAttribute('height', opts.size);
        svg.style.transform = 'rotate(-90deg)';

        const cx = opts.size / 2, cy = opts.size / 2;
        const outerR = opts.size / 2 - 10;
        const innerR = opts.innerRadius > 0 ? outerR * opts.innerRadius : 0;

        let currentAngle = 0;
        const entries = Object.entries(data);

        entries.forEach(([label, value], i) => {
            const percent = value / total;
            const angle = percent * Math.PI * 2;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const color = opts.colors[i % opts.colors.length];

            const startX = cx + Math.cos(currentAngle) * outerR;
            const startY = cy + Math.sin(currentAngle) * outerR;
            const endAngle = currentAngle + angle;
            const endX = cx + Math.cos(endAngle) * outerR;
            const endY = cy + Math.sin(endAngle) * outerR;

            let d;
            if (innerR > 0) {
                const innerStartX = cx + Math.cos(currentAngle) * innerR;
                const innerStartY = cy + Math.sin(currentAngle) * innerR;
                const innerEndX = cx + Math.cos(endAngle) * innerR;
                const innerEndY = cy + Math.sin(endAngle) * innerR;
                const largeArc = angle > Math.PI ? 1 : 0;
                d = `M ${startX} ${startY} A ${outerR} ${outerR} 0 ${largeArc} 1 ${endX} ${endY} L ${innerEndX} ${innerEndY} A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStartX} ${innerStartY} Z`;
            } else {
                const largeArc = angle > Math.PI ? 1 : 0;
                d = `M ${cx} ${cy} L ${startX} ${startY} A ${outerR} ${outerR} 0 ${largeArc} 1 ${endX} ${endY} Z`;
            }

            path.setAttribute('d', d);
            path.setAttribute('fill', color);
            path.style.cursor = 'pointer';
            path.style.opacity = '0';

            if (opts.animate) {
                path.style.transition = `opacity ${opts.duration * 0.5}ms ease-out ${i * 100}ms,
                                         transform ${opts.duration}ms ease-out ${i * 100}ms`;
                setTimeout(() => {
                    path.style.opacity = '1';
                    path.style.transform = 'scale(1)';
                    path.style.transformOrigin = `${cx}px ${cy}px`;
                }, i * 100);
            } else {
                path.style.opacity = '1';
            }

            path.addEventListener('mouseover', () => {
                path.style.transform = 'scale(1.05)';
                path.style.transformOrigin = `${cx}px ${cy}px`;
            });
            path.addEventListener('mouseout', () => {
                path.style.transform = 'scale(1)';
            });

            svg.appendChild(path);

            // Label line
            if (opts.showLabels || opts.showPercent) {
                const midAngle = currentAngle + angle / 2;
                const labelR = outerR + 30;
                const labelX = cx + Math.cos(midAngle) * labelR;
                const labelY = cy + Math.sin(midAngle) * labelR;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', cx + Math.cos(midAngle) * (outerR + 5));
                line.setAttribute('y1', cy + Math.sin(midAngle) * (outerR + 5));
                line.setAttribute('x2', labelX);
                line.setAttribute('y2', labelY);
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', '1');
                svg.appendChild(line);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', labelX);
                text.setAttribute('y', labelY);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('fill', '#333');
                text.setAttribute('font-size', '12');
                let labelText = opts.showLabels ? label : '';
                if (opts.showPercent) {
                    labelText += (labelText ? ' ' : '') + Math.round(percent * 100) + '%';
                }
                text.textContent = labelText;
                svg.appendChild(text);
            }

            currentAngle += angle;
        });

        container.appendChild(svg);
    };

    /**
     * 5. 历史开奖日历 renderCalendar
     * @param {HTMLElement} container - 容器元素
     * @param {Array} records - 开奖记录 [{date: 'YYYY-MM-DD', numbers: [...]}]
     * @param {object} options - 配置选项
     */
    VisualEnhancements.renderCalendar = function(container, records, options = {}) {
        const defaults = {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            cellSize: 60,
            highlightToday: true,
            onDateClick: null
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        const recordMap = {};
        records.forEach(r => recordMap[r.date] = r.numbers);

        container.innerHTML = '';
        const year = opts.year, month = opts.month;
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const today = new Date();

        container.style.cssText = `font-family:Arial,sans-serif;`;

        const header = document.createElement('div');
        header.style.cssText = 'text-align:center;margin-bottom:16px;font-size:18px;font-weight:bold;color:#333;';
        header.textContent = `${year}年${month}月`;
        container.appendChild(header);

        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekRow = document.createElement('div');
        weekRow.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px;';
        weekDays.forEach(d => {
            const cell = document.createElement('div');
            cell.textContent = d;
            cell.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:#999;';
            weekRow.appendChild(cell);
        });
        container.appendChild(weekRow);

        const grid = document.createElement('div');
        grid.style.cssText = `display:grid;grid-template-columns:repeat(7,1fr);gap:4px;`;

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.style.cssText = `height:${opts.cellSize}px;`;
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cell = document.createElement('div');
            cell.style.cssText = `
                height:${opts.cellSize}px;
                border-radius:8px;
                background:#f5f5f5;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                transition:all 0.2s;
                position:relative;
            `;

            const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
            if (isToday && opts.highlightToday) {
                cell.style.background = '#3498db';
                cell.style.color = '#fff';
            }

            const dayNum = document.createElement('div');
            dayNum.textContent = day;
            dayNum.style.cssText = 'font-size:14px;font-weight:bold;';
            cell.appendChild(dayNum);

            if (recordMap[dateStr]) {
                const balls = document.createElement('div');
                balls.style.cssText = 'display:flex;gap:2px;margin-top:4px;flex-wrap:wrap;justify-content:center;';
                recordMap[dateStr].slice(0, 6).forEach(n => {
                    const ball = document.createElement('span');
                    ball.textContent = n;
                    ball.style.cssText = `
                        width:16px;height:16px;border-radius:50%;
                        background:${n <= 33 ? '#e74c3c' : '#3498db'};
                        color:#fff;font-size:8px;display:flex;align-items:center;justify-content:center;
                    `;
                    balls.appendChild(ball);
                });
                if (recordMap[dateStr].length > 6) {
                    const blue = document.createElement('span');
                    blue.textContent = recordMap[dateStr][6];
                    blue.style.cssText = 'width:16px;height:16px;border-radius:50%;background:#3498db;color:#fff;font-size:8px;display:flex;align-items:center;justify-content:center;';
                    balls.appendChild(blue);
                }
                cell.appendChild(balls);
                cell.style.background = isToday ? '#3498db' : '#fff';
                cell.style.color = isToday ? '#fff' : '#333';
                cell.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }

            cell.addEventListener('mouseover', () => {
                if (!(isToday && opts.highlightToday)) {
                    cell.style.transform = 'scale(1.05)';
                    cell.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
            });
            cell.addEventListener('mouseout', () => {
                cell.style.transform = 'scale(1)';
                if (!recordMap[dateStr]) {
                    cell.style.boxShadow = 'none';
                }
            });
            cell.addEventListener('click', () => {
                if (opts.onDateClick) {
                    opts.onDateClick(dateStr, recordMap[dateStr] || null);
                }
            });

            grid.appendChild(cell);
        }

        container.appendChild(grid);
    };

    /**
     * 6. 收藏夹云图 renderWordCloud
     * @param {HTMLElement} container - 容器元素
     * @param {object} words - 词频数据 {word: count}
     * @param {object} options - 配置选项
     */
    VisualEnhancements.renderWordCloud = function(container, words, options = {}) {
        const defaults = {
            width: 500,
            height: 300,
            minSize: 14,
            maxSize: 48,
            colors: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'],
            padding: 10,
            animate: true,
            duration: 1500
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = '';
        container.style.cssText = `position:relative;width:${opts.width}px;height:${opts.height}px;overflow:hidden;font-family:Arial,sans-serif;`;

        const entries = Object.entries(words);
        if (entries.length === 0) return;

        const maxCount = Math.max(...entries.map(e => e[1]));
        const minCount = Math.min(...entries.map(e => e[1]));

        // Simple spiral placement
        const placed = [];
        const centerX = opts.width / 2;
        const centerY = opts.height / 2;

        entries.forEach(([word, count], index) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'vword-cloud-item';

            const norm = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
            const fontSize = opts.minSize + norm * (opts.maxSize - opts.minSize);
            const color = opts.colors[index % opts.colors.length];

            span.style.cssText = `
                position:absolute;
                font-size:${fontSize}px;
                font-weight:bold;
                color:${color};
                cursor:default;
                white-space:nowrap;
                opacity:0;
                transform:scale(0);
                transition:all 0.5s ease-out;
                text-shadow:1px 1px 2px rgba(0,0,0,0.1);
            `;

            // Find position using spiral
            let placed_idx = false;
            const maxAttempts = 100;
            let angle = index * 0.5;
            let radius = 20;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const x = centerX + Math.cos(angle) * radius - fontSize * word.length / 4;
                const y = centerY + Math.sin(angle) * radius - fontSize / 2;

                let overlaps = false;
                for (const p of placed) {
                    const dx = x - p.x;
                    const dy = y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < (p.width + fontSize) / 2 + opts.padding) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps && x > 0 && x < opts.width - fontSize * word.length && y > 0 && y < opts.height) {
                    span.style.left = x + 'px';
                    span.style.top = y + 'px';
                    placed.push({ x, y, width: fontSize * word.length, height: fontSize });
                    placed_idx = true;
                    break;
                }

                angle += 0.3;
                radius += 2;
            }

            if (!placed_idx) {
                // Fallback: random position
                span.style.left = (Math.random() * (opts.width - fontSize * word.length)) + 'px';
                span.style.top = (Math.random() * (opts.height - fontSize)) + 'px';
            }

            if (opts.animate) {
                setTimeout(() => {
                    span.style.opacity = '1';
                    span.style.transform = 'scale(1)';
                }, index * 50);
            } else {
                span.style.opacity = '1';
                span.style.transform = 'scale(1)';
            }

            span.addEventListener('mouseover', () => {
                span.style.transform = 'scale(1.1)';
                span.style.zIndex = '10';
            });
            span.addEventListener('mouseout', () => {
                span.style.transform = 'scale(1)';
                span.style.zIndex = '1';
            });

            container.appendChild(span);
        });
    };

    /**
     * 7. 生成进度条动画 showProgressBar
     * @param {HTMLElement} container - 容器元素
     * @param {number} percent - 进度百分比 0-100
     * @param {object} options - 配置选项
     */
    VisualEnhancements.showProgressBar = function(container, percent, options = {}) {
        const defaults = {
            height: 24,
            width: '100%',
            bgColor: '#e0e0e0',
            fillColor: '#3498db',
            animate: true,
            duration: 800,
            showLabel: true,
            labelPosition: 'inside',
            striped: false,
            onComplete: null
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = '';
        container.style.cssText = `position:relative;width:${opts.width};height:${opts.height}px;border-radius:12px;overflow:hidden;background:${opts.bgColor};font-family:Arial,sans-serif;`;

        const bar = document.createElement('div');
        bar.className = 'vprogress-fill';
        bar.style.cssText = `
            position:absolute;
            top:0;left:0;height:100%;
            background:${opts.fillColor};
            border-radius:12px;
            width:0%;
            transition:width ${opts.duration}ms ease-out;
        `;

        if (opts.striped) {
            const style = document.createElement('style');
            const id = 'vprogress-stripe-' + Date.now();
            style.id = id;
            style.textContent = `
                @keyframes vprogress-stripe {
                    0% { background-position: 40px 0; }
                    100% { background-position: 0 0; }
                }
                .vprogress-striped {
                    background-image: linear-gradient(45deg,rgba(255,255,255,0.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.2) 50%,rgba(255,255,255,0.2) 75%,transparent 75%,transparent);
                    background-size: 40px 40px;
                    animation: vprogress-stripe 1s linear infinite;
                }
            `;
            document.head.appendChild(style);
            bar.classList.add('vprogress-striped');
        }

        container.appendChild(bar);

        if (opts.showLabel && opts.labelPosition === 'inside') {
            const label = document.createElement('div');
            label.className = 'vprogress-label';
            label.textContent = '0%';
            label.style.cssText = `
                position:absolute;
                top:50%;left:50%;
                transform:translate(-50%,-50%);
                color:#fff;font-size:12px;font-weight:bold;
                text-shadow:1px 1px 2px rgba(0,0,0,0.3);
                transition:opacity 0.3s;
            `;
            container.appendChild(label);
        }

        if (opts.animate) {
            requestAnimationFrame(() => {
                bar.style.width = percent + '%';
            });

            const label = container.querySelector('.vprogress-label');
            if (label) {
                let current = 0;
                const step = percent / (opts.duration / 16);
                const interval = setInterval(() => {
                    current += step;
                    if (current >= percent) {
                        current = percent;
                        clearInterval(interval);
                        if (opts.onComplete) opts.onComplete();
                    }
                    label.textContent = Math.round(current) + '%';
                }, 16);
            }

            setTimeout(() => {
                if (opts.onComplete && !label) opts.onComplete();
            }, opts.duration);
        } else {
            bar.style.width = percent + '%';
            const label = container.querySelector('.vprogress-label');
            if (label) label.textContent = percent + '%';
        }

        return {
            element: container,
            setPercent: (p) => {
                const fill = container.querySelector('.vprogress-fill');
                const label = container.querySelector('.vprogress-label');
                if (fill) fill.style.width = p + '%';
                if (label) label.textContent = p + '%';
            }
        };
    };

    /**
     * 8. 结果翻牌动画 flipCardAnimation
     * @param {HTMLElement} container - 容器元素
     * @param {string} frontText - 正面文字
     * @param {string} backText - 背面文字
     * @param {object} options - 配置选项
     */
    VisualEnhancements.flipCardAnimation = function(container, frontText, backText, options = {}) {
        const defaults = {
            width: 120,
            height: 160,
            duration: 600,
            perspective: 800,
            frontBg: '#3498db',
            backBg: '#e74c3c',
            textColor: '#fff',
            autoFlip: false,
            flipDelay: 2000,
            onFlip: null
        };
        const opts = { ...defaults, ...options };

        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        if (!container) return;

        container.innerHTML = '';
        container.style.cssText = `
            position:relative;
            width:${opts.width}px;
            height:${opts.height}px;
            perspective:${opts.perspective}px;
            cursor:pointer;
            font-family:Arial,sans-serif;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            position:relative;
            width:100%;height:100%;
            transform-style:preserve-3d;
            transition:transform ${opts.duration}ms ease-in-out;
        `;

        const createFace = (text, bg, isBack) => {
            const face = document.createElement('div');
            face.style.cssText = `
                position:absolute;
                width:100%;height:100%;
                backface-visibility:hidden;
                display:flex;align-items:center;justify-content:center;
                background:${bg};
                color:${opts.textColor};
                font-size:18px;font-weight:bold;
                border-radius:12px;
                box-shadow:0 4px 15px rgba(0,0,0,0.3);
                padding:16px;
                text-align:center;
                word-break:break-word;
            `;
            face.textContent = text;
            if (isBack) {
                face.style.transform = 'rotateY(180deg)';
            }
            return face;
        };

        const front = createFace(frontText, opts.frontBg, false);
        const back = createFace(backText, opts.backBg, true);

        card.appendChild(front);
        card.appendChild(back);
        container.appendChild(card);

        let isFlipped = false;

        const doFlip = () => {
            isFlipped = !isFlipped;
            card.style.transform = `rotateY(${isFlipped ? 180 : 0}deg)`;
            if (opts.onFlip) opts.onFlip(isFlipped);
        };

        container.addEventListener('click', doFlip);

        if (opts.autoFlip) {
            setInterval(doFlip, opts.flipDelay + opts.duration);
        }

        return {
            element: container,
            flip: doFlip,
            isFlipped: () => isFlipped
        };
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = VisualEnhancements;
    } else {
        global.VisualEnhancements = VisualEnhancements;
    }

})(typeof window !== 'undefined' ? window : this);