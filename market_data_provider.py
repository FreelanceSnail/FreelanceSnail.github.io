import string
import akshare as ak
import tushare as ts
from typing import List, Dict
import datetime

class MarketDataProvider:
    def __init__(self, query_type='tushare', tushare_token=None):
        """
        初始化行情数据提供者
        :param tushare_token: tushare的API token（可选）
        """
        if query_type == 'tushare' and tushare_token:
            ts.set_token(tushare_token)
            self.tushare_pro = ts.pro_api()
        elif query_type != 'akshare':
            raise ValueError("无效的查询类型或缺少tushare token")

    def get_latest_prices_with_akshare(self, holdings: List[Dict]) -> List[Dict]:
        """
        使用akshare获取持仓的最新价和前收价
        :param holdings: 持仓列表
        :return: 更新后的持仓列表
        """
        # TODO: 实现使用akshare更新价格的逻辑
        return holdings

    def get_latest_prices_with_tushare(self, holdings: List[Dict]) -> List[Dict]:
        """
        使用tushare获取持仓的最新价和前收价
        :param holdings: 持仓列表
        :return: 更新后的持仓列表
        """
        if not hasattr(self, 'tushare_pro'):
            print("[WARNING] 未配置tushare token，无法使用tushare接口")
            return holdings
            
        try:
            # 初始化一个字典，用于保存 symbol 的行情数据
            self.symbol_market_data = {}
            for holding in holdings:
                symbol = holding['symbol']
                # 检查 symbol_market_data 中是否已有该 symbol 的数据
                if symbol in self.symbol_market_data:
                    market_data = self.symbol_market_data[symbol]
                    holding['current_price'] = market_data['current_price']
                    holding['preclose_price'] = market_data['preclose_price']
                    holding['updated_at'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                else:
                    # 获取股票实时行情
                    market_data = self._get_symbol_data_from_tushare(symbol, 'stock')
                    
                    if market_data['current'] is not None:
                        holding['current_price'] = market_data['current']
                        holding['preclose_price'] = market_data['pre_close']
                        holding['updated_at'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                        symbol_market_data[symbol] = {
                            'current_price': float(df.iloc[0]['close']),
                            'preclose_price': float(df.iloc[0]['pre_close'])
                        }
            return holdings
        except Exception as e:
            print(f"[ERROR] 使用tushare更新价格失败: {str(e)}")
            return holdings

    def _get_symbol_data_from_tushare(self, symbol: str, type: str):
        """
        根据 symbol 和 type 查询 tushare，返回当前价和前收盘价。
        type: 'stock' | 'fund' | 'future'
        返回: {'current': float, 'pre_close': float}
        """
        import tushare as ts
        import datetime

        ts_pro = getattr(self, 'ts_pro', None)
        if ts_pro is None:
            ts_pro = ts.pro_api()

        today = datetime.datetime.now().strftime('%Y%m%d')
        result = {'current': None, 'pre_close': None}

        if type == 'stock':
            # 股票用 daily
            df = ts_pro.daily(ts_code=symbol, start_date=today, end_date=today)
            if not df.empty:
                row = df.iloc[0]
                result['current'] = row['close']
                result['pre_close'] = row['pre_close']
        elif type == 'fund':
            # 基金用 fund_nav
            df = ts_pro.fund_nav(ts_code=symbol, nav_date=today)
            if not df.empty:
                row = df.iloc[0]
                result['current'] = row.get('nav', None)
                result['pre_close'] = row.get('adj_nav', None)
        elif type == 'future':
            # 期货用 fut_daily
            df = ts_pro.fut_daily(ts_code=symbol, trade_date=today)
            if not df.empty:
                row = df.iloc[0]
                result['current'] = row['close']
                result['pre_close'] = row['pre_close']
        else:
            raise ValueError(f"Unsupported type: {type}")

        return result

    def get_latest_target_symbols_prices_with_tushare(self, target_symbols: List[Dict]) -> List[Dict]:
        """
        使用tushare获取跟踪标的点位和涨跌幅
        :param target_symbols: 跟踪标的列表
        :return: 更新后的跟踪标的列表
        """
        for item in target_symbols:
            symbol = item.get('symbol')
            type_ = item.get('type')
            market_data = self._get_symbol_data_from_tushare(symbol, type_)
            current = market_data.get('current')
            pre_close = market_data.get('pre_close')
            item['current_price'] = current
            if pre_close not in (None, 0):
                try:
                    item['percentage_change'] = round((current - pre_close) / pre_close * 100, 4)
                except Exception:
                    item['percentage_change'] = None
            else:
                item['percentage_change'] = None
        return target_symbols
        