---
layout: post
title: "v2raya更新后丢失geoip.dat和geosite.dat的问题解决"
date: 2026-06-29
tags: [杂项]
summary: "今天在Mac mini通过brew更新了v2raya到2.4.4版本，结果提示geoip.dat和geosite.dat丢失，折腾了半天终于解决了，记录一下。"
cover_image: /assets/images/cover-your-image.svg
---

<!--more-->

## 问题现象

我在我的Mac mini上升级v2raya到2.4.4版本后，打开 Web 管理页面 `http://127.0.0.1:2017`，页面提示 :

> Downloading missing geoip.dat and geosite.dat; refresh the page later.

刷新后进入管理页面，但服务无法正常使用，提示找不到`geoip.dat`和`geosite.dat`。

## 原因分析

新版本的v2raya的`geoip.dat` 和`geosite.dat`路径有改动，导致需要去github上自动下载最新的这两个文件。但可能由于v2ray服务无法启动，下载不成功，最终结果为下载后文件会被错误地创建为**循环自引用的符号链接**

## 解决方法

1. **暂停服务**：`brew services stop v2raya/v2raya/v2raya`

2. **清理损坏链接**：

   ```bash
   rm -f ~/Library/Application\ Support/v2raya/geoip.dat ~/Library/Application\ Support/v2raya/geosite.dat ~/Library/Application\ Support/v2raya/LoyalsoldierSite.dat`
   ```

3. **下载真实数据文件**：

   ```bash
   curl -L -o ~/Library/Application\ Support/v2raya/geoip.dat https://github.com/v2fly/geoip/releases/latest/download/geoip.dat
   curl -L -o ~/Library/Application\ Support/v2raya/geosite.dat https://github.com/v2fly/domain-list-community/releases/latest/download/dlc.dat
   ```

如果由于v2ray服务无法启动导致无法正常下载，需要通过另外一台可以正常访问github的电脑来下载再拷贝到这台电脑的对应位置。

4. **修改 plist**：在 v2raya 的 plist 中 `<dict>` 内添加环境变量：

   ```xml
   <key>EnvironmentVariables</key>
   <dict>
    <key>XRAY_LOCATION_ASSET</key>
    <string>/Users/[你的用户名]/Library/Application Support/v2raya</string>
   </dict>
   ```

5. **重启服务**：`brew services restart v2raya/v2raya/v2raya`，刷新页面即可正常进入。

---

_本文首发于 [蜗牛咖啡馆](/)。_
