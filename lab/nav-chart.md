---
layout: page
title: 净值曲线
lead: 策略净值与上证指数、沪深300、中证500、标普500、纳斯达克100对比分析，支持自定义时间区间与对数坐标。
permalink: /dashboard/nav-chart/
---

<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
<link rel="stylesheet" href="/lab/nav-chart.css">
<div class="nav-chart-wrapper"><div class="chart-wrap">
        <div class="chart-header ios-card">
            <h1>净值曲线分析工具</h1>
            <div class="segmented-control">
                <button class="time-btn" data-range="1m">近1个月</button>
                <button class="time-btn" data-range="3m">近3个月</button>
                <button class="time-btn" data-range="6m">近半年</button>
                <button class="time-btn" data-range="1y">近1年</button>
                <button class="time-btn" data-range="3y">近3年</button>
                <button class="time-btn active" data-range="all">全部</button>
            </div>
            <div class="custom-range">
                <span>自定义</span>
                <input type="date" id="startDate">
                <span>至</span>
                <input type="date" id="endDate">
                <button class="ios-btn ios-btn-primary" onclick="applyCustomRange()">应用</button>
                <button class="ios-btn ios-btn-secondary" id="logToggle" onclick="toggleLogScale()">对数坐标</button>
            </div>
        </div>
        <div class="chart-container ios-card"><div id="chart"></div></div>
        <div class="stats-panel ios-card">
            <div class="stat-item"><div class="stat-label">区间收益</div><div class="stat-value" id="totalReturn">--</div></div>
            <div class="stat-item"><div class="stat-label">年化收益</div><div class="stat-value" id="annualizedReturn">--</div></div>
            <div class="stat-item"><div class="stat-label">最大回撤</div><div class="stat-value" id="maxDrawdown">--</div></div>
            <div class="stat-item"><div class="stat-label">数据点数</div><div class="stat-value" id="dataPoints">--</div></div>
        </div>
        <div class="legend-info ios-card">提示：点击图例可显示/隐藏对应曲线。鼠标悬停或触摸图表查看详细数据。</div>
    </div>
    <script>
        let RAW_DATA = [];
        const SERIES_CONFIG = {
            '净值': { color: '#007AFF', lineWidth: 3, visible: true },
            '上证指数': { color: '#FF3B30', lineWidth: 1.5, visible: false },
            '沪深300': { color: '#FF9500', lineWidth: 1.5, visible: false },
            '中证500': { color: '#34C759', lineWidth: 1.5, visible: false },
            '标普500': { color: '#5856D6', lineWidth: 1.5, visible: false },
            '纳斯达克100': { color: '#FF2D55', lineWidth: 1.5, visible: false }
        };
        let chart = null;
        let currentData = [];
        let isLogScale = false;
        function toggleLogScale() {
            isLogScale = !isLogScale;
            const btn = document.getElementById('logToggle');
            if (btn) {
                btn.textContent = isLogScale ? '线性坐标' : '对数坐标';
                btn.classList.toggle('active', isLogScale);
            }
            renderChart();
        }
        function initChart() {
            chart = echarts.init(document.getElementById('chart'));
            window.addEventListener('resize', () => chart.resize());
            document.querySelectorAll('.time-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    filterByRange(this.dataset.range);
                });
            });
            fetch('/lab/nav-data.json')
                .then(r => r.json())
                .then(data => { RAW_DATA = data; filterByRange('all'); })
                .catch(err => { document.getElementById('chart').innerHTML = '<div style="text-align:center;padding:100px 20px;color:#8E8E93;">加载数据失败</div>'; console.error(err); });
        }
        function filterByRange(range) {
            const end = new Date();
            const start = new Date();
            switch(range) {
                case '1m': start.setMonth(start.getMonth() - 1); break;
                case '3m': start.setMonth(start.getMonth() - 3); break;
                case '6m': start.setMonth(start.getMonth() - 6); break;
                case '1y': start.setFullYear(start.getFullYear() - 1); break;
                case '3y': start.setFullYear(start.getFullYear() - 3); break;
                case 'all': currentData = [...RAW_DATA]; renderChart(); return;
            }
            currentData = RAW_DATA.filter(d => { const date = new Date(d.date); return date >= start && date <= end; });
            renderChart();
        }
        function applyCustomRange() {
            const startStr = document.getElementById('startDate').value;
            const endStr = document.getElementById('endDate').value;
            if (!startStr || !endStr) { alert('请选择开始和结束日期'); return; }
            const start = new Date(startStr);
            const end = new Date(endStr);
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            currentData = RAW_DATA.filter(d => { const date = new Date(d.date); return date >= start && date <= end; });
            renderChart();
        }
        function normalizeSeries(data, field) {
            const validItems = data.filter(d => d[field] !== null && d[field] !== undefined);
            if (validItems.length === 0) return [];
            const base = validItems[0][field];
            return validItems.map(d => ({ date: d.date, value: d[field] / base, rawValue: d[field] }));
        }
        function calculateStats(data) {
            if (data.length < 2) return;
            const navValues = data.map(d => d['净值']);
            const startNav = navValues[0];
            const endNav = navValues[navValues.length - 1];
            const totalReturn = (endNav - startNav) / startNav;
            const days = (new Date(data[data.length-1].date) - new Date(data[0].date)) / (1000 * 60 * 60 * 24);
            const years = days / 365;
            const annualized = years > 0 ? Math.pow(1 + totalReturn, 1/years) - 1 : 0;
            let maxDrawdown = 0;
            let peak = startNav;
            for (const nav of navValues) { if (nav > peak) peak = nav; const drawdown = (peak - nav) / peak; if (drawdown > maxDrawdown) maxDrawdown = drawdown; }
            document.getElementById('totalReturn').textContent = (totalReturn * 100).toFixed(2) + '%';
            document.getElementById('totalReturn').className = 'stat-value ' + (totalReturn >= 0 ? 'positive' : 'negative');
            document.getElementById('annualizedReturn').textContent = (annualized * 100).toFixed(2) + '%';
            document.getElementById('annualizedReturn').className = 'stat-value ' + (annualized >= 0 ? 'positive' : 'negative');
            document.getElementById('maxDrawdown').textContent = (-maxDrawdown * 100).toFixed(2) + '%';
            document.getElementById('maxDrawdown').className = 'stat-value negative';
            document.getElementById('dataPoints').textContent = data.length;
        }
        function renderChart() {
            if (currentData.length === 0) { chart.clear(); return; }
            calculateStats(currentData);
            const dates = currentData.map(d => d.date);
            const seriesList = [];
            let allValues = [];
            for (const [name, config] of Object.entries(SERIES_CONFIG)) {
                const normalized = normalizeSeries(currentData, name);
                if (normalized.length === 0) continue;
                allValues = allValues.concat(normalized.map(d => d.value));
                seriesList.push({
                    name: name,
                    type: 'line',
                    data: normalized.map(d => [d.date, d.value]),
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: name === '净值' ? 6 : 4,
                    lineStyle: { width: config.lineWidth, color: config.color },
                    itemStyle: { color: config.color },
                    emphasis: { focus: 'series' }
                });
            }
            let yMin, yMax;
            if (allValues.length > 0) {
                const dataMin = Math.min(...allValues);
                const dataMax = Math.max(...allValues);
                if (isLogScale) {
                    yMin = dataMin > 0 ? dataMin * 0.95 : undefined;
                    yMax = dataMax > 0 ? dataMax * 1.05 : undefined;
                } else {
                    const pad = (dataMax - dataMin) * 0.1;
                    yMin = dataMin - pad;
                    yMax = dataMax + pad;
                }
            }
            const option = {
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(255,255,255,0.85)',
                    borderColor: 'rgba(0,0,0,0.06)',
                    borderWidth: 0.5,
                    borderRadius: 12,
                    padding: [12, 16],
                    textStyle: { color: '#1C1C1E', fontSize: 13 },
                    extraCssText: 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 4px 16px rgba(0,0,0,0.08);',
                    formatter: function(params) {
                        let html = '<div style="font-weight:600;margin-bottom:10px;font-size:14px;">' + params[0].axisValue + '</div>';
                        params.forEach(p => {
                            const seriesName = p.seriesName;
                            const rawItem = currentData.find(d => d.date === p.axisValue);
                            const rawVal = rawItem ? rawItem[seriesName] : null;
                            if (rawVal !== null && rawVal !== undefined) {
                                const color = p.color;
                                const formattedVal = seriesName === '净值' ? rawVal.toFixed(4) : rawVal.toFixed(2);
                                html += '<div style="display:flex;align-items:center;margin:5px 0;">';
                                html += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + ';margin-right:10px;"></span>';
                                html += '<span style="flex:1;color:#8E8E93;">' + seriesName + '</span>';
                                html += '<span style="font-weight:600;color:#1C1C1E;">' + formattedVal + '</span>';
                                html += '</div></div>';
                            }
                        });
                        return html;
                    }
                },
                legend: {
                    data: Object.keys(SERIES_CONFIG),
                    selected: Object.fromEntries(Object.entries(SERIES_CONFIG).map(([k, v]) => [k, v.visible])),
                    bottom: 0,
                    textStyle: { fontSize: 12, color: '#8E8E93' },
                    itemWidth: 16,
                    itemHeight: 8,
                    itemGap: 20,
                    icon: 'roundRect'
                },
                grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: dates,
                    axisLabel: { formatter: function(value) { const date = new Date(value); return (date.getMonth() + 1) + '/' + date.getDate(); }, rotate: 45, fontSize: 11, color: '#8E8E93' },
                    axisLine: { lineStyle: { color: '#E5E5EA' } },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: isLogScale ? 'log' : 'value',
                    name: isLogScale ? '净值' : '收益率',
                    nameTextStyle: { fontSize: 12, color: '#8E8E93', fontWeight: 500 },
                    scale: true,
                    min: yMin,
                    max: yMax,
                    axisLabel: {
                        formatter: function(value) {
                            if (isLogScale) {
                                return value.toFixed(2);
                            }
                            const pct = (value - 1) * 100;
                            return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
                        },
                        fontSize: 11,
                        color: '#8E8E93'
                    },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: '#F2F2F7', type: 'dashed' } }
                },
                dataZoom: [
                    { type: 'inside', start: 0, end: 100 },
                    { type: 'slider', start: 0, end: 100, height: 24, bottom: 32, borderColor: 'transparent', backgroundColor: '#F2F2F7', fillerColor: 'rgba(0,122,255,0.1)', handleStyle: { color: '#007AFF', borderColor: '#007AFF' }, textStyle: { color: '#8E8E93' } }
                ],
                series: seriesList
            };
            chart.setOption(option, true);
        }
        document.addEventListener('DOMContentLoaded', initChart);
    </script>
