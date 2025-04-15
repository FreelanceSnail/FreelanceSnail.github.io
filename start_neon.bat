@echo off
chcp 65001 > nul

:: 设置工作目录为脚本所在目录
cd /d "%~dp0"
echo 当前工作目录: %CD%

:: 检查关键文件是否存在
if not exist "app_neon.py" (
    echo 错误: 找不到app_neon.py文件!
    echo 请确保在项目根目录下运行此脚本。
    pause
    exit /b 1
)

echo 启动服务中...

REM 安装依赖
echo 正在检查依赖...
pip show psycopg2-binary >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在安装psycopg2-binary...
    pip install psycopg2-binary
)

REM 启动服务
echo 正在启动基于Neon的Flask服务...
start "Flask服务(Neon版)" cmd /k "cd /d "%~dp0" && chcp 65001 > nul && python app_neon.py"

echo 正在启动Jekyll前端服务...
start "Jekyll前端服务" cmd /k "cd /d "%~dp0" && chcp 65001 > nul && bundle exec jekyll serve --port 4001"

echo 服务启动完成！
echo Jekyll前端服务地址: http://localhost:4001
echo Flask后端服务地址: http://localhost:5000
echo.
echo 请在浏览器中访问: http://localhost:4001
echo.
echo 按任意键退出...
pause > nul 