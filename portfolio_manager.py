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
                ''')

    def read_holdings(self, safemode: bool = True) -> List[Dict]:
        """读取当前持仓信息，并返回前端需要的字段格式
        safemode=True 时只返回部分字段，False 时返回全部字段
        """
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
                    if safemode:
                        result.append({
                            'objectId': row.get('id'),
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
                            'objectId': row.get('id'),
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

    def update_data(self, source: str = None) -> List[Dict]:
        """
        更新数据库持仓的所有相关字段。
        source: 'akshare' 表示使用 Akshare 实时数据，否则仅用数据库已有数据。
        返回: 更新后的持仓数据列表
        """
        try:
            if not all([NEON_HOST, NEON_DB, NEON_USER, NEON_PASSWORD]):
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
                point_value = float(row['point_value'] or 1)
                margin_ratio = float(row['margin_ratio'] or 1)
                cost = avg_price * quantity * point_value * margin_ratio
                update_fields['cost'] = cost
                update_fields['profit'] = (current_price - avg_price) * quantity * point_value * margin_ratio
                update_fields['market_value'] = update_fields['profit'] + cost
                
                update_fields['daily_profit'] = (current_price - (update_fields['preclose_price'] or 0)) * quantity * point_value
                # 风险敞口
                if row['type'] == 'option':
                    update_fields['risk_exposure'] = update_fields['target_symbol_point'] * quantity * point_value * update_fields['delta']
                else:
                    update_fields['risk_exposure'] = current_price * quantity * point_value * update_fields['delta']

                # 更新时间
                update_fields['updated_at'] = now
                update_fields_list.append(update_fields)
            # 计算总市值和风险敞口
            total_mv = sum(update_fields['market_value'] for update_fields in update_fields_list)
            total_risk = sum(update_fields['risk_exposure'] for update_fields in update_fields_list)
            # 计算市值和风险比率
            # 优化：只建立一次数据库连接和游标
            try:
                with psycopg2.connect(
                    host=NEON_HOST,
                    port=NEON_PORT,
                    dbname=NEON_DB,
                    user=NEON_USER,
                    password=NEON_PASSWORD,
                    sslmode='require'
                ) as conn:
                    with conn.cursor() as cursor:
                        for i, update_fields in enumerate(update_fields_list):
                            update_fields['market_value_rate'] = update_fields['market_value'] / total_mv if total_mv != 0 else 0
                            update_fields['risk_exposure_rate'] = update_fields['risk_exposure'] / total_risk if total_risk != 0 else 0
                            # 组装 SQL
                            set_clause = ', '.join([f"{k} = %s" for k in update_fields.keys()])
                            sql = f"UPDATE holdings SET {set_clause} WHERE id = %s"
                            values = list(update_fields.values()) + [holdings[i]['id']]
                            try:
                                cursor.execute(sql, values)
                            except Exception as e:
                                self.log_update_error(e)
                            updated = dict(holdings[i])
                            updated.update(update_fields)
                            updated_data.append(updated)
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
        if self.conn:
            self.conn.close()

if __name__ == "__main__":
    # 仅用于本文件调试或命令行运行时的示例
    portfolio_manager = PortfolioManager()
    portfolio_manager.init_db()
    portfolio_manager.update_prices()
    portfolio_manager.close_connection()
