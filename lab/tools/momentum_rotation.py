#!/usr/bin/env python3
"""
Fetch N-day momentum data for a few ETFs via Akshare and write it to
`_data/momentum_rotation.json` for the Jekyll lab page.

Usage:
  python lab/tools/momentum_rotation.py

Dependencies:
  pip install -U akshare pandas
"""
from __future__ import annotations

import json
import re
import time
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import akshare as ak
import pandas as pd
import requests


TARGETS = {
    "511090": "30年国债ETF",
    "518880": "黄金ETF",
    "159915": "创业板ETF",
    "563080": "中证A50ETF",
}

# Trading-day lookback windows.
PERIODS = [21, 22, 23, 24]


def _to_sina_symbol(code: str) -> str:
    """Map numeric ETF code to Sina exchange-prefixed symbol."""
    # Shanghai: 5xxxxx / 6xxxxx; Shenzhen: 0xxxxx / 1xxxxx / 3xxxxx
    prefix = "sh" if code[0] in ("5", "6") else "sz"
    return f"{prefix}{code}"


def fetch_realtime_quotes(codes: list[str]) -> dict[str, dict]:
    """Fetch real-time quotes from Sina hq.sinajs.cn.

    Returns: { "sh511090": {"current_price": 117.087, "date": "2026-06-01",
              "time": "15:00:01", "datetime": "2026-06-01 15:00:01"}, ... }

    On non-trading days the API returns the last trading session snapshot,
    so date/time naturally reflect the last market close.
    """
    sina_codes = [_to_sina_symbol(code) for code in codes]
    codes_str = ",".join(sina_codes)
    url = f"https://hq.sinajs.cn/list={codes_str}"
    headers = {"Referer": "https://finance.sina.com.cn"}

    resp = requests.get(url, headers=headers, timeout=10)
    resp.encoding = "gbk"
    text = resp.text

    quotes: dict[str, dict] = {}
    for code in sina_codes:
        pattern = rf'var hq_str_{re.escape(code)}="([^"]*)";'
        match = re.search(pattern, text)
        if not match:
            print(f"  ⚠️  Sina quote not found for {code}")
            continue

        raw = match.group(1)
        if not raw or raw.strip() == "":
            print(f"  ⚠️  Sina quote empty for {code}")
            continue

        parts = raw.split(",")
        if len(parts) < 4:
            print(f"  ⚠️  Sina quote incomplete for {code}: {len(parts)} fields")
            continue

        try:
            current_price = float(parts[3])
            # Sina ETF quote fields: name(0), open(1), prev_close(2), current(3), ...,
            # date(30), time(31), trailing field(s). Use fixed indices for reliability.
            date_str = parts[30] if len(parts) > 30 else ""
            time_str = parts[31] if len(parts) > 31 else ""
            datetime_str = f"{date_str} {time_str}".strip() if date_str else ""

            quotes[code] = {
                "current_price": current_price,
                "date": date_str,
                "time": time_str,
                "datetime": datetime_str,
            }
        except (ValueError, IndexError) as exc:
            print(f"  ⚠️  Sina quote parse error for {code}: {exc}")
            continue

    return quotes


