#!/bin/bash

# 创建目录（如果不存在）
mkdir -p assets/css
mkdir -p assets/js
mkdir -p assets/fonts

# 下载 Bootstrap CSS
curl -L "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" -o assets/css/bootstrap.min.css

# 下载 Bootstrap JS
curl -L "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" -o assets/js/bootstrap.bundle.min.js

# 下载 FontAwesome CSS
curl -L "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" -o assets/css/fontawesome.all.min.css

# 下载 FontAwesome Webfonts（只下载常用的几种字体文件）
cd assets/fonts
curl -O "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2"
curl -O "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2"
curl -O "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2"
cd ../../

# 下载 Chart.js
curl -L "https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js" -o assets/js/chart.min.js

# 下载 ECharts
curl -L "https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js" -o assets/js/echarts.min.js

echo "所有外部 CSS 和 JS 已下载到 assets/css 和 assets/js 目录下。"
