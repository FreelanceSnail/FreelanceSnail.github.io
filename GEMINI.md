# Project Overview
**FreelanceSnail.github.io** is a personal blog titled "蜗牛自由生活馆" (Snail's Freedom Living Hall). The project is a static website built with **Jekyll** and hosted on **GitHub Pages**. It focuses on topics such as long-term investment, freelance life, and philosophical reflections.

The project utilizes a hybrid approach:
- **Frontend:** Standard Jekyll structure (Liquid, Markdown, SCSS).
- **Backend/Data:** Python scripts in `lab/tools/` to fetch financial data (e.g., via `akshare`) and generate JSON files in `_data/` for data-driven pages.

# Building and Running

## Prerequisites
- **Ruby** (with Bundler) for the Jekyll site.
- **Python 3** for the data generation tools.

## Website (Jekyll)

1.  **Install Dependencies:**
    ```bash
    bundle install
    ```

2.  **Run Development Server:**
    ```bash
    bundle exec jekyll serve
    ```
    Access the site at `http://localhost:4000`.

## Data Tools (Python)

To update the data for the "Momentum Rotation" lab page:

1.  **Install Python Dependencies:**
    ```bash
    pip install akshare pandas
    ```

2.  **Run the Update Script:**
    ```bash
    python lab/tools/momentum_rotation.py
    ```
    This script fetches ETF data and updates `_data/momentum_rotation.json`.

# Development Conventions

## Directory Structure
- **`_posts/`**: Blog posts named `YYYY-MM-DD-title.md`.
- **`_layouts/`**: HTML templates (`default.html`, `post.html`, etc.).
- **`assets/`**: Static files like CSS and images.
- **`lab/`**: Experimental pages or features (e.g., `momentum-rotation.md`).
- **`_data/`**: JSON/YAML data files used by Liquid templates.

## Content Guidelines
- **Language:** Primary content is in **Simplified Chinese (zh-CN)**.
- **Front Matter:** All pages and posts use standard Jekyll front matter (YAML).
- **Lab Features:** When adding new data-driven features, place the visualization/page in `lab/` and the corresponding generation script in `lab/tools/`.

## Key Files
- `_config.yml`: Main Jekyll configuration.
- `Gemfile`: Ruby dependencies.
- `lab/tools/momentum_rotation.py`: Script for fetching financial momentum data.
- `AGENTS.md`: Agent-specific context or instructions.
