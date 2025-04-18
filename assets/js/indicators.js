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
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead><tr><th>沪深300</th><th>中证1000</th><th>点数比</th></tr></thead>
              <tbody><tr><td>${indexRatio.hs300}</td><td>${indexRatio.csi1000}</td><td>${indexRatio.ratio}</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 3. 风险平价策略各大类资产仓位
    let riskRows = data.risk_parity.map(item =>
      `<tr><td>${item.asset}</td><td>${(item.weight*100).toFixed(2)}%</td></tr>`
    ).join('');
    let riskCard = `
      <div class="card mb-4">
        <div class="card-header">风险平价策略资产仓位</div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered table-sm">
              <thead><tr><th>资产类别</th><th>当前仓位(%)</th></tr></thead>
              <tbody>${riskRows}</tbody>
            </table>
          </div>
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
  }

  async function fetchIndicators() {
    renderLoading();
    try {
      const resp = await fetch(`${API_BASE_URL}/api/indicators`);
      if (!resp.ok) throw new Error(`HTTP错误: ${resp.status}`);
      const data = await resp.json();
      renderIndicators(data);
    } catch (e) {
      renderError('获取指标数据失败: ' + e.message);
    }
  }

  // 页面加载后自动拉取
  if (root) fetchIndicators();
})();
