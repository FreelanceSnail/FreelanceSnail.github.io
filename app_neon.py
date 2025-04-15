from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import datetime
import sys

app = Flask(__name__)
# 增强CORS配置，允许所有来源，包括GitHub Pages
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Neon数据库连接信息
NEON_HOST = 'ep-lucky-resonance-a10togbn-pooler.ap-southeast-1.aws.neon.tech'  # 例如: ep-cool-darkness-123456.us-east-2.aws.neon.tech
NEON_PORT = '5432'  # 通常是5432
NEON_DB = 'aia'  # 例如: neondb
NEON_USER = 'neondb_owner'  # 例如: user
NEON_PASSWORD = 'npg_x1cOAL9DBmbk'  # 您的密码

# 获取数据库连接
def get_db_connection():
    """创建到Neon PostgreSQL的数据库连接"""
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

# 从CSV文件导入数据
def import_csv_data(csv_file):
    """从CSV文件导入数据到数据库"""
    import csv
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 清空现有数据
    cursor.execute('TRUNCATE TABLE holdings RESTART IDENTITY')
    
    # 读取CSV文件并导入数据
    with open(csv_file, 'r', encoding='utf-8') as f:
        csv_reader = csv.reader(f)
        header = next(csv_reader)  # 跳过表头
        
        now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        for row in csv_reader:
            # 处理空值
            for i in range(len(row)):
                if row[i] == '':
                    row[i] = None
            
            cursor.execute('''
            INSERT INTO holdings (
                symbol, name, type, current_price, preclose_price, 
                account, portfolio, quantity, avg_price, exchange, 
                margin_ratio, point_value, target_symbol, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                row[0], row[1], row[2], 
                float(row[3]) if row[3] is not None else None, 
                float(row[4]) if row[4] is not None else None,
                row[5], row[6], 
                float(row[7]) if row[7] is not None else None, 
                float(row[8]) if row[8] is not None else None, 
                float(row[9]) if row[9] is not None else None,
                float(row[10]) if row[10] is not None else None, 
                float(row[11]) if row[11] is not None else None, 
                row[12], now, now
            ))
    
    cursor.close()
    conn.close()

# 检查数据库是否为空
def is_db_empty():
    """检查数据库是否为空"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM holdings')
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count == 0

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

# API路由：手动导入CSV数据
@app.route('/api/import-csv', methods=['GET'])
def import_csv():
    csv_file = 'holdings_20250415_094150.csv'
    if os.path.exists(csv_file):
        import_csv_data(csv_file)
        return jsonify({
            'status': 'success',
            'message': f'已成功从{csv_file}导入数据'
        })
    else:
        return jsonify({
            'status': 'error',
            'message': f'找不到CSV文件: {csv_file}'
        }), 404

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
            '/api/holdings/query - 条件查询持仓数据',
            '/api/import-csv - 手动导入CSV数据'
        ]
    })

# 初始化数据库并导入数据
if __name__ == '__main__':
    if NEON_HOST == 'YOUR_NEON_HOST':
        print("错误: 请先在脚本中配置您的Neon连接信息")
        sys.exit(1)
        
    # 初始化数据库结构
    init_db()
    
    # 检查命令行参数
    import_flag = '--import-csv' in sys.argv
    
    # 检查是否需要导入数据
    csv_file = 'holdings_20250415_094150.csv'
    if import_flag:
        # 明确要求导入数据
        if os.path.exists(csv_file):
            import_csv_data(csv_file)
            print(f"已从{csv_file}导入数据")
        else:
            print(f"找不到CSV文件: {csv_file}")
    elif is_db_empty() and os.path.exists(csv_file):
        # 仅在数据库为空时导入数据
        import_csv_data(csv_file)
        print(f"数据库为空，已从{csv_file}导入初始数据")
    else:
        print("保留现有数据库内容，未导入CSV数据")
    
    print("Flask后端服务已启动，监听端口5000...")
    print("连接到Neon PostgreSQL数据库")
    print("访问 http://localhost:4001 查看完整应用")
    print("要手动导入CSV数据，可访问: http://localhost:5000/api/import-csv")
    app.run(debug=True, port=5000) 