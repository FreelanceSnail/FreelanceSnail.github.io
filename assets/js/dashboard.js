// 持仓数据和过滤选项
let holdingsData = [];
let portfolios = new Set();
let assetTypes = new Set();
let selectedPortfolio = 'all';
let selectedType = 'all';

// 资产类型映射
const typeMap = {
  'stock': '股票',
  'etf': 'ETF',
  'fund': '基金',
  'future': '期货',
  'option': '期权',
  'us_stock': '美股',
  'hk_stock': '港股',
  'cash': '现金'
};

// DOM元素
const portfolioSelector = document.getElementById('portfolio-selector');
const typeFilter = document.getElementById('type-filter');
const holdingsTable = document.getElementById('holdings-data');
const totalAssetsElement = document.getElementById('total-assets');
const totalProfitElement = document.getElementById('total-profit');
const dailyProfitElement = document.getElementById('daily-profit');
const assetAllocationChart = document.getElementById('asset-allocation-chart');
const overviewTitleElement = document.getElementById('overview-title');

// 自定义密码输入弹窗，输入内容星号显示
function passwordPrompt(message) {
  return new Promise((resolve) => {
    // 遮罩层
    const mask = document.createElement('div');
    mask.style.position = 'fixed';
    mask.style.left = 0;
    mask.style.top = 0;
    mask.style.width = '100vw';
    mask.style.height = '100vh';
    mask.style.background = 'rgba(0,0,0,0.25)';
    mask.style.zIndex = 9999;

    // 弹窗
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.left = '50%';
    dialog.style.top = '80px'; // 距离顶部80px
    dialog.style.transform = 'translateX(-50%)';
    dialog.style.background = '#fff';
    dialog.style.padding = '32px 28px 24px 28px';
    dialog.style.borderRadius = '12px';
    dialog.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
    dialog.style.textAlign = 'center';
    dialog.style.minWidth = '320px';
    dialog.style.maxWidth = '90vw';
    dialog.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif';

    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.marginBottom = '16px';
    msg.style.fontSize = '1.08em';
    msg.style.color = '#222';

    const input = document.createElement('input');
    input.type = 'password';
    input.style.width = '100%';
    input.style.padding = '10px';
    input.style.marginBottom = '18px';
    input.style.fontSize = '1em';
    input.style.border = '1px solid #d0d7de';
    input.style.borderRadius = '6px';
    input.style.outline = 'none';
    input.style.boxSizing = 'border-box';
    input.style.transition = 'border-color 0.2s';
    input.onfocus = () => { input.style.borderColor = '#409eff'; };
    input.onblur = () => { input.style.borderColor = '#d0d7de'; };

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'center';
    btnRow.style.gap = '12px';

    const okBtn = document.createElement('button');
    okBtn.textContent = '确定';
    okBtn.style.background = '#409eff';
    okBtn.style.color = '#fff';
    okBtn.style.border = 'none';
    okBtn.style.padding = '8px 24px';
    okBtn.style.borderRadius = '5px';
    okBtn.style.fontSize = '1em';
    okBtn.style.cursor = 'pointer';
    okBtn.style.boxShadow = '0 1px 2px rgba(64,158,255,0.07)';
    okBtn.onmouseenter = () => { okBtn.style.background = '#357ae8'; };
    okBtn.onmouseleave = () => { okBtn.style.background = '#409eff'; };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.background = '#f5f5f5';
    cancelBtn.style.color = '#333';
    cancelBtn.style.border = 'none';
    cancelBtn.style.padding = '8px 24px';
    cancelBtn.style.borderRadius = '5px';
    cancelBtn.style.fontSize = '1em';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onmouseenter = () => { cancelBtn.style.background = '#e0e0e0'; };
    cancelBtn.onmouseleave = () => { cancelBtn.style.background = '#f5f5f5'; };

    btnRow.appendChild(okBtn);
    btnRow.appendChild(cancelBtn);

    dialog.appendChild(msg);
    dialog.appendChild(input);
    dialog.appendChild(btnRow);
    mask.appendChild(dialog);
    document.body.appendChild(mask);

    // 事件
    okBtn.onclick = () => {
      const val = input.value;
      cleanup();
      resolve(val);
    };
    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') okBtn.onclick();
      if (e.key === 'Escape') cancelBtn.onclick();
    };
    input.focus();

    function cleanup() {
      document.body.removeChild(mask);
    }
  });
}

