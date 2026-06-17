# 更新净值导出脚本至 sc-navmgr 设计说明

**日期：** 2026-06-17  
**主题：** 将 `scripts/export-nav-json.sh` 从 `sc-pfmgr` 迁移到 `sc-navmgr`  
**状态：** 已批准，待实施

---

## 背景

`scripts/export-nav-json.sh` 目前调用已废弃的 `sc-pfmgr nav-chart export-json` 导出 `lab/nav-data.json`，供 GitHub Pages 的净值曲线页面 (`lab/nav-chart.md`) 使用。新的净值管理工具 `sc-navmgr` 已在 `/home/lvxj/workspace/snail-cafe/products/sc-navmgr` 中发布，v0.3.0 新增了 `sc-navmgr nav export-json` 命令，可读取飞书多维表格「净值记录」表并输出图表所需 JSON。

## 目标

1. 在本机安装 `sc-navmgr` v0.3.0。
2. 使用新工具导出净值 JSON，并与现有 `lab/nav-data.json` 对比验证一致性。
3. 更新 `scripts/export-nav-json.sh`，使其调用 `sc-navmgr nav export-json`。
4. 重新生成 `lab/nav-data.json` 并提交到仓库。

## 方案

### 脚本变更

将 `scripts/export-nav-json.sh` 中的导出命令：

```bash
sc-pfmgr nav-chart export-json --output "$OUTPUT"
```

替换为：

```bash
sc-navmgr nav export-json --identity user --output "$OUTPUT"
```

说明：
- 当前 `sc-navmgr` 默认使用 `bot` 身份，但 bot 缺少 `base:table:read` scope，因此显式使用 `--identity user`。
- 工具内置了默认 base token，脚本无需额外配置环境变量。

### 数据验证

已验证 `sc-navmgr` v0.3.0 导出的 JSON：
- 字段与旧 JSON 完全一致：`date`、`净值`、`上证指数`、`沪深300`、`中证500`、`标普500`、`纳斯达克100`。
- 新数据共 333 行（截至 2026-06-12），旧数据 331 行（截至 2026-05-30）。
- 重叠的 331 行中，仅 2026-05-30 的「上证指数」存在 `4068.5691` 与 `4068.569` 的 0.0001 四舍五入差异，其余数据完全一致。
- 结论：数据一致，可直接替换。

### 实施步骤

1. 安装 `sc-navmgr` v0.3.0：
   ```bash
   cd /home/lvxj/workspace/snail-cafe/products/sc-navmgr
   uv tool install sc_navmgr-0.3.0-py3-none-any.whl
   ```
2. 修改 `scripts/export-nav-json.sh`。
3. 运行脚本生成新的 `lab/nav-data.json`。
4. 执行 `bundle exec jekyll build` 验证站点构建无异常。
5. `git add` 并 `git commit` 修改后的脚本与数据文件。

## 风险与回滚

- 风险：若未来 lark-cli user 身份权限变更，导出可能失败。缓解：可在脚本中保留 `--identity user` 或通过环境变量覆盖。
- 回滚：如需恢复旧脚本，可从 git 历史回退到使用 `sc-pfmgr` 的版本。
