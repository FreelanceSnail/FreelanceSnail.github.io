---
layout: default
title: 蜗牛自由生活馆
author: FreelanceSnail
---
<section class="hero">
  <h1>蜗牛自由生活馆</h1>
  <p>一个极简、安静的角落，用来记录长期投资、自由职业实践、哲学思考与学习笔记。慢慢来，但要一直向前。</p>
</section>

<div class="grid">
  <div class="card">
    <h2>投资笔记</h2>
    <p>自下而上的研究、资产配置、风控节奏。站在时间的朋友一侧。</p>
  </div>
  <div class="card">
    <h2>自由职业生活</h2>
    <p>从项目到产品，从习惯到系统，用独立的方式创造价值。</p>
  </div>
  <div class="card">
    <h2>哲学感悟</h2>
    <p>在不确定中寻找秩序，写下思考，也接受更新后的答案。</p>
  </div>
  <div class="card">
    <h2>学习日志</h2>
    <p>学习方法、读书卡片和技能拆解，持续精炼知识树。</p>
  </div>
</div>

<h3 class="section-title">最新文章</h3>
<ul class="list">
  {% for post in site.posts limit: 6 %}
    <li class="list__item">
      <a class="list__title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <p class="list__meta">{{ post.date | date: "%Y-%m-%d" }} · {{ post.tags | array_to_sentence_string }}</p>
      {% if post.summary %}<p class="list__summary">{{ post.summary }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>

<h3 class="section-title">量化指标实验室</h3>
<div class="card">
  <p>这里预留给未来的量化指标展示与定期刷新。为每个指标新增一个子页面（例如 <code>/lab/alpha-curve</code>），
  将数据可视化或结果说明写进页面，即可自动加入导航与站点地图。</p>
  <div class="callout">
    <strong>下一步</strong>：创建 <code>lab/</code> 下的新 Markdown 文件，使用 <code>layout: page</code> 或自定义布局，嵌入图表或表格，并在 <code>_config.yml</code> 的 <code>navigation</code> 中添加链接。
  </div>
</div>
