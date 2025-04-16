#!/bin/bash

echo "启动服务中..."

# 先安装缺少的依赖
echo "正在安装Jekyll依赖..."
bundle install

# 在后台启动Jekyll服务
start_jekyll() {
  echo "正在启动Jekyll服务..."
  if command -v gnome-terminal >/dev/null; then
    gnome-terminal -- bash -c "bundle exec jekyll serve; read -p 'Press Enter to close...'"
  elif command -v xterm >/dev/null; then
    xterm -e "bundle exec jekyll serve; read -p 'Press Enter to close...'"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Terminal.app "bash -c 'bundle exec jekyll serve; read -p \"Press Enter to close...\"'"
  else
    echo "未找到可用的终端，请手动启动 Jekyll 服务。"
  fi
}

# 在后台启动Flask服务
start_flask() {
  echo "正在启动Flask服务..."
  if command -v gnome-terminal >/dev/null; then
    gnome-terminal -- bash -c "python app_neon.py; read -p 'Press Enter to close...'"
  elif command -v xterm >/dev/null; then
    xterm -e "python app_neon.py; read -p 'Press Enter to close...'"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Terminal.app "bash -c 'python app_neon.py; read -p \"Press Enter to close...\"'"
  else
    echo "未找到可用的终端，请手动启动 Flask 服务。"
  fi
}

start_jekyll &
start_flask &
wait

echo "服务启动完成！"
echo "Jekyll前端服务地址: http://localhost:4000"
echo "Flask后端服务地址: http://localhost:5000"
echo ""
echo "请在浏览器中访问: http://localhost:4000"
echo ""
echo "此窗口可关闭，服务将在各自的终端窗口中运行" 