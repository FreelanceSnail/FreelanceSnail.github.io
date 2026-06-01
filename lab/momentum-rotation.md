---
layout: page
title: 动量轮动
lead: 聚焦 21-24 个交易日的动量表现，快速定位强势标的。
permalink: /dashboard/momentum-rotation/
---

利用 Akshare 拉取 4 支 ETF 的近月动量表现，按 21/22/23/24 个交易日的涨幅进行横向比较，并高亮各周期的领先标的。

- 标的池：30年国债ETF（511090）、黄金ETF（518880）、创业板ETF（159915）、中证A50ETF（563080）
- 数据源：Akshare `fund_etf_hist_em` + Sina 实时行情
- 更新方式：`python lab/tools/momentum_rotation.py`（需提前 `pip install -U akshare pandas requests`）

<div id="momentum-container">
  <div class="momentum-loading">正在加载数据…</div>
</div>

<p class="notes">
  刷新逻辑：脚本默认回溯 180 天的日线数据，通过收盘价计算 N 日涨幅；如需调整窗口，可修改
  <code>lab/tools/momentum_rotation.py</code> 中的 <code>start</code> 计算逻辑。
</p>

### 刷新数据

在仓库根目录执行：

```bash
python -m venv venv
./venv/bin/pip install -U akshare pandas
./venv/bin/python lab/tools/momentum_rotation.py
```

脚本会拉取最新数据并刷新 `lab/momentum-data.json`。若在服务器运行，记得定时任务前先激活虚拟环境。

<link rel="stylesheet" href="/lab/momentum-rotation.css">

<script>
(function() {
  const container = document.getElementById('momentum-container');

  function formatDate(yyyymmdd) {
    return yyyymmdd.slice(0, 4) + '-' + yyyymmdd.slice(4, 6) + '-' + yyyymmdd.slice(6, 8);
  }

  function render(dataset) {
    const startFmt = formatDate(dataset.start_date);
    const endFmt = formatDate(dataset.end_date);

    let html = '<p class="notes">数据时间窗：' + startFmt + ' ~ ' + endFmt + '；生成时间：' + dataset.generated_at + '。</p>';

    html += '<table class="momentum-table"><thead><tr><th>标的</th><th>代码</th>';
    for (const period of dataset.periods) {
      html += '<th>' + period + '日</th>';
    }
    html += '<th>最新价格时间</th><th>最新价</th></tr></thead><tbody>';

    for (const asset of dataset.assets) {
      html += '<tr>';
      html += '<td class="name-cell">' + asset.name + '</td>';
      html += '<td class="code-cell">' + asset.code + '</td>';
      for (const period of dataset.periods) {
        const pkey = String(period);
        const leader = dataset.leaders[pkey];
        const val = asset.returns[pkey];
        if (val !== undefined && val !== null) {
          const pct = (val * 100).toFixed(2);
          const bestClass = asset.code === leader ? ' is-best' : '';
          html += '<td class="num' + bestClass + '">' + pct + '%</td>';
        } else {
          html += '<td class="num">--</td>';
        }
      }
      html += '<td class="num">' + asset.last_price_time + '</td>';
      html += '<td class="num">' + asset.last_price + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function showError(msg) {
    container.innerHTML = '<div class="momentum-error">' + msg + '</div>';
  }

  fetch('/lab/momentum-data.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      if (!data.assets || data.assets.length === 0) {
        showError('数据文件为空，请先运行 <code>python lab/tools/momentum_rotation.py</code> 生成数据。');
        return;
      }
      render(data);
    })
    .catch(err => {
      showError('加载数据失败：' + err.message + '<br>请确认已运行 <code>python lab/tools/momentum_rotation.py</code> 生成数据。');
      console.error(err);
    });
})();
</script>
