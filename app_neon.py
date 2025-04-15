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
# 增强CORS配置，允许所有来源，包括GitHub Pages
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# 从环境变量获取Neon数据库连接信息
NEON_HOST = os.environ.get('NEON_HOST', '')
NEON_PORT = os.environ.get('NEON_PORT', '5432')
NEON_DB = os.environ.get('NEON_DB', '')
NEON_USER = os.environ.get('NEON_USER', '')
NEON_PASSWORD = os.environ.get('NEON_PASSWORD', '')

# 获取数据库连接
def get_db_connection():
    """创建到Neon PostgreSQL的数据库连接"""
    # 检查连接信息是否完整
    if not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
        raise ValueError("数据库连接信息不完整，请确保已设置所有必要的环境变量")
        
    conn = psycopg2.connect(
        host=NEON_HOST,
        port=NEON_PORT,
        dbname=NEON_DB,
        user=NEON_USER,
        password=NEON_PASSWORD,
        sslmode='require'  # Neon需要SSL连接
    )
    conn.autocommit = True
    return conn

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

# 初始化数据库
def init_db():
    """创建数据库表结构（如果不存在）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 创建holdings表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        symbol TEXT,
        name TEXT,
        type TEXT,
        current_price NUMERIC,
        preclose_price NUMERIC,
        account TEXT,
        portfolio TEXT,
        quantity NUMERIC,
        avg_price NUMERIC,
        exchange NUMERIC,
        margin_ratio NUMERIC,
        point_value NUMERIC,
        target_symbol TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    ''')
    
    cursor.close()
    conn.close()

# API路由：获取所有持仓数据
@app.route('/api/holdings', methods=['POST', 'GET'])
def get_holdings():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute('SELECT * FROM holdings')
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        result.append({
            'objectId': row['id'],
            'symbol': row['symbol'],
            'name': row['name'],
            'type': row['type'],
            'current_price': row['current_price'],
            'preclose_price': row['preclose_price'],
            'account': row['account'],
            'portfolio': row['portfolio'],
            'quantity': row['quantity'],
            'avg_price': row['avg_price'],
            'exchange': row['exchange'],
            'margin_ratio': row['margin_ratio'],
            'point_value': row['point_value'],
            'target_symbol': row['target_symbol'],
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at']
        })
    
    cursor.close()
    conn.close()
    return jsonify({'results': result})

# API路由：通过条件查询持仓数据
@app.route('/api/holdings/query', methods=['POST', 'GET'])
def query_holdings():
    where = {}
    
    # 处理POST JSON请求
    if request.method == 'POST' and request.is_json:
        try:
            query_params = request.json or {}
            where = query_params.get('where', {})
        except:
            # 如果JSON解析失败，使用空字典
            pass
    
    # 处理GET请求的参数
    elif request.method == 'GET':
        portfolio = request.args.get('portfolio')
        type_ = request.args.get('type')
        
        if portfolio:
            where['portfolio'] = portfolio
        if type_:
            where['type'] = type_
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    query = 'SELECT * FROM holdings WHERE 1=1'
    params = []
    
    for key, value in where.items():
        query += f' AND {key} = %s'
        params.append(value)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        result.append({
            'objectId': row['id'],
            'symbol': row['symbol'],
            'name': row['name'],
            'type': row['type'],
            'current_price': row['current_price'],
            'preclose_price': row['preclose_price'],
            'account': row['account'],
            'portfolio': row['portfolio'],
            'quantity': row['quantity'],
            'avg_price': row['avg_price'],
            'exchange': row['exchange'],
            'margin_ratio': row['margin_ratio'],
            'point_value': row['point_value'],
            'target_symbol': row['target_symbol'],
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at']
        })
    
    cursor.close()
    conn.close()
    return jsonify({'results': result})

# 静态文件服务
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# 首页路由
@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': 'Flask API服务运行正常 (Neon PostgreSQL版)',
        'endpoints': [
            '/api/holdings - 获取所有持仓数据',
            '/api/holdings/query - 条件查询持仓数据'
        ]
    })

# 初始化数据库
if __name__ == '__main__':
    # 检查环境变量是否设置
    if not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
        print("错误: 数据库连接信息不完整")
        print("请确保已设置以下环境变量或在.env文件中定义:")
        print("- NEON_HOST")
        print("- NEON_PORT (可选，默认5432)")
        print("- NEON_DB")
        print("- NEON_USER")
        print("- NEON_PASSWORD")
        sys.exit(1)
        
    # 初始化数据库结构
    try:
        init_db()
    except Exception as e:
        print(f"初始化数据库时出错: {str(e)}")
        sys.exit(1)
    
    print("Flask后端服务已启动，监听端口5000...")
    print("连接到Neon PostgreSQL数据库")
    print("访问 http://localhost:4001 查看完整应用")
    app.run(debug=True, port=5000)