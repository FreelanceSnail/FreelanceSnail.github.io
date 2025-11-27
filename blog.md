---
layout: page
title: 日志归档
lead: 所有记录按照时间归档，可按标签筛选和浏览。
permalink: /blog/
---

<ul class="list">
  {% for post in site.posts %}
    <li class="list__item">
      <a class="list__title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <p class="list__meta">{{ post.date | date: "%Y-%m-%d" }} · {{ post.tags | array_to_sentence_string }}</p>
      {% if post.summary %}<p class="list__summary">{{ post.summary }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>
