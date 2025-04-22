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

import os
import psycopg2
import sqlite3

class PortfolioManager:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close_connection()

    def __init__(self, db_type='postgres', sqlite_path='portfolio.db'):
        self.db_type = db_type  # 'postgres' or 'sqlite'
        self.sqlite_path = sqlite_path

    def get_connection(self):
        if self.db_type == 'sqlite':
            conn = sqlite3.connect(self.sqlite_path)
            conn.row_factory = sqlite3.Row  # dict-like access
            return conn
        else:
            return psycopg2.connect(
                host=NEON_HOST,
                port=NEON_PORT,
                dbname=NEON_DB,
                user=NEON_USER,
                password=NEON_PASSWORD,
                sslmode='require'
            )

    def init_db(self):
        if self.db_type == 'sqlite':
            create_sql = '''
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
                    updated_at TEXT,
                    market_value_rate REAL DEFAULT 0,
                    risk_exposure_rate REAL DEFAULT 0,
                    market_value REAL DEFAULT 0,
                    risk_exposure REAL DEFAULT 0,
                    style TEXT,
                    cost REAL,
                    delta REAL,
                    profit REAL,
                    daily_profit REAL,
                    target_symbol_point REAL,
                    target_symbol_pct REAL
                )
            '''
        else:
            if not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
                raise ValueError("数据库连接信息不完整")
            create_sql = '''
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
                    updated_at TEXT,
                    market_value_rate NUMERIC DEFAULT 0,
                    risk_exposure_rate NUMERIC DEFAULT 0,
                    market_value NUMERIC DEFAULT 0,
                    risk_exposure NUMERIC DEFAULT 0,
                    style TEXT,
                    cost NUMERIC,
                    delta NUMERIC,
                    profit NUMERIC,
                    daily_profit NUMERIC,
                    target_symbol_point NUMERIC,
                    target_symbol_pct NUMERIC
                )
            '''
        with self.get_connection() as conn:
            c = conn.cursor()
            c.execute(create_sql)
            conn.commit()


    def read_holdings(self, safemode: bool = True) -> List[Dict]:
        """读取当前持仓信息，并返回前端需要的字段格式
        safemode=True 时只返回部分字段，False 时返回全部字段
        """
        result = []
        with self.get_connection() as conn:
            if self.db_type == 'postgres':
                cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            else:
                cursor = conn.cursor()
            try:
                if safemode:
                    cursor.execute("SELECT id, symbol, name, type, current_price, preclose_price, account, portfolio, market_value_rate, risk_exposure_rate FROM holdings")
                else:
                    cursor.execute("SELECT * FROM holdings")
                rows = cursor.fetchall()
                if self.db_type == 'sqlite':
                    rows = [dict(row) for row in rows]
                for row in rows:
                    if safemode:
                        result.append({
                            'id': row.get('id'),
                            'symbol': row.get('symbol'),
                            'name': row.get('name'),
                            'type': row.get('type'),
                            'current_price': row.get('current_price') or 0,
                            'preclose_price': row.get('preclose_price') or 0,
                            'account': row.get('account'),
                            'portfolio': row.get('portfolio'),
                            'market_value_rate': row.get('market_value_rate') or 0,
                            'risk_exposure_rate': row.get('risk_exposure_rate') or 0,
                            'style': row.get('style'),
                        })
                    else:
                        result.append({
                            'id': row.get('id'),
                            'symbol': row.get('symbol'),
                            'name': row.get('name'),
                            'type': row.get('type'),
                            'current_price': row.get('current_price') or 0,
                            'preclose_price': row.get('preclose_price') or 0,
                            'account': row.get('account'),
                            'portfolio': row.get('portfolio'),
                            'quantity': row.get('quantity') or 0,
                            'avg_price': row.get('avg_price') or 0,
                            'exchange': row.get('exchange'),
                            'margin_ratio': row.get('margin_ratio') or 1,
                            'point_value': row.get('point_value') or 1,
                            'target_symbol': row.get('target_symbol'),
                            'createdAt': row.get('created_at'),
                            'updatedAt': row.get('updated_at'),
                            'market_value_rate': row.get('market_value_rate') or 0,
                            'risk_exposure_rate': row.get('risk_exposure_rate') or 0,
                            'market_value': row.get('market_value') or 0,
                            'risk_exposure': row.get('risk_exposure') or 0,
                            'style': row.get('style'),
                            'cost': row.get('cost') or 0,
                            'delta': row.get('delta') or 1,
                            'profit': row.get('profit') or 0,
                            'daily_profit': row.get('daily_profit') or 0,
                            'target_symbol_point': row.get('target_symbol_point') or 0,
                            'target_symbol_pct': row.get('target_symbol_pct') or 0,
                        })
                return result
            finally:
                cursor.close()

    def update_data(self, source: str = None) -> List[Dict]:
        """
        更新数据库持仓的所有相关字段。
        source: 'akshare' 表示使用 Akshare 实时数据，否则仅用数据库已有数据。
        返回: 更新后的持仓数据列表
        """
        try:
            if self.db_type == 'postgres' and not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
                raise ValueError("数据库连接信息不完整")
            holdings = self.read_holdings(safemode=False)
            if not holdings:
                print("[INFO] 当前无持仓，无需更新数据。")
                return []
            updated_data = []
            price_info = None
            if source == 'akshare':
                try:
                    price_info = ak.stock_zh_a_spot(indicator="实时行情")
                except Exception as e:
                    self.log_update_error(e)
                    price_info = None
            update_fields_list = []
            for row in holdings:
                symbol = row['symbol']
                update_fields = {}
                now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                # 实时价格
                if source == 'akshare' and price_info is not None:
                    try:
                        stock_row = price_info[price_info['代码'] == symbol]
                        if not stock_row.empty:
                            # 只是样例，实际获取方法要复杂得多
                            update_fields['current_price'] = float(stock_row.iloc[0]['最新价'])
                            update_fields['preclose_price'] = float(stock_row.iloc[0]['昨收'])
                            update_fields['delta'] = float(stock_row.iloc[0]['delta'])
                            update_fields['target_symbol_point'] = float(stock_row.iloc[0]['目标点'])
                            update_fields['target_symbol_pct'] = float(stock_row.iloc[0]['目标百分比'])
                    except Exception as e:
                        self.log_update_error(e)
                else:
                    update_fields['current_price'] = row['current_price']
                    update_fields['preclose_price'] = row['preclose_price']
                    update_fields['delta'] = float(row['delta'] or 1)
                    # 目标相关
                update_fields['target_symbol_point'] = float(row['target_symbol_point'] or 0)
                update_fields['target_symbol_pct'] = float(row['target_symbol_pct'] or 0)
                # 其它字段计算
                current_price = float(update_fields['current_price'] or 0)
                quantity = float(row['quantity'] or 0)
                avg_price = float(row['avg_price'] or 0)
                update_fields['point_value'] = float(row['point_value'] or 1)
                update_fields['margin_ratio'] = float(row['margin_ratio'] or 1)
                cost = avg_price * quantity * update_fields['point_value'] * update_fields['margin_ratio']
                update_fields['cost'] = cost
                update_fields['profit'] = (current_price - avg_price) * quantity * update_fields['point_value']
                update_fields['market_value'] = update_fields['profit'] + cost
                
                update_fields['daily_profit'] = (current_price - float(update_fields['preclose_price'] or 0)) * quantity * update_fields['point_value']
                # 风险敞口
                if row['type'] == 'option':
                    update_fields['risk_exposure'] = update_fields['target_symbol_point'] * quantity * update_fields['point_value'] * update_fields['delta']
                else:
                    update_fields['risk_exposure'] = current_price * quantity * update_fields['point_value'] * update_fields['delta']

                # 更新时间
                update_fields['updated_at'] = now
                update_fields_list.append(update_fields)
            # 计算总市值和风险敞口
            total_mv = sum(update_fields['market_value'] for update_fields in update_fields_list)
            total_risk = sum(update_fields['risk_exposure'] for update_fields in update_fields_list)
            # 计算市值和风险比率
            # 优化：只建立一次数据库连接和游标
            try:
                with self.get_connection() as conn:
                    if self.db_type == 'postgres':
                        cursor = conn.cursor()
                    else:
                        cursor = conn.cursor()

                    for i, update_fields in enumerate(update_fields_list):
                        update_fields['market_value_rate'] = update_fields['market_value'] / total_mv if total_mv != 0 else 0
                        update_fields['risk_exposure_rate'] = update_fields['risk_exposure'] / total_risk if total_risk != 0 else 0
                        # 组装 SQL
                        if self.db_type == 'postgres':
                            placeholder = '%s'
                        else:
                            placeholder = '?'
                        set_clause = ', '.join([f"{k} = {placeholder}" for k in update_fields.keys()])
                        sql = f"UPDATE holdings SET {set_clause} WHERE id = {placeholder}"
                        values = list(update_fields.values()) + [holdings[i]['id']]
                        try:
                            cursor.execute(sql, values)
                        except Exception as e:
                            self.log_update_error(e)
                        updated = dict(holdings[i])
                        updated.update(update_fields)
                        updated_data.append(updated)
                    conn.commit()
                return updated_data
            except Exception as e:
                self.log_update_error(e)
                raise
        except Exception as e:
            self.log_update_error(e)
            raise

    def log_update_error(self, error: Exception):
        """记录价格更新错误"""
        print(f"[ERROR] {datetime.datetime.now()}: {str(error)}")

    def close_connection(self):
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
            self.conn = None

if __name__ == "__main__":
    # 仅用于本文件调试或命令行运行时的示例
    # 尝试导入python-dotenv（如果安装了）
    try:
        from dotenv import load_dotenv
        load_dotenv()  # 加载.env文件中的环境变量
        print("已加载.env环境变量")
        NEON_HOST = os.environ.get('NEON_HOST', '')
        NEON_PORT = os.environ.get('NEON_PORT', '5432')
        NEON_DB = os.environ.get('NEON_DB', '')
        NEON_USER = os.environ.get('NEON_USER', '')
        NEON_PASSWORD = os.environ.get('NEON_PASSWORD', '')
    except ImportError:
        print("python-dotenv未安装，仅使用系统环境变量")
    portfolio_manager = PortfolioManager(db_type='postgres')
    portfolio_manager.init_db()
    portfolio_manager.update_data()