def _fetch_history_sina(code: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Download ETF daily data from Sina. No start/end params – filter locally."""
    sina_code = _to_sina_symbol(code)
    df = ak.fund_etf_hist_sina(symbol=sina_code)
    df = df.rename(columns={"date": "日期", "close": "收盘"})
    df["日期"] = pd.to_datetime(df["日期"])
    # Filter date range
    df = df[(df["日期"] >= pd.Timestamp(start_date)) & (df["日期"] <= pd.Timestamp(end_date))]
    df.sort_values("日期", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def _fetch_history_em(code: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Download ETF daily data from Eastmoney."""
    df = ak.fund_etf_hist_em(
        symbol=code, period="daily", start_date=start_date, end_date=end_date
    )
    df["日期"] = pd.to_datetime(df["日期"])
    df.sort_values("日期", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def _fetch_history(
    code: str, start_date: str, end_date: str, max_retries: int = 3
) -> pd.DataFrame:
    """
    Download ETF daily data.
    Try Sina first (more stable); fall back to Eastmoney if it fails.
    """
    last_err = None

    # --- primary: Sina ---
    for attempt in range(1, max_retries + 1):
        try:
            return _fetch_history_sina(code, start_date, end_date)
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                wait = 1 + random.random() * 2
                print(
                    f"  ⚠️ {code} (sina) attempt {attempt} failed"
                    f" ({e.__class__.__name__}), retrying in {wait:.1f}s..."
                )
                time.sleep(wait)

    print(f"  ⚠️ {code} sina failed after {max_retries} attempts, falling back to eastmoney...")

    # --- fallback: Eastmoney ---
    for attempt in range(1, max_retries + 1):
        try:
            return _fetch_history_em(code, start_date, end_date)
        except Exception as e:
            last_err = e
            if attempt < max_retries:
                wait = 2 + random.random() * 3
                print(
                    f"  ⚠️ {code} (em) attempt {attempt} failed"
                    f" ({e.__class__.__name__}), retrying in {wait:.1f}s..."
                )
                time.sleep(wait)

    raise last_err


def _compute_returns(df: pd.DataFrame) -> Dict[int, float]:
    """Compute N-day returns using the closing price column."""
    closes = df["收盘"].astype(float).tolist()
    returns: Dict[int, float] = {}
    for n in PERIODS:
        if len(closes) >= n:
            returns[n] = round(closes[-1] / closes[-n] - 1, 6)
    return returns


def _collect_prices(df: pd.DataFrame) -> Dict[str, float]:
    """Collect the latest close and the close price at each lookback period."""
    closes = df["收盘"].astype(float).tolist()
    prices: Dict[str, float] = {}
    if not closes:
        return prices

    prices["latest"] = closes[-1]
    for n in PERIODS:
        if len(closes) >= n:
            prices[str(n)] = closes[-n]
    return prices


def build_dataset(start_date: str, end_date: str, realtime_quotes: dict[str, dict]) -> Dict:
    assets: List[Dict] = []
    for code, name in TARGETS.items():
        history = _fetch_history(code, start_date, end_date)

        sina_code = _to_sina_symbol(code)
        rt = realtime_quotes.get(sina_code, {})
        current_price = rt.get("current_price")
        rt_date = rt.get("date", "")
        rt_datetime = rt.get("datetime", "")

        # Merge real-time price into history so that closes[-1] is always
        # the latest price (intraday, post-close, or last-close on holidays).
        if current_price is not None and rt_date:
            last_hist_date = history["日期"].iloc[-1].strftime("%Y-%m-%d")
            if rt_date > last_hist_date:
                # New trading day not yet in historical data → append
                new_row = pd.DataFrame({"日期": [pd.Timestamp(rt_date)], "收盘": [current_price]})
                history = pd.concat([history, new_row], ignore_index=True)
            elif rt_date == last_hist_date:
                # Same day → replace the close with the real-time price
                history.loc[history.index[-1], "收盘"] = current_price

        asset_returns = _compute_returns(history)
        asset_prices = _collect_prices(history)
        assets.append(
            {
                "code": code,
                "name": name,
                "returns": {str(k): v for k, v in asset_returns.items()},
                "prices": asset_prices,
                "last_price_time": rt_datetime or history["日期"].iloc[-1].strftime("%Y-%m-%d"),
                "last_price": current_price if current_price is not None else float(history["收盘"].iloc[-1]),
            }
        )

    leaders: Dict[str, str] = {}
    for period in PERIODS:
        period_key = str(period)
        best = max(
            assets,
            key=lambda item: item["returns"].get(period_key, float("-inf")),
        )
        if period_key in best["returns"]:
            leaders[period_key] = best["code"]

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "start_date": start_date,
        "end_date": end_date,
        "periods": PERIODS,
        "leaders": leaders,
        "assets": assets,
        "source": "akshare (sina primary, eastmoney fallback) + sina real-time",
    }


def main() -> None:
    today = datetime.now().date()
    start = today - timedelta(days=180)

    print("Fetching real-time quotes from Sina...")
    realtime_quotes = fetch_realtime_quotes(list(TARGETS.keys()))

    dataset = build_dataset(
        start_date=start.strftime("%Y%m%d"),
        end_date=today.strftime("%Y%m%d"),
        realtime_quotes=realtime_quotes,
    )

    root = Path(__file__).resolve().parents[2]
    lab_dir = root / "lab"
    lab_dir.mkdir(exist_ok=True)
    out_path = lab_dir / "momentum-data.json"
    out_path.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
