#!/usr/bin/env python3
"""Create a new Jekyll post from the project template."""

import argparse
import datetime
import os
import re
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TEMPLATE_PATH = os.path.join(PROJECT_ROOT, "_templates", "post-template.md")
POSTS_DIR = os.path.join(PROJECT_ROOT, "_posts")


def slugify(text: str) -> str:
    """Convert a topic into an ASCII URL-friendly slug.

    If pypinyin is installed, Chinese characters are transliterated to pinyin.
    Otherwise, ASCII alphanumeric tokens are extracted from the topic. If no
    usable ASCII tokens exist, returns an empty string so the caller can ask
    for an explicit slug.
    """
    text = text.strip()

    try:
        from pypinyin import lazy_pinyin

        tokens = lazy_pinyin(text)
        text = " ".join(tokens)
    except Exception:
        # Fall back to extracting ASCII tokens.
        tokens = re.findall(r"[a-zA-Z0-9.]+", text)
        if not tokens:
            return ""
        text = " ".join(tokens)

    text = text.lower()
    text = re.sub(r"\.", "-", text)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def today() -> str:
    return datetime.date.today().isoformat()


def read_template() -> str:
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()


def strip_instruction_comment(text: str) -> str:
    """Remove the top HTML comment block that explains how to use the template."""
    if text.lstrip().startswith("<!--"):
        end = text.find("-->")
        if end != -1:
            text = text[end + 3 :]
    return text.lstrip("\n")


def fill_front_matter(text: str, title: str, date: str) -> str:
    """Fill title and date; leave other placeholders untouched."""
    text = re.sub(r'^title:\s*"[^"]*"', f'title: "{title}"', text, flags=re.MULTILINE)
    text = re.sub(r"^date:\s*\d{4}-\d{2}-\d{2}", f"date: {date}", text, flags=re.MULTILINE)
    return text


def build_filename(date: str, slug: str) -> str:
    return f"{date}-{slug}.md"


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a new Jekyll post.")
    parser.add_argument("topic", nargs="?", help="Post topic/title.")
    parser.add_argument(
        "--slug",
        help="Override the auto-generated filename slug.",
    )
    parser.add_argument(
        "--date",
        help="Override the date (YYYY-MM-DD). Defaults to today.",
    )
    parser.add_argument(
        "--open",
        action="store_true",
        help="Print the created file path for easy opening.",
    )
    args = parser.parse_args()

    topic = args.topic
    if not topic:
        topic = input("文章主题：").strip()
    if not topic:
        print("错误：必须提供文章主题。", file=sys.stderr)
        return 1

    date = args.date or today()
    slug = args.slug or slugify(topic)
    if not slug:
        print("错误：无法从主题生成有效的文件名 slug。", file=sys.stderr)
        return 1

    filename = build_filename(date, slug)
    output_path = os.path.join(POSTS_DIR, filename)

    if os.path.exists(output_path):
        print(f"错误：文件已存在 {output_path}", file=sys.stderr)
        return 1

    template = read_template()
    template = strip_instruction_comment(template)
    content = fill_front_matter(template, topic, date)

    os.makedirs(POSTS_DIR, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"已创建：{output_path}")
    if args.open:
        print(output_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
