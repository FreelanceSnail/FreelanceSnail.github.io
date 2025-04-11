// 初始化LeanCloud应用
AV.init({
  appId: 'To9hBq0TNFRLU90cDkhklEI6-MdYXbMMI',
  appKey: '5p5CVOXd9zSi1207VBwLExC4',
  serverURL: 'https://to9hbq0t.api.lncldglobal.com'
});

// 持仓数据和过滤选项
let holdingsData = [];
let portfolios = new Set();
let assetTypes = new Set();
let selectedPortfolio = 'all';
let selectedType = 'all';
let realtimeUpdate = false;
let updateInterval = null;

// DOM元素
const portfolioSelector = document.getElementById('portfolio-selector');
const typeFilter = document.getElementById('type-filter');
const holdingsTable = document.getElementById('holdings-data');
const realtimeSwitch = document.getElementById('realtime-switch');
const totalAssetsElement = document.getElementById('total-assets');
const totalProfitElement = document.getElementById('total-profit');
const dailyProfitElement = document.getElementById('daily-profit');
const assetAllocationChart = document.getElementById('asset-allocation-chart');

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 获取持仓数据
  fetchHoldings();
  
  // 实时更新开关事件
  realtimeSwitch.addEventListener('change', toggleRealtimeUpdate);
  
  // 初始化图表
  initCharts();
});

// 从LeanCloud获取持仓数据
async function fetchHoldings() {
  try {
    const query = new AV.Query('holdings');
    query.limit(1000); // 设置一个足够大的限制以获取所有数据
    
    const results = await query.find();
    holdingsData = results.map(item => item.toJSON());
    
    // 提取投资组合和资产类型
    portfolios.clear();
    assetTypes.clear();
    
    holdingsData.forEach(holding => {
      if (holding.portfolio) portfolios.add(holding.portfolio);
      if (holding.type) assetTypes.add(holding.type);
    });
    
    // 更新UI
    updatePortfolioFilter();
    updateTypeFilter();
    renderHoldingsTable();
    updatePerformanceSummary();
    updateCharts();
    
  } catch (error) {
    console.error('获取持仓数据失败:', error);
    holdingsTable.innerHTML = `<tr><td colspan="8" class="text-center text-danger">获取数据失败: ${error.message}</td></tr>`;
  }
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
      renderHoldingsTable();
      updatePerformanceSummary();
      updateCharts();
    });
  });
}

// 更新资产类型过滤器
function updateTypeFilter() {
  let html = '<a href="#" class="list-group-item list-group-item-action ' + 
             (selectedType === 'all' ? 'active' : '') + 
             '" data-type="all">全部</a>';
  
  const typeMap = {
    'stock': '股票',
    'etf': 'ETF',
    'fund': '基金',
    'future': '期货',
    'option': '期权',
    'us_stock': '美股',
    'cash': '现金'
  };
  
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
      renderHoldingsTable();
      updatePerformanceSummary();
      updateCharts();
    });
  });
}