// 密码管理与弹窗（支持密码星号显示）
async function getPassword(forcePrompt=false) {
  while (true) {
    let pwd = sessionStorage.getItem('portfolio_pwd');
    if (!pwd || forcePrompt) {
      pwd = await passwordPrompt('请输入持仓管理密码：');
      if (pwd === null) {
        return null;
      }
      if (!pwd) continue; // 空密码，继续弹窗
      sessionStorage.setItem('portfolio_pwd', pwd);
    }
    return pwd;
  }
}

// 页面加载完成后执行
// 绑定刷新按钮和详细数据按钮事件
// 默认加载简要持仓数据，无需密码

document.addEventListener('DOMContentLoaded', () => {
  // 绑定刷新价格按钮
  const refreshBtn = document.getElementById('refresh-prices-btn');
  if (refreshBtn) {
    refreshBtn.onclick = refreshPrices;
  }
  // 绑定获取详细持仓按钮
  const detailBtn = document.getElementById('holdings-detail-btn');
  if (detailBtn) {
    detailBtn.onclick = fetchHoldingsDetail;
  }
  // 默认获取简要持仓数据（无需密码）
  fetchSimpleHoldings();
  // 初始化图表
  initCharts();
  // 获取汇率
  fetchAndShowRates();
});

// 从本地服务器获取持仓数据
// 获取无需密码的简要持仓数据
async function fetchSimpleHoldings() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/positions/summary`);
    if (!response.ok) throw new Error('网络错误');
    const data = await response.json();
    // 后端直接返回数组，不再有 results 字段
    const arr = Array.isArray(data) ? data : [];
    if (!arr.length && response.ok) console.warn('接口返回空数组'); // 如果响应成功但数组为空，打印警告而非报错
    else if (!Array.isArray(data)) throw new Error('接口返回格式错误: 期望数组'); // 如果不是数组则报错
    holdingsData = arr;
    portfolios = new Set(arr.map(item => item.portfolio));
    assetTypes = new Set(arr.map(item => item.type));
    updatePortfolioFilter();
    updateTypeFilter();
    renderHoldingsTable();
    updatePerformanceSummary();
    updateOverviewTitle();
    updateCharts();
    fetchAndShowRates();
  } catch (error) {
    console.error('获取持仓数据失败:', error);
    holdingsTable.innerHTML = `<tr><td colspan=\"8\" class=\"text-center text-danger\">获取数据失败: ${error.message}</td></tr>`;
    holdingsData = [];
    portfolios.clear();
    assetTypes.clear();
    updatePortfolioFilter();
    updateTypeFilter();
    renderHoldingsTable();
    updatePerformanceSummary();
    updateOverviewTitle();
    updateCharts();
    fetchAndShowRates();
  }
}

