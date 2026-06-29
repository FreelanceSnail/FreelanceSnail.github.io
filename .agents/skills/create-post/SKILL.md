---
name: create-post
description: Use when the user asks to create a new blog post, article, note, journal entry, or log on the FreelanceSnail Jekyll site.
---

# Create New Post

## Overview

Create a new Jekyll post by copying `_templates/post-template.md` into `_posts/YYYY-MM-DD-slug.md`, filling the current date and the user-provided topic, and leaving the rest as placeholders for the user to complete.

## When to Use

- User says "写一篇博客/文章/日志/笔记" or asks to create a new post.
- User mentions `_templates/post-template.md` or `_posts/`.
- Any request that results in a new Markdown file under `_posts/`.

## Steps

1. **Get the topic.** If the user did not provide a topic, ask for it once. Do not proceed without a topic.
2. **Generate an ASCII slug semantically.** Based on the topic's meaning, pick a short, readable, ASCII-only slug. Prefer English keywords from the topic; for Chinese concepts, use meaningful English equivalents rather than raw pinyin.
   - Good: `v2raya-geoip-geosite-dat-missing`
   - Bad: `v2raya-geng-xin-hou-diu-shi-geoipdat-he-geositedat-de-wen-ti-jie-jue`
   - Keep it lowercase and hyphenated.
3. **Run the helper script with `--slug`.** From the project root:
   ```bash
   python3 .agents/skills/create-post/create-post.py "文章主题" --slug your-ascii-slug
   ```
   - Use the exact topic the user gave (do not paraphrase unless asked).
   - The script will use your semantic slug; if you omit `--slug`, it falls back to automatic ASCII extraction.
4. **Report the created file path** and tell the user which placeholders still need to be filled (tags, summary, cover image, body).

## Filename Rules

- Date is always `YYYY-MM-DD` of the current day.
- Slug is **ASCII-only**, lowercase, hyphenated, and chosen semantically.
  - Prefer concise English keywords that reflect the topic.
  - Avoid long literal translations or raw pinyin.
- If you cannot produce a good semantic slug, ask the user for one or let the script fall back to auto-extraction.
- Final path: `_posts/YYYY-MM-DD-slug.md`.

## Placeholders Left for the User

After creation, the file already contains:

- `title`: filled with the user's topic.
- `date`: filled with today's date.
- `tags`: kept as `[投资, 自由职业, 哲学, 学习]` — user should replace.
- `summary`: kept as placeholder sentence — user should replace.
- `cover_image`: kept as `/assets/images/cover-your-image.svg` — user should replace or remove.
- Body sections (背景, 核心观点, 展开论述, 反思与下一步): kept as placeholders.

## Common Mistakes

- **Do not** create the file manually with `cp` and `sed`; always use the script so slug/date handling is consistent.
- **Do not** overwrite an existing file. The script refuses if the filename already exists; if this happens, ask the user for a different slug or date.
- **Do not** produce filenames with Chinese characters. The slug must be ASCII-only.
- If the auto-generated slug is empty or unsuitable (usually a pure-Chinese topic without `pypinyin`), ask the user for a `--slug` instead of guessing.
