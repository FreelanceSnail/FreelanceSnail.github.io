# 将Flask API部署到云平台

本文档介绍如何将基于Neon PostgreSQL的Flask API部署到云平台，使其可以从任何地方访问，包括GitHub Pages。

## 一、准备工作

### 1. 注册云平台账号

选择一个适合部署Python应用的云平台:
- [Render](https://render.com/) - 提供免费层级，适合小型应用
- [Railway](https://railway.app/) - 简单易用，有免费额度
- [Heroku](https://www.heroku.com/) - 经典选择，免费层级功能受限
- [PythonAnywhere](https://www.pythonanywhere.com/) - 专为Python设计，有免费方案

本指南以Render为例。

### 2. 准备部署文件

创建以下文件:

#### requirements.txt
```
flask==2.3.3
flask-cors==4.0.0
psycopg2-binary==2.9.9
gunicorn==21.2.0
```

#### start.sh (用于Render)
```bash
#!/bin/bash
gunicorn app_neon:app
```

## 二、部署到Render

### 1. 创建Git仓库（可选）

将您的代码推送到GitHub或GitLab仓库，这样Render可以自动部署。

### 2. 创建Render Web服务

1. 登录Render控制台：https://dashboard.render.com/
2. 点击"New" > "Web Service"
3. 选择您的Git仓库，或使用"Upload Files"手动上传
4. 填写服务信息:
   - Name: 您的应用名称（如"holdings-api"）
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app_neon:app`
5. 添加环境变量
   - NEON_HOST: 您的Neon主机名
   - NEON_PORT: 5432
   - NEON_DB: 您的数据库名
   - NEON_USER: 您的用户名
   - NEON_PASSWORD: 您的密码
6. 点击"Create Web Service"

### 3. 测试部署

1. 部署完成后，Render会提供一个类似`https://your-app-name.onrender.com`的URL
2. 访问该URL，应该看到API的欢迎页面

## 三、更新前端代码

您需要更新前端代码中的API地址，指向您部署的云服务:

```javascript
// 将assets/js/dashboard.js中的
const API_BASE_URL = 'http://localhost:5000';

// 改为
const API_BASE_URL = 'https://your-app-name.onrender.com';
```

## 四、部署注意事项

### 1. 数据库连接

确保您的Neon数据库允许从公网访问。在Neon控制面板中:
1. 进入项目设置
2. 检查"Connection Settings"
3. 确保选择了"Allow connections from all IP addresses"

### 2. CORS配置

确保您的Flask应用已正确配置CORS，允许GitHub Pages域名访问:

```python
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
```

### 3. 免费层级限制

- Render免费服务在15分钟无活动后会休眠
- 首次访问可能需要等待几秒钟服务唤醒
- 每月免费使用时间有限制
- 如需正式产品使用，建议升级到付费方案

## 五、故障排除

### 1. 部署失败

检查Render提供的日志，常见问题:
- requirements.txt中缺少依赖
- start命令错误
- 环境变量未正确配置

### 2. 数据库连接错误

- 检查连接字符串和凭据
- 确认Neon防火墙设置允许连接
- 测试数据库连接是否有效

### 3. CORS错误

在浏览器控制台看到CORS错误时:
- 检查Flask应用的CORS配置
- 确保允许GitHub Pages的域名
- 确保API返回正确的CORS头部 