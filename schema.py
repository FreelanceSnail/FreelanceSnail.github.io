# schema.py
"""
本文件用于集中维护数据库表结构定义，支持 SQLite 和 Postgres 两种版本。
"""

HOLDINGS_CREATE_SQLITE = """
CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    name TEXT,
    type TEXT,
    current_price REAL,
    preclose_price REAL,
    account TEXT,
    portfolio TEXT,
    quantity REAL,
    avg_price REAL,
    exchange REAL,
    margin_ratio REAL,
    point_value REAL,
    target_symbol TEXT,
    created_at TEXT,
    updated_at TEXT,
    market_value_rate REAL DEFAULT 0,
    equalled_market_value_rate REAL DEFAULT 0,
    market_value REAL DEFAULT 0,
    equalled_market_value REAL DEFAULT 0,
    style TEXT,
    cost REAL,
    delta REAL,
    profit REAL,
    daily_profit REAL,
    target_symbol_point REAL,
    target_symbol_pct REAL
)
"""

HOLDINGS_CREATE_POSTGRES = """
CREATE TABLE IF NOT EXISTS holdings (
    id SERIAL PRIMARY KEY,
    symbol TEXT,
    name TEXT,
    type TEXT,
    current_price NUMERIC,
    preclose_price NUMERIC,
    account TEXT,
    portfolio TEXT,
    quantity NUMERIC,
    avg_price NUMERIC,
    exchange NUMERIC,
    margin_ratio NUMERIC,
    point_value NUMERIC,
    target_symbol TEXT,
    created_at TEXT,
    updated_at TEXT,
    market_value_rate NUMERIC DEFAULT 0,
    equalled_market_value_rate NUMERIC DEFAULT 0,
    market_value NUMERIC DEFAULT 0,
    equalled_market_value NUMERIC DEFAULT 0,
    style TEXT,
    cost NUMERIC,
    delta NUMERIC,
    profit NUMERIC,
    daily_profit NUMERIC,
    target_symbol_point NUMERIC,
    target_symbol_pct NUMERIC
)
"""
