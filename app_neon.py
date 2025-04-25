from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import datetime
import sys

# 尝试导入python-dotenv（如果安装了）
try:
    from dotenv import load_dotenv
    load_dotenv()  # 加载.env文件中的环境变量
    print("已加载.env环境变量")
except ImportError:
    print("python-dotenv未安装，仅使用系统环境变量")

app = Flask(__name__)
# 限制CORS配置，仅允许指定域名和本地调试访问
ALLOWED_ORIGINS = [
    "https://freelancesnail.github.io",  # 你的GitHub Pages域名
    "http://localhost:4000",            # 本地开发前端
    "http://127.0.0.1:4000",            # 本地开发前端
    "http://localhost:4001",            # 本地开发前端
    "http://127.0.0.1:4001"             # 本地开发前端
]
CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# 请求日志中间件
@app.before_request
def log_request_info():
    """在处理请求前记录请求信息"""
    # 获取当前时间
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # 获取访问者IP地址
    ip = request.remote_addr
    
    # 获取请求方法和路径
    method = request.method
    path = request.path
    
    # 获取User-Agent
    user_agent = request.headers.get('User-Agent', 'Unknown')
    
    # 获取Origin
    origin = request.headers.get('Origin', 'Unknown')
    
    # 获取请求数据（如果是JSON）
    json_data = ''
    if request.is_json and request.data:
        try:
            json_data = str(request.json)
        except:
            json_data = '解析JSON失败'
    
    # 打印访问日志
    print(f"[{now}] {ip} - {method} {path} - 来源: {origin} - {user_agent} - 数据: {json_data}")

import os
PORTFOLIO_PASSWORD = os.environ.get('PORTFOLIO_PASSWORD', '')
DB_TYPE = os.environ.get('DB_TYPE', 'postgres')
# API路由：获取所有持仓数据
from portfolio_manager import PortfolioManager

# 全局实例，避免多次连接/关闭数据库
portfolio_manager = PortfolioManager(db_type=DB_TYPE)

# 初始化数据库表结构（只需调用一次）
portfolio_manager.init_db()



# 详细持仓数据接口
@app.route('/api/holdings-detail', methods=['POST', 'GET'])
def get_holdings():
    password = ''
    if request.method == 'POST':
        data = request.get_json()
        password = data.get('password', '') if data else ''
    else:
        password = request.args.get('password', '')
    if password != PORTFOLIO_PASSWORD:
        return jsonify({'error': '密码错误'}), 401
    return jsonify({'results': portfolio_manager.read_holdings(safemode=False)})

# 新增无需密码校验的 holdings 路由
@app.route('/api/holdings', methods=['GET'])
def get_holdings_safemode():
    return jsonify({'results': portfolio_manager.read_holdings(safemode=True)})



# 全局变量跟踪价格更新线程状态
price_update_thread = None

# 价格刷新路由
@app.route('/api/refresh_prices', methods=['GET', 'POST'])
def refresh_prices():
    global price_update_thread
    # 密码支持GET参数或POST body
    password = ''
    if request.method == 'POST':
        data = request.get_json()
        password = data.get('password', '') if data else ''
    else:
        password = request.args.get('password', '')
    if password != PORTFOLIO_PASSWORD:
        return jsonify({'error': '密码错误'}), 401
    try:
        import threading
        # 检查是否已有线程在运行
        if price_update_thread and price_update_thread.is_alive():
            return jsonify({
                'status': 'success',
                'message': '价格更新任务已在运行中'
            })
        # 启动后台线程执行价格更新
        price_update_thread = threading.Thread(target=portfolio_manager.update_data, args=('akshare',))
        price_update_thread.start()
        return jsonify({
            'status': 'success',
            'message': '价格更新任务已开始'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'价格更新任务启动失败: {str(e)}'
        }), 500

# 数据刷新路由（不拉取akshare，仅刷新本地数据）
@app.route('/api/refresh_data', methods=['GET', 'POST'])
def refresh_data():
    global price_update_thread
    password = ''
    if request.method == 'POST':
        data = request.get_json()
        password = data.get('password', '') if data else ''
    else:
        password = request.args.get('password', '')
    if password != PORTFOLIO_PASSWORD:
        return jsonify({'error': '密码错误'}), 401
    try:
        import threading
        if price_update_thread and price_update_thread.is_alive():
            return jsonify({
                'status': 'success',
                'message': '数据刷新任务已在运行中'
            })
        price_update_thread = threading.Thread(target=portfolio_manager.update_data)
        price_update_thread.start()
        return jsonify({
            'status': 'success',
            'message': '数据刷新任务已开始'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'数据刷新任务启动失败: {str(e)}'
        }), 500

# 静态文件服务
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# 指标数据接口
@app.route('/api/indicators', methods=['GET'])
def get_indicators():
    """返回四类指标的模拟数据，供前端渲染"""
    data = {
        "futures_discount": [
            {"contract": "IF当月", "spot": 4000, "future": 3990, "discount": -10, "discount_rate": -0.25},
            {"contract": "IF次月", "spot": 4000, "future": 3985, "discount": -15, "discount_rate": -0.38},
            {"contract": "IF当季", "spot": 4000, "future": 3970, "discount": -30, "discount_rate": -0.75},
            {"contract": "IF次季", "spot": 4000, "future": 3960, "discount": -40, "discount_rate": -1.00}
        ],
        "index_ratio": {
            "hs300": 4000,
            "csi1000": 6000,
            "ratio": 0.6667
        },
        "risk_parity": [
            {"asset": "股票", "weight": 0.35},
            {"asset": "债券", "weight": 0.40},
            {"asset": "商品", "weight": 0.15},
            {"asset": "黄金", "weight": 0.10}
        ],
        "momentum_etf": [
            {"code": "510300", "name": "沪深300ETF", "chg21": 2.1, "chg22": 2.3, "chg23": 2.5, "chg24": 2.8},
            {"code": "159919", "name": "中证500ETF", "chg21": 1.8, "chg22": 2.0, "chg23": 2.2, "chg24": 2.4},
            {"code": "512100", "name": "中证1000ETF", "chg21": 2.9, "chg22": 3.1, "chg23": 3.0, "chg24": 2.7}
        ]
    }
    return jsonify(data)

# 首页路由
@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': 'Flask API服务运行正常 (Neon PostgreSQL版)',
        'endpoints': [
            '/api/holdings - 获取所有持仓数据',
            '/api/indicators - 获取指标模拟数据'
        ]
    })

# 初始化数据库
if __name__ == '__main__':
    import os
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 10000))
    print(f"Flask后端服务已启动，监听 {host}:{port} ...")
    print("连接到Neon PostgreSQL数据库")
    app.run(debug=True, host=host, port=port)