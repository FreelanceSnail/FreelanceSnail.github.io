# 更新净值导出脚本至 sc-navmgr 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `scripts/export-nav-json.sh` 从 `sc-pfmgr` 迁移到 `sc-navmgr` v0.3.0，并重新生成 `lab/nav-data.json` 后提交。

**Architecture：** 保留现有脚本结构，仅将导出命令替换为 `sc-navmgr nav export-json --identity user --output <path>`，利用工具内置的 base token 读取飞书「净值记录」表。

**Tech Stack：** Bash, sc-navmgr 0.3.0, uv, Jekyll

---

### Task 1: 修改导出脚本

**Files:**
- Modify: `scripts/export-nav-json.sh`

- [ ] **Step 1: 更新导出命令**

  将文件内容从：
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail

  OUTPUT="$HOME/FreelanceSnail.github.io/lab/nav-data.json"

  echo "Exporting NAV data to $OUTPUT ..."
  sc-pfmgr nav-chart export-json --output "$OUTPUT"
  echo "Done."
  ```

  替换为：
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail

  OUTPUT="$HOME/FreelanceSnail.github.io/lab/nav-data.json"

  echo "Exporting NAV data to $OUTPUT ..."
  sc-navmgr nav export-json --identity user --output "$OUTPUT"
  echo "Done."
  ```

- [ ] **Step 2: 验证脚本语法**

  Run: `bash -n scripts/export-nav-json.sh`
  Expected: 无输出（语法检查通过）

- [ ] **Step 3: Commit 脚本变更**

  ```bash
  git add scripts/export-nav-json.sh
  git commit -m "chore: switch NAV export from sc-pfmgr to sc-navmgr"
  ```

---

### Task 2: 运行脚本生成新数据

**Files:**
- Modify: `lab/nav-data.json`

- [ ] **Step 1: 执行导出脚本**

  Run: `bash scripts/export-nav-json.sh`
  Expected: 输出 `Exported 333 rows to .../lab/nav-data.json`

- [ ] **Step 2: 验证 JSON 格式**

  Run: `python3 -m json.tool lab/nav-data.json > /dev/null`
  Expected: 无输出（格式有效）

- [ ] **Step 3: Commit 数据更新**

  ```bash
  git add lab/nav-data.json
  git commit -m "data: refresh NAV chart data via sc-navmgr"
  ```

---

### Task 3: 站点构建验证

**Files:**
- 无文件修改，仅验证

- [ ] **Step 1: 执行 Jekyll 构建**

  Run: `bundle exec jekyll build`
  Expected: 构建成功，无错误；`_site/` 目录生成

- [ ] **Step 2: 确认提交状态**

  Run: `git status --short`
  Expected: 无未跟踪/未提交变更（或仅有设计文档/计划文档）

---

## Spec 覆盖检查

| 设计说明要求 | 对应任务 |
|---|---|
| 安装 sc-navmgr v0.3.0 | 已在前期完成 |
| 修改 `scripts/export-nav-json.sh` | Task 1 |
| 重新生成 `lab/nav-data.json` | Task 2 |
| `bundle exec jekyll build` 验证 | Task 3 |
| git 提交 | Task 1 / Task 2 |
