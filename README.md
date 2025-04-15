# 本地持仓数据服务器

这是一个基于Flask的本地数据服务器，用于替代leanCloud服务，解决CORS问题。

## 安装依赖

```bash
pip install flask flask-cors
```

## 使用方法

1. 将您的持仓CSV文件放在项目根目录中，命名为`holdings_20250415_094150.csv`
2. 运行服务器：

```bash
python app.py
```

3. 服务器将在`http://localhost:5000`启动

## API接口

### 获取所有持仓数据

```
POST /api/holdings
```

返回所有持仓数据。

示例响应：
```json
{
  "results": [
    {
      "objectId": 1,
      "symbol": "sh518880",
      "name": "黄金ETF",
      "type": "etf",
      "current_price": 7.327,
      "preclose_price": 7.273,
      "account": "国信证券",
      "portfolio": "动量轮动策略",
      "quantity": 73700,
      "avg_price": 6.7788,
      "exchange": 1,
      "margin_ratio": null,
      "point_value": null,
      "target_symbol": null,
      "createdAt": "2024-04-15 10:00:00",
      "updatedAt": "2024-04-15 10:00:00"
    },
    // ...更多记录
  ]
}
```

### 条件查询持仓数据

```
POST /api/holdings/query
```

请求体示例：
```json
{
  "where": {
    "account": "国信证券",
    "portfolio": "动量轮动策略"
  }
}
```

返回符合条件的持仓数据。

## 替换leanCloud的数据调用

在您的前端代码中，将原来调用leanCloud的代码替换为调用本地服务器：

原leanCloud代码：
```javascript
// 使用leanCloud SDK的查询
const query = new AV.Query('Holdings');
query.equalTo('portfolio', '动量轮动策略');
const results = await query.find();
```

替换为：
```javascript
// 使用fetch调用本地服务器
const response = await fetch('http://localhost:5000/api/holdings/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    where: {
      portfolio: '动量轮动策略'
    }
  })
});
const data = await response.json();
const results = data.results;
``` 