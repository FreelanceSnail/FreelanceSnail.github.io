import sqlite3
import psycopg2
import os
import sys

# SQLite数据库路径
SQLITE_DB_PATH = 'holdings.db'

# Neon连接信息
NEON_HOST = 'ep-lucky-resonance-a10togbn-pooler.ap-southeast-1.aws.neon.tech'  # 例如: ep-cool-darkness-123456.us-east-2.aws.neon.tech
NEON_PORT = '5432'  # 通常是5432
NEON_DB = 'aia'  # 例如: neondb
NEON_USER = 'neondb_owner'  # 例如: user
NEON_PASSWORD = 'npg_x1cOAL9DBmbk'  # 您的密码

def sqlite_to_neon():
    """将SQLite数据迁移到Neon PostgreSQL"""
    
    # 检查SQLite数据库是否存在
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"错误: 找不到SQLite数据库文件: {SQLITE_DB_PATH}")
        return False
    
    try:
        # 连接SQLite数据库
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()
        
        # 连接Neon PostgreSQL数据库
        neon_conn = psycopg2.connect(
            host=NEON_HOST,
            port=NEON_PORT,
            dbname=NEON_DB,
            user=NEON_USER,
            password=NEON_PASSWORD,
            sslmode='require'  # Neon需要SSL连接
        )
        neon_cursor = neon_conn.cursor()
        
        # 在Neon上创建holdings表
        neon_cursor.execute('''
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
        
        # 从SQLite获取所有记录
        sqlite_cursor.execute('SELECT * FROM holdings')
        rows = sqlite_cursor.fetchall()
        
        # 清空Neon表中的所有数据
        neon_cursor.execute('TRUNCATE TABLE holdings RESTART IDENTITY')
        
        # 将数据插入Neon
        for row in rows:
            neon_cursor.execute('''
            INSERT INTO holdings (
                symbol, name, type, current_price, preclose_price, 
                account, portfolio, quantity, avg_price, exchange, 
                margin_ratio, point_value, target_symbol, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                row['symbol'], row['name'], row['type'], 
                row['current_price'], row['preclose_price'],
                row['account'], row['portfolio'], 
                row['quantity'], row['avg_price'], row['exchange'],
                row['margin_ratio'], row['point_value'], 
                row['target_symbol'], row['created_at'], row['updated_at']
            ))
        
        # 提交事务
        neon_conn.commit()
        
        # 关闭连接
        sqlite_conn.close()
        neon_conn.close()
        
        print(f"成功将{len(rows)}条记录从SQLite迁移到Neon PostgreSQL数据库")
        return True
        
    except Exception as e:
        print(f"迁移过程中出错: {str(e)}")
        return False

if __name__ == "__main__":
    if NEON_HOST == 'YOUR_NEON_HOST':
        print("请先在脚本中配置您的Neon连接信息")
        sys.exit(1)
        
    print("开始数据迁移...")
    result = sqlite_to_neon()
    
    if result:
        print("迁移完成!")
    else:
        print("迁移失败，请检查错误信息。") 