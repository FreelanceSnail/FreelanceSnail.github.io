# Repository Guidelines

## Project Structure & Module Organization
- Pages live at the root (`index.md`, `about.md`, `blog.md`, `lab.md`); blog posts live in `_posts/` using Jekyll’s `YYYY-MM-DD-title.md` pattern (lowercase, hyphenated slugs).
- Layout templates are in `_layouts/` (`default.html`, `page.html`, `post.html`) using the Minima theme. Navigation and site meta live in `_config.yml`.
- Static assets (images, styles, downloadable files) go in `assets/`; reuse `favicon.ico` unless replacing intentionally. Custom domain is set via `CNAME`.

## Build, Test, and Development Commands
- `bundle install` — install Ruby/Jekyll dependencies.
- `bundle exec jekyll serve --livereload --drafts` — run the site locally, watching for changes (drafts included).
- `bundle exec jekyll build` — produce the static site in `_site/`; run this before pushing to ensure the build is clean.
- `bundle exec jekyll doctor` — optional sanity check for config/link issues.

## Coding Style & Naming Conventions
- Markdown uses Kramdown with GitHub Flavored Markdown; keep front matter minimal (`layout`, `title`, `date`, `categories`, `tags`, optional `excerpt`).
- Indent HTML/Liquid/YAML with 2 spaces; prefer 80–100 character soft wraps in prose. Keep Liquid logic simple; avoid heavy in-template computation.
- File naming: posts as `_posts/YYYY-MM-DD-slug.md`; pages use short, lowercase names (`about.md`). Asset names should be descriptive and hyphenated.
- Prefer concise headings and short paragraphs; bilingual content is fine—keep tone consistent across the page.

## Testing Guidelines
- No automated tests are present; rely on `bundle exec jekyll build` to catch syntax/config errors.
- Before opening a PR, verify local serve output briefly (especially nav links and recent posts) and ensure no console/build warnings.

## Commit & Pull Request Guidelines
- Commit messages: short, present-tense summaries; bilingual is acceptable. Examples: `fix blog pagination`, `调整导航文案`.
- PRs should include: what changed and why, screenshots for visible UI/content changes, and which commands were run (`jekyll build` or `serve`). Link related issues if they exist and note any follow-up tasks.

## Content & Assets Tips
- Place images under `assets/`, prefer compressed formats (e.g., `jpg`/`webp`), and add alt text in Markdown (`![alt](../assets/example.jpg)`).
- Keep navigation labels synchronized with `_config.yml`; update both the menu and target page when renaming sections.
- Avoid committing generated `_site/` output; only source files belong in the repo.
