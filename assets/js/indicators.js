// 指标管理页前端渲染脚本
// 自动拉取 /api/indicators 并渲染到 #indicators-root

(function() {
  const API_BASE_URL =
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:10000'
      : 'https://freelancesnail-data-api.onrender.com';

  const root = document.getElementById('indicators-root');

  function renderError(msg) {
    root.innerHTML = `<div class="alert alert-danger text-center">${msg}</div>`;
  }

  function renderLoading() {
    root.innerHTML = '<div class="text-center text-muted">正在加载指标数据...</div>';
  }

  function renderIndicators(data) {
    console.log('fetchIndicators got data:', data);
    // 1. 期货贴水表格
    let futuresRows = data.futures_discount.map(item =>
      `<tr><td>${item.contract}</td><td>${item.spot}</td><td>${item.future}</td><td>${item.discount}</td><td>${item.discount_rate}%</td></tr>`
    ).join('');
    let futuresCard = `
      <div class="card mb-4">
        <div class="card-header">股指期货贴水</div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead><tr><th>合约</th><th>现货点位</th><th>期货点位</th><th>贴水(点)</th><th>贴水率</th></tr></thead>
              <tbody>${futuresRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 2. 沪深300/中证1000点数比
    let indexRatio = data.index_ratio;
    let indexCard = `
      <div class="card mb-4">
        <div class="card-header">沪深300与中证1000点数比</div>
        <div class="card-body">
          <div class="table-responsive mb-4">
            <table class="table table-bordered table-sm">
              <thead><tr><th>沪深300</th><th>中证1000</th><th>点数比</th></tr></thead>
              <tbody><tr><td>${indexRatio.hs300}</td><td>${indexRatio.csi1000}</td><td>${indexRatio.ratio}</td></tr></tbody>
            </table>
          </div>
          <div id="indexRatioChart" style="height:400px;min-width:300px"></div>
        </div>
      </div>
    `;

    // 3. 风险平价策略各大类资产仓位
    // 风险平价策略资产仓位改为饼图显示
    let riskCard = `
      <div class="card mb-4">
        <div class="card-header">风险平价策略资产仓位</div>
        <div class="card-body">
          <div id="riskParityPie" style="height:400px;min-width:300px"></div>
        </div>
      </div>
    `;

    // 4. 动量轮动策略ETF涨幅
    let etfRows = data.momentum_etf.map(item =>
      `<tr><td>${item.code}</td><td>${item.name}</td><td>${item.chg21}%</td><td>${item.chg22}%</td><td>${item.chg23}%</td><td>${item.chg24}%</td></tr>`
    ).join('');
    let etfCard = `
      <div class="card mb-4">
        <div class="card-header">动量轮动策略ETF 21~24日涨幅</div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead><tr><th>ETF代码</th><th>名称</th><th>21日涨幅</th><th>22日涨幅</th><th>23日涨幅</th><th>24日涨幅</th></tr></thead>
              <tbody>${etfRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    root.innerHTML = futuresCard + indexCard + riskCard + etfCard;

    // innerHTML赋值后再初始化ECharts
    // 风险平价饼图
    console.log('risk_parity in renderIndicators:', data.risk_parity);
    const pieDom = document.getElementById('riskParityPie');
    if (pieDom && typeof echarts !== 'undefined') {
      const pieChart = echarts.init(pieDom);
      const pieOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {d}%'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '资产仓位',
            type: 'pie',
            radius: '70%',
            data: data.risk_parity.map(item => ({
              name: item.asset,
              value: +(item.weight * 100).toFixed(2)
            })),
            label: {
              formatter: '{b}: {d}%'
            }
          }
        ]
      };
      pieChart.setOption(pieOption);
      window.addEventListener('resize', () => pieChart.resize());
    }
    const chartDom = document.getElementById('indexRatioChart');
    if(chartDom && typeof echarts !== 'undefined') {
      const chart = echarts.init(chartDom);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.debug('图表数据格式验证:', JSON.stringify(indexRatio.history.slice(0,3)));
      }
      // 自动计算 y 轴 min/max 并留边距
      const values = indexRatio.history.map(item => item[1]);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const padding = (maxVal - minVal) * 0.2 || 0.05;
      const option = {
        tooltip: { trigger: 'axis', formatter: '{b}<br/>{c}' },
        xAxis: { type: 'time' },
        yAxis: {
          type: 'value',
          min: Math.max(0, minVal - padding),
          max: maxVal + padding
        },
        dataZoom: [{
          type: 'inside',
          start: 0,
          end: 100
        }, {
          type: 'slider',
          start: 0,
          end: 100
        }],
        series: [{
          type: 'line',
          smooth: true,
          data: indexRatio.history
        }]
      };
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
    }
  }

  async function fetchIndicators() {
    renderLoading();
    try {
      const resp = await fetch(`${API_BASE_URL}/api/indicators`);
      if (!resp.ok) throw new Error(`HTTP错误: ${resp.status}`);
      const data = await resp.json();
      
      // 开发模式自动注入模拟数据
      //if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      data.index_ratio.history = generateMockHistoryData();
      //}
      
      renderIndicators(data);
    } catch (e) {
      // 请求失败时使用完整模拟数据
      console.warn('使用模拟数据:', e.message);
      renderIndicators({
        futures_discount: data.futures_discount,
        index_ratio: {
          hs300: 3500,
          csi1000: 6200,
          ratio: (3500/6200).toFixed(3), // 表格显示字符串通常没问题
          history: generateMockHistoryData() // 现在会返回正确的数字类型数据
        },
        risk_parity: data.risk_parity,
        momentum_etf: data.momentum_etf
      });
    }
  }

  function generateMockHistoryData() {
    const now = Date.now();
    return Array.from({length: 30}, (_, i) => [
      now - (30 - i) * 86400_000,
      // 移除 .toFixed(3)，直接返回数字
      parseFloat((Math.random() * 0.2 + 0.5).toFixed(3)) // 或者直接 Math.random() * 0.2 + 0.5 如果不需要精确小数位
    ]);
  }

  // 页面加载后自动拉取
  if (root) fetchIndicators();
})();
