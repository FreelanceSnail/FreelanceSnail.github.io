import requests
import json

# 测试服务器地址
BASE_URL = 'http://localhost:5000'

def test_get_all_holdings():
    """测试获取所有持仓数据"""
    response = requests.post(f'{BASE_URL}/api/holdings')
    
    if response.status_code == 200:
        data = response.json()
        print(f"成功获取所有持仓数据，共 {len(data['results'])} 条记录")
        
        # 打印前3条记录示例
        for i, item in enumerate(data['results'][:3]):
            print(f"\n记录 {i+1}:")
            print(json.dumps(item, indent=2, ensure_ascii=False))
    else:
        print(f"请求失败: {response.status_code}")
        print(response.text)

def test_query_holdings():
    """测试条件查询持仓数据"""
    # 测试按账户和组合查询
    query_data = {
        "where": {
            "account": "国信证券",
            "portfolio": "动量轮动策略"
        }
    }
    
    response = requests.post(
        f'{BASE_URL}/api/holdings/query',
        json=query_data
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n按账户和组合查询结果，共 {len(data['results'])} 条记录")
        
        # 打印所有记录
        for i, item in enumerate(data['results']):
            print(f"\n记录 {i+1}:")
            print(json.dumps(item, indent=2, ensure_ascii=False))
    else:
        print(f"请求失败: {response.status_code}")
        print(response.text)
    
    # 测试按证券类型查询
    query_data = {
        "where": {
            "type": "etf"
        }
    }
    
    response = requests.post(
        f'{BASE_URL}/api/holdings/query',
        json=query_data
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n按证券类型查询结果，共 {len(data['results'])} 条记录")
        print(f"ETF类型的证券: {', '.join([item['name'] for item in data['results']])}")
    else:
        print(f"请求失败: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    print("开始测试API接口...\n")
    
    try:
        test_get_all_holdings()
        test_query_holdings()
        print("\n所有测试完成!")
    except requests.exceptions.ConnectionError:
        print("\n连接失败! 请确保服务器已启动，运行 'python app.py'")
    except Exception as e:
        print(f"\n测试过程中出错: {str(e)}") 