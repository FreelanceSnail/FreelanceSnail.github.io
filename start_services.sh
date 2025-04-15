#!/bin/bash

echo "启动服务中..."

# 先安装缺少的依赖
echo "正在安装Jekyll依赖..."
bundle install

# 在后台启动Jekyll服务
echo "正在启动Jekyll服务..."
gnome-terminal -- bash -c "bundle exec jekyll serve; read -p 'Press Enter to close...'" || \
xterm -e "bundle exec jekyll serve; read -p 'Press Enter to close...'" || \
open -a Terminal.app "bash -c \"bundle exec jekyll serve; read -p 'Press Enter to close...'\""

# 在后台启动Flask服务
echo "正在启动Flask服务..."
gnome-terminal -- bash -c "python app.py; read -p 'Press Enter to close...'" || \
xterm -e "python app.py; read -p 'Press Enter to close...'" || \
open -a Terminal.app "bash -c \"python app.py; read -p 'Press Enter to close...'\""

echo "服务启动完成！"
echo "Jekyll前端服务地址: http://localhost:4000"
echo "Flask后端服务地址: http://localhost:5000"
echo ""
echo "请在浏览器中访问: http://localhost:4000"
echo ""
echo "此窗口可关闭，服务将在各自的终端窗口中运行" 