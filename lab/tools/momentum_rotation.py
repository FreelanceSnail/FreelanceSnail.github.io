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
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import akshare as ak
import pandas as pd


TARGETS = {
    "511090": "30年国债ETF",
    "518880": "黄金ETF",
    "159915": "创业板ETF",
    "563080": "中证A50ETF",
}

# Trading-day lookback windows.
PERIODS = [21, 22, 23, 24]


def _fetch_history(code: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Download ETF daily data and keep chronological rows."""
    df = ak.fund_etf_hist_em(symbol=code, period="daily", start_date=start_date, end_date=end_date)
    df["日期"] = pd.to_datetime(df["日期"])
    df.sort_values("日期", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def _compute_returns(df: pd.DataFrame) -> Dict[int, float]:
    """Compute N-day returns using the closing price column."""
    closes = df["收盘"].astype(float).tolist()
    returns: Dict[int, float] = {}
    for n in PERIODS:
        if len(closes) >= n:
            returns[n] = round(closes[-1] / closes[-n] - 1, 6)
    return returns


def build_dataset(start_date: str, end_date: str) -> Dict:
    assets: List[Dict] = []
    for code, name in TARGETS.items():
        history = _fetch_history(code, start_date, end_date)
        asset_returns = _compute_returns(history)
        assets.append(
            {
                "code": code,
                "name": name,
                "returns": {str(k): v for k, v in asset_returns.items()},
                "last_date": history["日期"].iloc[-1].strftime("%Y-%m-%d"),
                "last_close": float(history["收盘"].iloc[-1]),
            }
        )

    leaders: Dict[str, str] = {}
    for period in PERIODS:
        period_key = str(period)
        best = max(assets, key=lambda item: item["returns"].get(period_key, float("-inf")))
        if period_key in best["returns"]:
            leaders[period_key] = best["code"]

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "start_date": start_date,
        "end_date": end_date,
        "periods": PERIODS,
        "leaders": leaders,
        "assets": assets,
        "source": "akshare fund_etf_hist_em",
    }


def main() -> None:
    today = datetime.now().date()
    start = today - timedelta(days=180)
    dataset = build_dataset(start_date=start.strftime("%Y%m%d"), end_date=today.strftime("%Y%m%d"))

    root = Path(__file__).resolve().parents[2]
    data_dir = root / "_data"
    data_dir.mkdir(exist_ok=True)
    out_path = data_dir / "momentum_rotation.json"
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
