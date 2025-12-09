---
layout: page
title: 动量轮动
lead: 聚焦 21-24 个交易日的动量表现，快速定位强势标的。
permalink: /gespenst_edge/momentum-rotation/
---

利用 Akshare 拉取 4 支 ETF 的近月动量表现，按 21/22/23/24 个交易日的涨幅进行横向比较，并高亮各周期的领先标的。

- 标的池：30年国债ETF（511090）、黄金ETF（518880）、创业板ETF（159915）、中证A50ETF（563080）
- 数据源：Akshare `fund_etf_hist_em`
- 更新方式：`python lab/tools/momentum_rotation.py`（需提前 `pip install -U akshare pandas`）

{% assign dataset = site.data.momentum_rotation %}
{% if dataset %}
{% assign start_y = dataset.start_date | slice: 0, 4 %}
{% assign start_m = dataset.start_date | slice: 4, 2 %}
{% assign start_d = dataset.start_date | slice: 6, 2 %}
{% assign start_fmt = start_y | append: "-" | append: start_m | append: "-" | append: start_d %}
{% assign end_y = dataset.end_date | slice: 0, 4 %}
{% assign end_m = dataset.end_date | slice: 4, 2 %}
{% assign end_d = dataset.end_date | slice: 6, 2 %}
{% assign end_fmt = end_y | append: "-" | append: end_m | append: "-" | append: end_d %}

> 数据时间窗：{{ start_fmt }} ~ {{ end_fmt }}；生成时间：{{ dataset.generated_at }}。

<table class="momentum-table">
  <thead>
    <tr>
      <th>标的</th>
      <th>代码</th>
      {% for period in dataset.periods %}
      <th>{{ period }}日</th>
      {% endfor %}
      <th>最新收盘日</th>
      <th>最新收盘价</th>
    </tr>
  </thead>
  <tbody>
    {% for asset in dataset.assets %}
    <tr>
      <td class="name-cell">{{ asset.name }}</td>
      <td class="code-cell">{{ asset.code }}</td>
      {% for period in dataset.periods %}
        {% assign pkey = period | append: "" %}
        {% assign leader = dataset.leaders[pkey] %}
        {% assign val = asset.returns[pkey] %}
        {% if val %}
          {% assign pct = val | times: 100 %}
          <td class="num {% if asset.code == leader %}is-best{% endif %}">{{ pct | round: 2 }}%</td>
        {% else %}
          <td class="num">--</td>
        {% endif %}
      {% endfor %}
      <td class="num">{{ asset.last_date }}</td>
      <td class="num">{{ asset.last_close }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>

<p class="notes">
  刷新逻辑：脚本默认回溯 180 天的日线数据，通过收盘价计算 N 日涨幅；如需调整窗口，可修改
  <code>lab/tools/momentum_rotation.py</code> 中的 <code>start</code> 计算逻辑。
</p>

<style>
.momentum-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
}
.momentum-table th,
.momentum-table td {
  border: 1px solid #e5e7eb;
  padding: 0.6rem 0.8rem;
}
.momentum-table th {
  background: #f8fafc;
  text-align: center;
  font-weight: 600;
}
.momentum-table td.name-cell,
.momentum-table td.code-cell {
  text-align: left;
  font-weight: 600;
}
.momentum-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.is-best {
  background: #fff3bf;
  color: #8c6d1f;
  font-weight: 700;
}
.notes {
  color: #4b5563;
  font-size: 0.9rem;
}
</style>
{% else %}

> 数据文件缺失或尚未生成，请先运行 `python lab/tools/momentum_rotation.py`（需安装 `akshare` 与 `pandas`）以写入 `_data/momentum_rotation.json`。

{% endif %}

### 刷新数据

在仓库根目录执行：

```bash
python -m venv venv
./venv/bin/pip install -U akshare pandas
./venv/bin/python lab/tools/momentum_rotation.py
```

脚本会拉取最新数据并刷新 `_data/momentum_rotation.json`。若在服务器运行，记得定时任务前先激活虚拟环境。
