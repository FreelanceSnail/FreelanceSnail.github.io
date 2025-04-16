import akshare as ak
import psycopg2
import psycopg2.extras
import os
import datetime
from typing import List, Dict

# 从环境变量获取Neon数据库连接信息
NEON_HOST = os.environ.get('NEON_HOST', '')
NEON_PORT = os.environ.get('NEON_PORT', '5432')
NEON_DB = os.environ.get('NEON_DB', '')
NEON_USER = os.environ.get('NEON_USER', '')
NEON_PASSWORD = os.environ.get('NEON_PASSWORD', '')

class PortfolioManager:
    def __init__(self):
        pass  # 不再保存 self.conn

    def init_db(self):
        """初始化数据库，创建 holdings 表（如果不存在）"""
        if not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
            raise ValueError("数据库连接信息不完整")
        with psycopg2.connect(
            host=NEON_HOST,
            port=NEON_PORT,
            dbname=NEON_DB,
            user=NEON_USER,
            password=NEON_PASSWORD,
            sslmode='require'
        ) as conn:
            conn.autocommit = True
            with conn.cursor() as cursor:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS holdings (
                        id SERIAL PRIMARY KEY,
                        symbol VARCHAR(32) NOT NULL,
                        current_price FLOAT,
                        preclose_price FLOAT,
                        updated_at TIMESTAMP
                    )
                ''')

    def read_holdings(self) -> List[Dict]:
        """读取当前持仓信息，并返回前端需要的字段格式"""
        if not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
            raise ValueError("数据库连接信息不完整")
        with psycopg2.connect(
            host=NEON_HOST,
            port=NEON_PORT,
            dbname=NEON_DB,
            user=NEON_USER,
            password=NEON_PASSWORD,
            sslmode='require'
        ) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
                cursor.execute('SELECT * FROM holdings')
                rows = cursor.fetchall()
                result = []
                for row in rows:
                    result.append({
                        'objectId': row.get('id'),
                        'symbol': row.get('symbol'),
                        'name': row.get('name'),
                'type': row.get('type'),
                'current_price': row.get('current_price'),
                'preclose_price': row.get('preclose_price'),
                'account': row.get('account'),
                'portfolio': row.get('portfolio'),
                'quantity': row.get('quantity'),
                'avg_price': row.get('avg_price'),
                'exchange': row.get('exchange'),
                'margin_ratio': row.get('margin_ratio'),
                'point_value': row.get('point_value'),
                'target_symbol': row.get('target_symbol'),
                'createdAt': row.get('created_at'),
                'updatedAt': row.get('updated_at')
            })
        cursor.close()
        return result

    def update_prices(self) -> List[Dict]:
        """
        从akshare获取实时价格数据并更新数据库
        返回: 更新后的持仓数据列表
        """
        return []
        try:
            holdings = self.read_holdings()
            if not holdings:
                print("[INFO] 当前无持仓，无需更新价格。")
                return []
            symbols = [h['symbol'] for h in holdings]
            # 获取最新价格（示例代码，需根据实际情况调整）
            updated_data = []
            for symbol in symbols:
                try:
                    price_info = ak.stock_zh_a_spot(indicator="实时行情")
                    row = price_info[price_info['代码'] == symbol]
                    if not row.empty:
                        current_price = float(row.iloc[0]['最新价'])
                        preclose_price = float(row.iloc[0]['昨收'])
                        updated_data.append({
                            'symbol': symbol,
                            'current_price': current_price,
                            'preclose_price': preclose_price
                        })
                except Exception as e:
                    self.log_update_error(e)
            # 更新数据库
            cursor = self.conn.cursor()
            for holding in updated_data:
                cursor.execute(
                    """
                    UPDATE holdings 
                    SET current_price = %s, 
                        preclose_price = %s,
                        updated_at = %s
                    WHERE symbol = %s
                    """,
                    (holding['current_price'], 
                     holding['preclose_price'],
                     datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                     holding['symbol'])
                )
            cursor.close()
            return updated_data
        except Exception as e:
            self.log_update_error(e)
            raise

    def log_update_error(self, error: Exception):
        """记录价格更新错误"""
        print(f"[ERROR] {datetime.datetime.now()}: {str(error)}")

    def close_connection(self):
        if self.conn:
            self.conn.close()

if __name__ == "__main__":
    # 仅用于本文件调试或命令行运行时的示例
    portfolio_manager = PortfolioManager()
    portfolio_manager.init_db()
    portfolio_manager.update_prices()
    portfolio_manager.close_connection()
