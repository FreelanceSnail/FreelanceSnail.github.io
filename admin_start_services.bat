@echo off
chcp 65001 > nul

:: 检查是否以管理员身份运行
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 已获得管理员权限，开始启动服务...
) else (
    echo 正在请求管理员权限...
    powershell -Command "Start-Process -FilePath '%~dpnx0' -Verb RunAs"
    exit /b
)

:: 设置工作目录为脚本所在目录
cd /d "%~dp0"
echo 当前工作目录: %CD%

:: 检查关键文件是否存在
if not exist "app.py" (
    echo 错误: 找不到app.py文件!
    echo 请确保在项目根目录下运行此脚本。
    pause
    exit /b 1
)

echo 启动服务中...

REM 先安装缺少的依赖
echo 正在安装Jekyll依赖...
call bundle install

REM 尝试关闭可能占用端口的进程
echo 尝试释放端口4001...
netstat -ano | findstr :4001 > temp.txt
for /f "tokens=5" %%a in (temp.txt) do (
    taskkill /f /pid %%a 2>nul
)
del temp.txt

REM 创建两个窗口分别启动Jekyll和Flask服务
echo 正在启动Jekyll服务...
start "Jekyll前端服务" cmd /k "cd /d "%~dp0" && chcp 65001 > nul && echo 正在启动Jekyll服务(端口4001)... && bundle exec jekyll serve --port 4001"

echo 正在启动Flask服务(不导入CSV数据)...
start "Flask后端服务" cmd /k "cd /d "%~dp0" && chcp 65001 > nul && echo 正在启动Flask服务... && python app.py"

echo 服务启动完成！
echo Jekyll前端服务地址: http://localhost:4001
echo Flask后端服务地址: http://localhost:5000
echo.
echo 请在浏览器中访问: http://localhost:4001
echo.
echo 如需重新导入CSV数据，请访问: http://localhost:5000/api/import-csv
echo.
echo 按任意键退出...
pause > nul 