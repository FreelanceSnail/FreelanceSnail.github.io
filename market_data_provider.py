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

    def update_prices_with_akshare(self, holdings: List[Dict]) -> List[Dict]:
        """
        使用akshare更新持仓的最新价和前收价
        :param holdings: 持仓列表
        :return: 更新后的持仓列表
        """
        # TODO: 实现使用akshare更新价格的逻辑
        return holdings

    def update_prices_with_tushare(self, holdings: List[Dict]) -> List[Dict]:
        """
        使用tushare更新持仓的最新价和前收价
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
                    df = ts.pro_bar(ts_code=f"{symbol}.SH" if symbol.startswith('6') else f"{symbol}.SZ", 
                                    asset='E', freq='D')
                    
                    if not df.empty:
                        holding['current_price'] = float(df.iloc[0]['close'])
                        holding['preclose_price'] = float(df.iloc[0]['pre_close'])
                        holding['updated_at'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                        symbol_market_data[symbol] = {
                            'current_price': float(df.iloc[0]['close']),
                            'preclose_price': float(df.iloc[0]['pre_close'])
                        }

                # 更新跟踪标的点位和涨跌幅（如果适用）
                if 'target_symbol' in holding:
                    self.update_target_data(holding)
            
            return holdings
        except Exception as e:
            print(f"[ERROR] 使用tushare更新价格失败: {str(e)}")
            return holdings

    def update_target_data(self, holding: Dict):
        """
        更新跟踪标的的点位和涨跌幅
        :param holding: 单个持仓项
        """
        target_symbol = holding['target_symbol']
        try:
            # 获取标的指数数据（示例：沪深300）
            if target_symbol == '000300.SH':  # 沪深300
                index_data = ak.stock_zh_index_spot()
                target_info = index_data[index_data['代码'] == '000300']
                
                if not target_info.empty:
                    holding['target_symbol_point'] = float(target_info.iloc[0]['最新价'])
                    holding['target_symbol_pct'] = float(target_info.iloc[0]['涨跌幅'])
            
            # 可以添加其他标的指数的处理逻辑
            
        except Exception as e:
            print(f"[ERROR] 更新跟踪标的数据失败: {str(e)}")