// 渲染持仓表格
function renderHoldingsTable() {
  // 过滤数据
  const filteredData = holdingsData.filter(holding => {
    const portfolioMatch = selectedPortfolio === 'all' || holding.portfolio === selectedPortfolio;
    const typeMatch = selectedType === 'all' || holding.type === selectedType;
    return portfolioMatch && typeMatch;
  });
  
  if (filteredData.length === 0) {
    holdingsTable.innerHTML = '<tr><td colspan="8" class="text-center">没有符合条件的持仓</td></tr>';
    return;
  }
  
  // 生成表格内容
  let html = '';
  
  filteredData.forEach(holding => {
    const currentPrice = holding.current_price || 0;
    const costPrice = holding.avg_price || 0;
    const quantity = holding.quantity || 0;
    
    // 计算盈亏
    const profit = (currentPrice - costPrice) * quantity;
    const profitPercent = costPrice > 0 ? (currentPrice / costPrice - 1) * 100 : 0;
    
    // 获取类型的中文名称
    const typeMap = {
      'stock': '股票',
      'etf': 'ETF',
      'fund': '基金',
      'future': '期货',
      'option': '期权',
      'us_stock': '美股',
      'cash': '现金'
    };
    const typeName = typeMap[holding.type] || holding.type;
    
    // 格式化数字
    const formatNumber = (num) => {
      return num.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    
    // 设置盈亏的颜色
    const profitClass = profit > 0 ? 'text-success' : (profit < 0 ? 'text-danger' : '');
    
    html += `
      <tr>
        <td>${holding.symbol || '-'}</td>
        <td>${holding.name || '-'}</td>
        <td>${typeName}</td>
        <td>${formatNumber(quantity)}</td>
        <td>${formatNumber(costPrice)}</td>
        <td>${formatNumber(currentPrice)}</td>
        <td class="${profitClass}">${formatNumber(profit)}</td>
        <td class="${profitClass}">${profitPercent.toFixed(2)}%</td>
      </tr>
    `;
  });
  
  holdingsTable.innerHTML = html;
}

// 更新绩效概览
function updatePerformanceSummary() {
  // 过滤数据
  const filteredData = holdingsData.filter(holding => {
    const portfolioMatch = selectedPortfolio === 'all' || holding.portfolio === selectedPortfolio;
    const typeMatch = selectedType === 'all' || holding.type === selectedType;
    return portfolioMatch && typeMatch;
  });
  
  // 计算总资产和总盈亏
  let totalAssets = 0;
  let totalProfit = 0;
  let dailyProfit = 0;
  
  filteredData.forEach(holding => {
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
  
  // 更新UI
  const formatMoney = (num) => {
    return num.toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  totalAssetsElement.textContent = formatMoney(totalAssets);
  totalAssetsElement.className = '';
  
  totalProfitElement.textContent = formatMoney(totalProfit);
  totalProfitElement.className = totalProfit > 0 ? 'text-success' : (totalProfit < 0 ? 'text-danger' : '');
  
  dailyProfitElement.textContent = formatMoney(dailyProfit);
  dailyProfitElement.className = dailyProfit > 0 ? 'text-success' : (dailyProfit < 0 ? 'text-danger' : '');
}

// 初始化图表
function initCharts() {
  // 此处可以引入图表库如Chart.js或ECharts
  // 示例：可以通过CDN引入Chart.js
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js';
  script.onload = function() {
    updateCharts();
  };
  document.head.appendChild(script);
}

// 更新图表
function updateCharts() {
  // 如果Chart.js已加载，则创建资产配置图表
  if (typeof Chart !== 'undefined' && assetAllocationChart) {
    // 过滤数据
    const filteredData = holdingsData.filter(holding => {
      const portfolioMatch = selectedPortfolio === 'all' || holding.portfolio === selectedPortfolio;
      const typeMatch = selectedType === 'all' || holding.type === selectedType;
      return portfolioMatch && typeMatch;
    });
    
    // 按类型分组资产
    const assetsByType = {};
    const typeColors = {
      'stock': '#4285F4',
      'etf': '#34A853',
      'fund': '#FBBC05',
      'future': '#EA4335',
      'option': '#8F44AD',
      'us_stock': '#3498DB',
      'cash': '#95A5A6'
    };
    
    const typeMap = {
      'stock': '股票',
      'etf': 'ETF',
      'fund': '基金',
      'future': '期货',
      'option': '期权',
      'us_stock': '美股',
      'cash': '现金'
    };
    
    filteredData.forEach(holding => {
      const type = holding.type || 'unknown';
      const marketValue = (holding.current_price || 0) * (holding.quantity || 0);
      
      if (!assetsByType[type]) {
        assetsByType[type] = 0;
      }
      
      assetsByType[type] += marketValue;
    });
    
    // 准备图表数据
    const labels = Object.keys(assetsByType).map(type => typeMap[type] || type);
    const data = Object.values(assetsByType);
    const colors = Object.keys(assetsByType).map(type => typeColors[type] || '#ccc');
    
    // 销毁旧图表
    if (window.assetChart) {
      window.assetChart.destroy();
    }
    
    // 创建新图表
    const ctx = assetAllocationChart.getContext('2d');
    window.assetChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
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
          }
        }
      }
    });
  }
}

// 切换实时更新
function toggleRealtimeUpdate() {
  realtimeUpdate = realtimeSwitch.checked;
  
  if (realtimeUpdate) {
    // 每30秒刷新一次数据
    updateInterval = setInterval(fetchHoldings, 30000);
  } else {
    clearInterval(updateInterval);
  }
} 