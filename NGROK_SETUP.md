# 使用ngrok连接GitHub Pages与本地Flask服务

本文档介绍如何使用ngrok内网穿透工具，将本地Flask服务器暴露到公网，以便GitHub Pages网站可以访问您的本地数据。

## 一、准备工作

### 1. 安装ngrok

1. 访问 [ngrok官网下载页面](https://ngrok.com/download) 下载对应您操作系统的版本
2. 解压下载的文件
3. 注册一个免费的ngrok账号: https://dashboard.ngrok.com/signup
4. 在ngrok控制面板获取您的authtoken
5. 配置authtoken（首次使用时需要）:
   ```
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
6. 将ngrok可执行文件所在目录添加到系统PATH环境变量（或移动到已在PATH中的目录）

### 2. 准备已有的脚本

本项目已准备了以下批处理脚本来帮助您使用ngrok：
- `start_services.bat` - 启动Flask和Jekyll服务
- `start_ngrok.bat` - 启动ngrok连接本地Flask服务
- `update_api_url.bat` - 更新前端代码中的API URL

## 二、使用步骤

### 1. 启动本地服务

首先启动本地Flask和Jekyll服务：
```
start_services.bat
```

### 2. 启动ngrok内网穿透

打开新的命令行窗口，运行：
```
start_ngrok.bat
```

当ngrok启动后，您会看到类似下面的信息：
```
Forwarding https://a1b2c3d4.ngrok.io -> http://localhost:5000
```

记下`https://a1b2c3d4.ngrok.io`这个URL，这是您的Flask服务器在公网上的地址。

### 3. 更新前端代码中的API URL

运行以下脚本，并在提示时输入ngrok提供的URL：
```
update_api_url.bat
```

### 4. 测试GitHub Pages访问

现在，您可以访问GitHub Pages上部署的网站。网站的JavaScript代码将通过ngrok提供的URL访问您本地的Flask API。

## 三、注意事项

1. **时效性**：免费版ngrok会话有8小时的时间限制，之后URL会失效
2. **URL变化**：每次启动ngrok，URL都会改变，需要重新运行`update_api_url.bat`
3. **安全性**：ngrok连接是公开的，任何人都可以访问您的API
4. **性能**：通过ngrok访问可能会有一定的延迟
5. **GitHub Pages限制**：如果使用HTTPS的GitHub Pages，API也必须是HTTPS

## 四、高级选项

### 升级到ngrok付费版

付费版提供固定域名、更长的会话时间、密码保护等功能。详情请访问：https://ngrok.com/pricing

### 自定义ngrok配置

您可以创建`ngrok.yml`配置文件，设置更多选项：
```yaml
authtoken: YOUR_AUTH_TOKEN
tunnels:
  flask:
    proto: http
    addr: 5000
    subdomain: yourpreferred  # 付费版可用
    auth: "username:password" # 付费版可用
```

然后使用以下命令启动：
```
ngrok start --config=ngrok.yml flask
``` 