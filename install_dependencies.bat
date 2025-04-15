@echo off
chcp 65001 > nul
echo 安装Python依赖...

pip install flask flask-cors psycopg2-binary python-dotenv

echo 安装完成。
echo 请确保已创建.env文件并正确配置数据库连接信息。
pause 