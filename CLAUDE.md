# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog "蜗牛咖啡馆" (Snail Café) built with **Jekyll** and hosted on **GitHub Pages**. Content is in Chinese. The site has two distinct content areas:

- **Blog**: Markdown posts in `_posts/`, rendered via Jekyll Liquid templates.
- **量化实验室 (Quant Lab)**: Data-driven dashboard pages under `lab/` and `dashboard/`, where visualizations are rendered client-side by fetching JSON data.

## Architecture

### Jekyll Layout Pipeline
- `_layouts/default.html` — base layout with sticky header navigation. Reads `site.navigation` from `_config.yml` and supports dropdown menus via `item.children`.
- `_layouts/page.html` — wraps standalone pages (about, dashboard).
- `_layouts/post.html` — wraps blog posts.
- Global styles: `assets/css/style.css` (single file, no build step).

### Quant Lab Pages (Client-Side Rendering)
Unlike blog posts, lab pages do **not** rely on Jekyll `site.data`. They are plain Markdown files that embed HTML/JS to fetch JSON at runtime:

- `lab/momentum-rotation.md` → fetches `/lab/momentum-data.json`, renders a momentum comparison table in vanilla JS.
- `lab/nav-chart.md` → fetches `/lab/nav-data.json`, renders an ECharts line chart.

**Data flow:**
```
lab/tools/momentum_rotation.py  ──►  lab/momentum-data.json  ──►  browser fetch
```

The Python script uses `akshare` to pull ETF data. It tries Sina API first, falls back to Eastmoney. The generated JSON is committed to the repo so GitHub Pages can serve it statically.

### Navigation
Configured in `_config.yml` under `navigation`. Dropdown menus are defined via `children` arrays. The `default.html` template renders `.nav__dropdown` containers with CSS hover states. Keep navigation labels synchronized with page titles.

## Common Commands

```bash
# Install Jekyll dependencies
bundle install

# Local development server with live reload and drafts
bundle exec jekyll serve --livereload --drafts

# Build static site (run before pushing to verify)
bundle exec jekyll build

# Refresh quant lab data
python lab/tools/momentum_rotation.py
# Requires: pip install -U akshare pandas
```

## File Conventions

- **Posts**: `_posts/YYYY-MM-DD-slug.md` with front matter `layout: post`, `title`, `date`, `tags`.
- **Pages**: Root-level `.md` files (e.g., `about.md`, `dashboard.md`) with `layout: page` and optional `permalink`.
- **Lab pages**: Under `lab/`, use `layout: page`, embed their own JS/CSS. Extract styles to `lab/*.css` and data to `lab/*.json` rather than inlining everything.
- **Styles**: Global CSS only — `assets/css/style.css`. Lab-specific styles go in `lab/*.css`.
- **Images**: `assets/images/`, use compressed formats, always include alt text.

## Things to Know

- `_site/` and `vendor/` are in `.gitignore` — do not commit build artifacts.
- `_config.yml` `permalink: /:year/:month/:day/:title/` sets the URL pattern for posts.
- The site uses Kramdown with GFM input.
- No automated tests exist; rely on `bundle exec jekyll build` to catch Liquid/Markdown syntax errors.
- When adding a new lab metric page: create the `.md` under `lab/` or `dashboard/`, add it to `_config.yml` navigation (under `量化实验室` children if appropriate), and wire up its data source in `lab/tools/` if it needs live data.
