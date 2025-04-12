---
layout: page
title: 博客
permalink: /blog/
---

<div class="container">
  <div class="row">
    <div class="col-12">
    </div>
  </div>

  <!-- 置顶文章 -->
  {% assign sticky_posts = site.posts | where: "sticky", true %}
  {% if sticky_posts.size > 0 %}
    {% assign sticky_post = sticky_posts.first %}
    <div class="row mb-5">
      <div class="col-12">
        <div class="card border-primary">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">置顶文章</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-4">
                <a href="{{ sticky_post.url | relative_url }}">
                  <img src="{{ sticky_post.cover_image | default: '/assets/images/default-cover.svg' | relative_url }}" 
                       alt="{{ sticky_post.title }}" class="img-fluid rounded" style="width: 100%; height: 200px; object-fit: cover;">
                </a>
              </div>
              <div class="col-md-8">
                <h3 class="card-title">
                  <a href="{{ sticky_post.url | relative_url }}" class="text-decoration-none text-dark">{{ sticky_post.title }}</a>
                </h3>
                <h6 class="card-subtitle mb-3 text-muted">{{ sticky_post.date | date: "%Y-%m-%d" }}</h6>
                <p class="card-text">{{ sticky_post.excerpt | strip_html | truncate: 150 }}</p>
                <p class="card-text small text-muted">{{ sticky_post.summary | default: sticky_post.excerpt | strip_html | truncate: 15 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {% endif %}

  <!-- 最新文章列表 -->
  <div class="row">
    <div class="col-12 mb-3">
      <h2>最新文章</h2>
    </div>
  </div>

  <div class="row">
    {% for post in site.posts %}
      {% unless post.sticky %}
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <a href="{{ post.url | relative_url }}">
              <img src="{{ post.cover_image | default: '/assets/images/default-cover.svg' | relative_url }}" 
                   alt="{{ post.title }}" class="card-img-top" style="height: 180px; object-fit: cover;">
            </a>
            <div class="card-body">
              <h5 class="card-title">
                <a href="{{ post.url | relative_url }}" class="text-decoration-none text-dark">{{ post.title }}</a>
              </h5>
              <h6 class="card-subtitle mb-2 text-muted">{{ post.date | date: "%Y-%m-%d" }}</h6>
              <p class="card-text small">{{ post.summary | default: post.excerpt | strip_html | truncate: 15 }}</p>
            </div>
          </div>
        </div>
      {% endunless %}
    {% endfor %}
  </div>
</div> 