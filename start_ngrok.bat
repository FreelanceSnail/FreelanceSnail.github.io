@echo off
chcp 65001 > nul
echo 启动ngrok内网穿透服务...

:: 检查ngrok是否安装
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 找不到ngrok命令
    echo 请先从 https://ngrok.com/download 下载并安装ngrok
    echo 并确保已添加到PATH环境变量中
    pause
    exit /b 1
)

:: 检查Flask服务是否运行
echo 检查本地Flask服务是否已启动...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo 警告: 本地Flask服务未启动或无法访问
    echo 请先运行 start_services.bat 启动Flask服务
    choice /c yn /m "是否继续启动ngrok? (y/n)"
    if %errorlevel% neq 1 exit /b 0
)

:: 启动ngrok
echo 启动ngrok，将本地5000端口暴露到公网...
echo.
echo ================================================
echo 启动后请记下ngrok提供的公网URL（https://xxxx.ngrok.io）
echo 您需要将此URL配置到前端代码中
echo ================================================
echo.

:: 启动ngrok服务
ngrok http 5000

:: 如果ngrok退出，则提示用户
echo ngrok服务已结束。
pause 