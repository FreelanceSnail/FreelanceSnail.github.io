from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import csv
import os
import datetime

app = Flask(__name__)
CORS(app)  # 启用CORS支持

# 数据库配置
DB_PATH = 'holdings.db'

# 初始化数据库
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 创建holdings表
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT,
        name TEXT,
        type TEXT,
        current_price REAL,
        preclose_price REAL,
        account TEXT,
        portfolio TEXT,
        quantity REAL,
        avg_price REAL,
        exchange REAL,
        margin_ratio REAL,
        point_value REAL,
        target_symbol TEXT,
        created_at TEXT,
        updated_at TEXT
    )
    ''')
    
    conn.commit()
    conn.close()

# 从CSV文件导入数据
def import_csv_data(csv_file):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 清空现有数据
    cursor.execute('DELETE FROM holdings')
    
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    
    conn.commit()
    conn.close()

# API路由：获取所有持仓数据
@app.route('/api/holdings', methods=['POST'])
def get_holdings():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
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
    
    conn.close()
    return jsonify({'results': result})

# API路由：通过条件查询持仓数据
@app.route('/api/holdings/query', methods=['POST'])
def query_holdings():
    query_params = request.json
    where = query_params.get('where', {})
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = 'SELECT * FROM holdings WHERE 1=1'
    params = []
    
    for key, value in where.items():
        query += f' AND {key} = ?'
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
    
    conn.close()
    return jsonify({'results': result})

# 静态文件服务
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# 初始化数据库并导入数据
if __name__ == '__main__':
    init_db()
    csv_file = 'holdings_20250415_094150.csv'
    if os.path.exists(csv_file):
        import_csv_data(csv_file)
        print(f"已从{csv_file}导入数据")
    else:
        print(f"找不到CSV文件: {csv_file}")
    
    app.run(debug=True, port=5000) 