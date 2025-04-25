import sqlite3
import csv
import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schema import HOLDINGS_CREATE_SQLITE

CSV_PATH = os.path.join(os.path.dirname(__file__), "holdings.csv")
DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")
TABLE_NAME = "holdings"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 自动建表（如果不存在）
    cur.execute(HOLDINGS_CREATE_SQLITE)

    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        # 检查表头和表结构是否一致
        cur.execute(f"PRAGMA table_info({TABLE_NAME})")
        db_columns = [row[1] for row in cur.fetchall()]
        if headers != db_columns:
            print("警告：CSV表头与数据库表结构不一致。")
            print("CSV表头:", headers)
            print("数据库字段:", db_columns)
            return

        rows = []
        for row in reader:
            # 空字符串转为 None
            row = [None if x == '' else x for x in row]
            rows.append(row)

        # 先清空表，防止主键冲突
        cur.execute(f"DELETE FROM {TABLE_NAME}")
        placeholders = ','.join(['?'] * len(headers))
        cur.executemany(
            f"INSERT INTO {TABLE_NAME} VALUES ({placeholders})", rows
        )
        conn.commit()
        print(f"成功导入 {len(rows)} 行数据到 {TABLE_NAME} 表。")

    conn.close()

if __name__ == "__main__":
    main()