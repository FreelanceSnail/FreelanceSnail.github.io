---
layout: page
title: 量化指标实验室
lead: 预留给模型表现、回测曲线、监控报表，方便定期刷新。
permalink: /lab/
---

这里将逐步上线不同的指标看板：

- **Alpha 曲线**：记录策略每日/每周的超额收益。
- **回撤监控**：展示关键策略的风控指标。
- **自动刷新**：将数据生成 Markdown 或 HTML 片段，直接放入对应子页面即可。
- **动量轮动**：21/22/23/24 日涨幅对比表，自动高亮领先标的，见 [/lab/momentum-rotation/](/lab/momentum-rotation/)。

> 增加新的指标页面：在 `lab/` 目录下新建 Markdown 文件，使用 `layout: page`，写入图表或表格，保存后即可通过导航或直接 URL 访问。