// 获取需要密码的详细持仓数据
async function fetchHoldingsDetail() {
  while (true) {
    let password = await getPassword();
    if (!password) return; // 用户取消
    try {
      const response = await fetch(`${API_BASE_URL}/api/positions/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      if (response.status === 401) {
        sessionStorage.removeItem('portfolio_pwd');
        alert('密码错误，请重试！');
        continue;
      }
      const data = await response.json();
      // 后端直接返回数组，不再有 results 字段
      const arr = Array.isArray(data) ? data : [];
      if (!arr.length && response.ok) console.warn('接口返回空数组'); // 如果响应成功但数组为空，打印警告而非报错
      else if (!Array.isArray(data)) throw new Error('接口返回格式错误: 期望数组'); // 如果不是数组则报错
      holdingsData = arr;
      portfolios = new Set(arr.map(item => item.portfolio));
      assetTypes = new Set(arr.map(item => item.type));
      updatePortfolioFilter();
      updateTypeFilter();
      renderHoldingsTable();
      updatePerformanceSummary();
      updateOverviewTitle();
      updateCharts();
      fetchAndShowRates();
      break;
    } catch (error) {
      console.error('获取详细持仓数据失败:', error);
      holdingsTable.innerHTML = `<tr><td colspan=\"8\" class=\"text-center text-danger\">获取数据失败: ${error.message}</td></tr>`;
      holdingsData = [];
      portfolios.clear();
      assetTypes.clear();
      updatePortfolioFilter();
      updateTypeFilter();
      renderHoldingsTable();
      updatePerformanceSummary();
      updateOverviewTitle();
      updateCharts();
      fetchAndShowRates();
      break;
    }
  }
}

// 刷新价格按钮
async function refreshPrices() {
  const password = await getPassword(true);
  if (!password) return;
  let res = await fetch(`${API_BASE_URL}/api/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (res.status === 401) {
    sessionStorage.removeItem('portfolio_pwd');
    alert('密码错误，无法刷新价格！');
    return;
  }
  let data = await res.json();
  alert(data.message || '刷新完成');
  fetchHoldings();
}

// 汇率显示
function fetchAndShowRates() {
  const ratesDiv = document.getElementById('exchange-rates');
  if (!holdingsData || !Array.isArray(holdingsData) || holdingsData.length === 0) {
    ratesDiv.textContent = '';
    return;
  }
  // 简要数据直接不显示
  const arr = holdingsData;
  const isSimple = arr.length > 0 && !('quantity' in arr[0]);
  if (isSimple) {
    ratesDiv.textContent = '';
    return;
  }
  let usdRate = null, hkdRate = null;
  for (let i = 0; i < arr.length; ++i) {
    const item = arr[i];
    if (!usdRate && item.type === 'us_stock' && item.exchange) usdRate = item.exchange;
    if (!hkdRate && item.type === 'hk_stock' && item.exchange) hkdRate = item.exchange;
    if (usdRate && hkdRate) break;
  }
  let html = '';
  if (usdRate) html += `<span>人民币兑美元：<b>${usdRate}</b></span>`;
  if (usdRate && hkdRate) html += ' &nbsp; | &nbsp; ';
  if (hkdRate) html += `<span>人民币兑港币：<b>${hkdRate}</b></span>`;
  ratesDiv.innerHTML = html;
}

// 更新投资组合过滤器
function updatePortfolioFilter() {
  let html = '<a href="#" class="list-group-item list-group-item-action ' + 
             (selectedPortfolio === 'all' ? 'active' : '') + 
             '" data-portfolio="all">全部</a>';
  
  portfolios.forEach(portfolio => {
    html += `<a href="#" class="list-group-item list-group-item-action ${selectedPortfolio === portfolio ? 'active' : ''}" 
             data-portfolio="${portfolio}">${portfolio}</a>`;
  });
  
  portfolioSelector.innerHTML = html;
  
  // 添加事件监听器
  document.querySelectorAll('#portfolio-selector a').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#portfolio-selector a').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');
      selectedPortfolio = e.target.getAttribute('data-portfolio');
      updateFilteredAndRender();
    });
  });
}

// 更新资产类型过滤器
function updateTypeFilter() {
  let html = '<a href="#" class="list-group-item list-group-item-action ' + 
             (selectedType === 'all' ? 'active' : '') + 
             '" data-type="all">全部</a>';
  
  // 使用全局typeMap获取类型名称
  
  assetTypes.forEach(type => {
    const displayName = typeMap[type] || type;
    html += `<a href="#" class="list-group-item list-group-item-action ${selectedType === type ? 'active' : ''}" 
             data-type="${type}">${displayName}</a>`;
  });
  
  typeFilter.innerHTML = html;
  
  // 添加事件监听器
  document.querySelectorAll('#type-filter a').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#type-filter a').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');
      selectedType = e.target.getAttribute('data-type');
      updateFilteredAndRender();
    });
  });
}

// 渲染持仓表格
function renderHoldingsTable(data) {
  const arr = data || holdingsData;
  if (!arr.length) {
    holdingsTable.innerHTML = '<tr><td colspan="13" class="text-center">没有符合条件的持仓</td></tr>';
    return;
  }
  // 为表格容器添加滚动条样式
  holdingsTable.parentElement.style.maxHeight = '500px';
  holdingsTable.parentElement.style.overflowY = 'auto';
  holdingsTable.parentElement.style.display = 'block';

  // 字段定义
  const simpleFields = [
    { key: 'symbol', name: '代码' },
    { key: 'name', name: '名称' },
    { key: 'type', name: '类型' },
    { key: 'portfolio', name: '账户' },
    { key: 'price', name: '现价' },
    { key: 'preclose', name: '前收' },
    { key: 'market_value_rate', name: '市值占比(%)' },
    { key: 'equalled_market_value_rate', name: '等效市值占比(%)' },
    { key: 'style', name: '风格' }
  ];
  const detailFields = [
    { key: 'symbol', name: '代码' },
    { key: 'name', name: '名称' },
    { key: 'type', name: '类型' },
    { key: 'portfolio', name: '账户' },
    { key: 'quantity', name: '数量' },
    { key: 'cost_price', name: '成本价' },
    { key: 'preclose', name: '前收' },
    { key: 'price', name: '现价' },
    { key: 'market_value', name: '市值' },
    { key: 'daily_profit', name: '当日盈亏' },
    { key: 'profit', name: '总盈亏' },
    { key: 'equalled_market_value', name: '等效市值' },
    { key: 'cost', name: '成本' },
    { key: 'target_symbol', name: '标的代码' },
    { key: 'market_value_rate', name: '市值占比(%)' },
    { key: 'equalled_market_value_rate', name: '等效市值占比(%)' },
    { key: 'style', name: '风格' },
    { key: 'delta', name: 'Delta' }
  ];

  // 判断是简要还是详细数据
  const isDetail = arr[0].hasOwnProperty('quantity');
  const fields = isDetail ? detailFields : simpleFields;

  // 生成表头
  let theadHtml = '<tr>' + fields.map(f => `<th>${f.name}</th>`).join('') + '</tr>';
  holdingsTable.parentElement.parentElement.querySelector('thead').innerHTML = theadHtml;

  // 生成表格内容
  let html = '';
  arr.forEach(holding => {
    html += '<tr style="white-space: nowrap;">';
    fields.forEach(f => {
      let val = holding[f.key];
      // 类型名特殊处理
      if (f.key === 'type') {
        val = typeMap[val] || val || '-';
      }
      // 百分比字段特殊处理
      else if (f.key === 'market_value_rate' || f.key === 'equalled_market_value_rate') {
        let num = Number(val);
        if (!isNaN(num)) {
          val = (num * 100).toFixed(3) + '%';
        } else {
          val = '-';
        }
      }
      // 数字格式化（除成本价、前收盘价、现价、symbol相关外全部保留两位小数）
      else if (
        typeof val === 'number' ||
        (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '')
      ) {
        if (
          f.key.includes('symbol') ||
          ['avg_price', 'cost_price', 'preclose', 'price'].includes(f.key)
        ) {
          val = val; // symbol相关或特殊字段，原样输出
        } else {
          val = Number(val).toFixed(2);
        }
      }
      // 时间格式化
      else if (f.key === 'updatedAt' && val) {
        val = String(val).replace('T', ' ').slice(0, 19);
      }
      if (val === undefined || val === null || val === '') val = '-';
      html += `<td>${val}</td>`;
    });
    html += '</tr>';
  });
  holdingsTable.innerHTML = html;
}

// 更新绩效概览
function updatePerformanceSummary(data) {
  const arr = data || holdingsData;
  // 判断是否为简要数据（无 quantity 字段）
  const isSimple = arr.length > 0 && !('quantity' in arr[0]);

  // 金额格式化
  const formatMoney = (num) => {
    return num.toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  // 百分比格式化
  const formatPercent = (num) => {
    return (num * 100).toFixed(2) + '%';
  };

  if (isSimple) {
    // 简要数据，展示整体市值比例和等效市值比例（直接求和）
    let marketValueRate = 0;
    let equalledMarketValueRate = 0;
    let styleEqualledMarketValueRate = {};
    arr.forEach(item => {
      marketValueRate += Number(item.market_value_rate) || 0;
      equalledMarketValueRate += Number(item.equalled_market_value_rate) || 0;
      const style = item.style || '未分类';
      if (!styleEqualledMarketValueRate[style]) styleEqualledMarketValueRate[style] = 0;
      styleEqualledMarketValueRate[style] += Number(item.equalled_market_value_rate) || 0;
    });
    // 只统计非现金/债券类等效市值比例
    const excludeStyles = ['现金', 'cash', '余额宝', '余额', '债券'];
    let nonCashBondEqualledRate = 0;
    for (const style in styleEqualledMarketValueRate) {
      if (!excludeStyles.some(ex => style.includes(ex))) {
        nonCashBondEqualledRate += styleEqualledMarketValueRate[style];
      }
    }
    // 动态改label，并显示比例
    document.getElementById('performance-summary-block').style.display = '';
    document.getElementById('total-assets-label').textContent = '非现金债券类等效市值比例:';
    document.getElementById('total-profit-label').textContent = '等效市值总比例:';
    document.getElementById('daily-profit-label').textContent = '';
    totalAssetsElement.textContent = formatPercent(nonCashBondEqualledRate);
    totalAssetsElement.className = '';
    totalProfitElement.textContent = formatPercent(equalledMarketValueRate);
    totalProfitElement.className = '';
    dailyProfitElement.textContent = '';
    dailyProfitElement.className = '';
    window.simpleStyleEqualledMarketValueRate = styleEqualledMarketValueRate;
    return;
  }

  // 详细数据，恢复label和显示
  document.getElementById('performance-summary-block').style.display = '';
  document.getElementById('total-assets-label').textContent = '总资产:';
  document.getElementById('total-profit-label').textContent = '总盈亏:';
  document.getElementById('daily-profit-label').textContent = '日盈亏:';

  let totalAssets = 0;
  let totalProfit = 0;
  let dailyProfit = 0;
  
  arr.forEach(holding => {
    const currentPrice = holding.current_price || 0;
    const costPrice = holding.avg_price || 0;
    const quantity = holding.quantity || 0;
    const preclosePrice = holding.preclose_price || currentPrice;
    // 计算
    const marketValue = currentPrice * quantity;
    const profit = (currentPrice - costPrice) * quantity;
    const dayProfit = (currentPrice - preclosePrice) * quantity;
    totalAssets += marketValue;
    totalProfit += profit;
    dailyProfit += dayProfit;
  });
  
  totalAssetsElement.textContent = formatMoney(totalAssets);
  totalAssetsElement.className = '';
  
  totalProfitElement.textContent = formatMoney(totalProfit);
  totalProfitElement.className = totalProfit > 0 ? 'text-success' : (totalProfit < 0 ? 'text-danger' : '');
  
  dailyProfitElement.textContent = formatMoney(dailyProfit);
  dailyProfitElement.className = dailyProfit > 0 ? 'text-success' : (dailyProfit < 0 ? 'text-danger' : '');
}

// 初始化图表
function initCharts() {
  // Chart.js 已在 HTML 中加载，不需要动态加载
  console.log('Chart.js is already loaded. Ready to create charts.');
}

// 更新图表
function updateCharts(data) {
  // 如果Chart.js已加载，则创建资产配置图表
  if (typeof Chart !== 'undefined' && assetAllocationChart) {
    // 优先使用简要数据下的风格等效市值比例（window.simpleStyleEqualledMarketValueRate）
    let chartLabels = [];
    let chartData = [];
    let colors = [];
    // 风格配色可自定义
    const styleColors = [
      '#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8F44AD', '#3498DB', '#F39C12', '#95A5A6', '#FF6F00', '#43A047', '#D81B60'
    ];
    let dataForChart = window.simpleStyleEqualledMarketValueRate;
    if (dataForChart) {
      chartLabels = Object.keys(dataForChart);
      chartData = Object.values(dataForChart);
      colors = chartLabels.map((_, i) => styleColors[i % styleColors.length]);
    } else if (data && Array.isArray(data)) {
      // 按风格分组资产
      const assetsByStyle = {};
      data.forEach(holding => {
        const style = holding.style || '未分类';
        if (!assetsByStyle[style]) {
          assetsByStyle[style] = 0;
        }
        assetsByStyle[style] += Number(holding.equalled_market_value) || 0;
      });
      chartLabels = Object.keys(assetsByStyle).map(style => style || '未分类');
      chartData = Object.values(assetsByStyle);
      colors = chartLabels.map((_, i) => styleColors[i % styleColors.length]);
    }
    // 销毁旧图表
    if (window.assetChart) {
      window.assetChart.destroy();
    }
    // 创建新图表
    const ctx = assetAllocationChart.getContext('2d');
    window.assetChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: colors,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: '资产配置',
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                return label + ': ' + (value * 100).toFixed(2) + '%';
              }
            }
          }
        }
      }
    });
  }
}

// 本地筛选和渲染主函数
function updateFilteredAndRender() {
  let filtered = holdingsData;
  if (selectedPortfolio !== 'all') {
    filtered = filtered.filter(item => item.portfolio === selectedPortfolio);
  }
  if (selectedType !== 'all') {
    filtered = filtered.filter(item => item.type === selectedType);
  }
  renderHoldingsTable(filtered);
  updatePerformanceSummary(filtered);
  updateOverviewTitle();
  updateCharts(filtered);
}

// 更新概览标题
function updateOverviewTitle() {
  const typeMap = {
    'stock': '股票',
    'etf': 'ETF',
    'fund': '基金',
    'future': '期货',
    'option': '期权',
    'us_stock': '美股',
    'cash': '现金'
  };
  
  if (selectedPortfolio === 'all' && selectedType === 'all') {
    overviewTitleElement.textContent = '总体概览';
  } else if (selectedType === 'all') {
    overviewTitleElement.textContent = `${selectedPortfolio} 概览`;
  } else {
    const typeName = typeMap[selectedType] || selectedType;
    const portfolioName = selectedPortfolio === 'all' ? '全部' : selectedPortfolio;
    overviewTitleElement.textContent = `${portfolioName}-${typeName} 概览`;
  }
}