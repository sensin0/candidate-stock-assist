import csv
import json
import math
import os
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"
DB_PATH = DATA_DIR / "candidate-stock-assist.sqlite"
PRICE_HISTORY_CSV = DATA_DIR / "monthly-price-history.csv"
SIGNAL_CSV = DATA_DIR / "monthly-signal-backtest.csv"
SUMMARY_CSV = DATA_DIR / "monthly-signal-summary.csv"
REPORT_PATH = REPORTS_DIR / "latest-monthly-signal-backtest.md"

DEFAULT_TIMING = {
    "pbrLow": 0.64,
    "pbrHigh": 1.53,
    "perLow": 10.0,
    "perHigh": 24.0,
}
MAX_FORWARD_RETURN_PCT = 500.0
MIN_FORWARD_RETURN_PCT = -95.0


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ensure_sqlite_store()

    months = int(os.environ.get("MONTHLY_BACKTEST_MONTHS", "36"))
    limit = int(os.environ.get("MONTHLY_BACKTEST_LIMIT", "0"))
    concurrency = int(os.environ.get("MONTHLY_BACKTEST_CONCURRENCY", "8"))
    refresh = os.environ.get("MONTHLY_BACKTEST_REFRESH", "0") == "1"

    universe = load_universe(limit)
    cached_prices = load_price_cache()
    needed = [row for row in universe if refresh or row["code"] not in cached_prices]

    fetched = []
    errors = []
    if needed:
        with ThreadPoolExecutor(max_workers=max(1, concurrency)) as executor:
            future_by_code = {
                executor.submit(fetch_monthly_prices, row["code"], months): row
                for row in needed
            }
            for future in as_completed(future_by_code):
                row = future_by_code[future]
                try:
                    prices = future.result()
                    fetched.extend(prices)
                    cached_prices[row["code"]] = prices
                except Exception as exc:
                    errors.append({
                        "code": row["code"],
                        "name": row.get("name", ""),
                        "error": str(exc),
                    })
                time.sleep(0.03)
        write_price_cache(cached_prices)

    signals = build_monthly_signals(universe, cached_prices, months)
    summaries = summarize_monthly_signals(signals, universe, errors)
    write_csv(SIGNAL_CSV, signals, signal_headers())
    write_csv(SUMMARY_CSV, summaries, summary_headers())
    import_outputs_to_sqlite()
    REPORT_PATH.write_text(render_report(universe, signals, summaries, fetched, errors), encoding="utf-8")

    latest = summaries[-1] if summaries else {}
    print(f"月次シグナルバックテスト: 母集団{len(universe)}件 / 月次判定{len(signals)}行")
    print(f"価格新規取得: {len({row['code'] for row in fetched})}件 / 取得失敗{len(errors)}件")
    if latest:
        print(
            "最新月 "
            f"{latest['month']}: 今買い{latest['nowBuyCount']}件 / "
            f"買い場近い{latest['nearBuyCount']}件 / "
            f"判定可能{latest['analyzedCount']}件"
        )
    print(str(REPORT_PATH.relative_to(ROOT)))


def ensure_sqlite_store():
    if DB_PATH.exists():
        return
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_sqlite_store.py")],
        cwd=ROOT,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def load_universe(limit):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT
          u.code,
          u.name,
          u.market,
          u.sector,
          m.price,
          m.bps,
          m.eps,
          m.cash,
          m.securities,
          m.investmentSecurities,
          m.interestDebt,
          m.netAssets,
          m.shares,
          m.treasuryShares,
          m.asOf AS metricSource,
          s.status,
          s.priceStatus,
          s.financialStatus
        FROM listed_universe u
        LEFT JOIN universe_metrics m ON m.code = u.code
        LEFT JOIN universe_check_status s ON s.code = u.code
        WHERE u.code GLOB '[0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z]'
        ORDER BY u.code
        """
    ).fetchall()
    conn.close()
    items = [dict(row) for row in rows]
    if limit > 0:
        return items[:limit]
    return items


def load_price_cache():
    if not PRICE_HISTORY_CSV.exists():
        return {}
    by_code = {}
    with PRICE_HISTORY_CSV.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            code = row.get("code", "")
            if not code:
                continue
            by_code.setdefault(code, []).append({
                "code": code,
                "month": row.get("month", ""),
                "close": to_float(row.get("close")),
                "source": row.get("source", "yahoo"),
            })
    return {
        code: sorted(
            [row for row in rows if row["month"] and row["close"] > 0],
            key=lambda item: item["month"],
        )
        for code, rows in by_code.items()
    }


def write_price_cache(cached_prices):
    rows = []
    for code in sorted(cached_prices):
        rows.extend(sorted(cached_prices[code], key=lambda item: item["month"]))
    write_csv(PRICE_HISTORY_CSV, rows, ["code", "month", "close", "source"])


def fetch_monthly_prices(code, months):
    end = int(time.time())
    start = end - int((months + 2) * 32 * 24 * 60 * 60)
    symbol = f"{code}.T"
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{symbol}?period1={start}&period2={end}&interval=1mo&events=history&includeAdjustedClose=true"
    )
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"HTTP {exc.code}") from exc
    chart_error = payload.get("chart", {}).get("error")
    if chart_error:
        raise RuntimeError(chart_error.get("description") or chart_error.get("code") or "chart error")
    result = (payload.get("chart", {}).get("result") or [{}])[0]
    timestamps = result.get("timestamp") or []
    indicators = result.get("indicators") or {}
    quote = (indicators.get("quote") or [{}])[0]
    adjclose = (indicators.get("adjclose") or [{}])[0].get("adjclose") or []
    closes = quote.get("close") or []
    prices = adjclose if adjclose else closes
    rows = []
    for timestamp, close in zip(timestamps, prices):
        if close is None or not math.isfinite(float(close)) or float(close) <= 0:
            continue
        month = datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m")
        rows.append({
            "code": code,
            "month": month,
            "close": round(float(close), 4),
            "source": "yahoo",
        })
    rows = dedupe_months(rows)
    if len(rows) < min(6, months):
        raise RuntimeError(f"月次価格が少なすぎます: {len(rows)}件")
    return rows[-months:]


def dedupe_months(rows):
    by_month = {}
    for row in rows:
        by_month[row["month"]] = row
    return [by_month[month] for month in sorted(by_month)]


def build_monthly_signals(universe, cached_prices, months):
    rows = []
    for stock in universe:
        prices = cached_prices.get(stock["code"], [])[-months:]
        for index, price_row in enumerate(prices):
            rows.append(monthly_signal(stock, price_row, prices, index))
    return sorted(rows, key=lambda item: (item["month"], signal_sort(item["signal"]), item["buyRatio"], item["code"]))


def monthly_signal(stock, price_row, prices, index):
    close = to_float(price_row.get("close"))
    bps = to_float(stock.get("bps"))
    eps = to_float(stock.get("eps"))
    shares = max(0.0, to_float(stock.get("shares")) - to_float(stock.get("treasuryShares")))
    metric_source = stock.get("metricSource") or ""
    financial_ok = (
        bps > 0
        and eps > 0
        and shares > 0
        and metric_source not in {"unavailable", "priceEstimate"}
    )
    if not close or not financial_ok:
        return base_signal_row(stock, price_row, "データ不足", "価格または財務データ不足")

    pbr_buy = bps * DEFAULT_TIMING["pbrLow"]
    pbr_target = bps * DEFAULT_TIMING["pbrHigh"]
    per_buy = eps * DEFAULT_TIMING["perLow"]
    per_target = eps * DEFAULT_TIMING["perHigh"]
    buy_line = max(1.0, min(pbr_buy, per_buy))
    target_price = max(pbr_target, per_target, buy_line * 1.5)
    recent_high = max([to_float(row.get("close")) for row in prices[: index + 1]] or [close])
    sell_guide = max(close * 1.2, buy_line * 1.25, recent_high * 1.05)
    sell_guide = max(1.0, min(target_price * 0.9, sell_guide))
    buy_ratio = close / buy_line if buy_line else 999.0
    upside = (target_price / close - 1.0) * 100.0 if close else 0.0
    pbr = close / bps if bps else 0.0
    per = close / eps if eps else 0.0
    market_cap = close * shares / 1_000_000
    net_cash = (
        to_float(stock.get("cash"))
        + to_float(stock.get("securities"))
        + to_float(stock.get("investmentSecurities"))
        - to_float(stock.get("interestDebt"))
    )
    net_cash_ratio = net_cash / market_cap if market_cap > 0 else 0.0
    forward_1m = forward_return(prices, index, 1)
    forward_3m = forward_return(prices, index, 3)
    forward_6m = forward_return(prices, index, 6)

    signal, reason = classify_signal(close, buy_line, sell_guide, target_price, pbr, per, upside)
    return {
        "month": price_row["month"],
        "code": stock["code"],
        "name": stock.get("name", ""),
        "market": stock.get("market", ""),
        "sector": stock.get("sector", ""),
        "close": round(close, 2),
        "buyLine": round(buy_line, 2),
        "sellGuidePrice": round(sell_guide, 2),
        "targetPrice": round(target_price, 2),
        "buyRatio": round(buy_ratio, 4),
        "upside": round(upside, 2),
        "pbr": round(pbr, 4),
        "per": round(per, 4),
        "netCashRatio": round(net_cash_ratio * 100, 2),
        "signal": signal,
        "reason": reason,
        "forward1m": blank_or_round(forward_1m),
        "forward3m": blank_or_round(forward_3m),
        "forward6m": blank_or_round(forward_6m),
        "metricSource": metric_source,
        "dataStatus": "判定可能",
    }


def base_signal_row(stock, price_row, signal, reason):
    return {
        "month": price_row.get("month", ""),
        "code": stock.get("code", ""),
        "name": stock.get("name", ""),
        "market": stock.get("market", ""),
        "sector": stock.get("sector", ""),
        "close": round(to_float(price_row.get("close")), 2),
        "buyLine": "",
        "sellGuidePrice": "",
        "targetPrice": "",
        "buyRatio": "",
        "upside": "",
        "pbr": "",
        "per": "",
        "netCashRatio": "",
        "signal": signal,
        "reason": reason,
        "forward1m": "",
        "forward3m": "",
        "forward6m": "",
        "metricSource": stock.get("metricSource", ""),
        "dataStatus": "不足",
    }


def classify_signal(close, buy_line, sell_guide, target_price, pbr, per, upside):
    if close >= sell_guide * 0.9:
        return "売り確認", "第一利確の90%以上"
    if close <= buy_line and upside >= 50 and 0 < pbr <= 1.0 and 0 < per <= 20:
        return "今買い候補", "買いライン以下かつ上昇余地50%以上"
    if close <= buy_line * 1.10 and upside >= 35 and 0 < pbr <= 1.1 and 0 < per <= 24:
        return "買い場近い", "買いライン+10%以内"
    if pbr > 1.5 or per > 30 or upside < 20:
        return "見送り", "割安度または上昇余地不足"
    return "待ち", "買いライン到達待ち"


def forward_return(prices, index, months_forward):
    target = index + months_forward
    if target >= len(prices):
        return None
    start = to_float(prices[index].get("close"))
    end = to_float(prices[target].get("close"))
    if start <= 0 or end <= 0:
        return None
    result = (end / start - 1.0) * 100.0
    if result > MAX_FORWARD_RETURN_PCT or result < MIN_FORWARD_RETURN_PCT:
        return None
    return result


def summarize_monthly_signals(signals, universe, errors):
    universe_count = len(universe)
    error_codes = {row["code"] for row in errors}
    by_month = {}
    for row in signals:
        by_month.setdefault(row["month"], []).append(row)
    summaries = []
    for month in sorted(by_month):
        rows = by_month[month]
        analyzed = [row for row in rows if row["dataStatus"] == "判定可能"]
        now_buy = [row for row in analyzed if row["signal"] == "今買い候補"]
        near_buy = [row for row in analyzed if row["signal"] == "買い場近い"]
        sell_check = [row for row in analyzed if row["signal"] == "売り確認"]
        wait = [row for row in analyzed if row["signal"] == "待ち"]
        avoid = [row for row in analyzed if row["signal"] == "見送り"]
        data_gap = universe_count - len({row["code"] for row in rows if row["close"] != ""}) + len([row for row in rows if row["dataStatus"] != "判定可能"])
        buy_like = now_buy + near_buy
        summaries.append({
            "month": month,
            "universeCount": universe_count,
            "priceAvailableCount": len({row["code"] for row in rows if row["close"] != ""}),
            "analyzedCount": len(analyzed),
            "nowBuyCount": len(now_buy),
            "nearBuyCount": len(near_buy),
            "sellCheckCount": len(sell_check),
            "waitCount": len(wait),
            "avoidCount": len(avoid),
            "dataGapCount": max(0, data_gap),
            "fetchErrorCount": len(error_codes),
            "buyForward1mAvg": avg_forward(buy_like, "forward1m"),
            "buyForward3mAvg": avg_forward(buy_like, "forward3m"),
            "buyForward6mAvg": avg_forward(buy_like, "forward6m"),
            "buyForward3mWinRate": win_rate(buy_like, "forward3m"),
            "topBuyCodes": " ".join(row["code"] for row in sorted(buy_like, key=lambda item: to_float(item["buyRatio"]))[:10]),
        })
    return summaries


def import_outputs_to_sqlite():
    conn = sqlite3.connect(DB_PATH)
    for table, path, headers in [
        ("monthly_price_history", PRICE_HISTORY_CSV, ["code", "month", "close", "source"]),
        ("monthly_signal_backtest", SIGNAL_CSV, signal_headers()),
        ("monthly_signal_summary", SUMMARY_CSV, summary_headers()),
    ]:
        conn.execute(f'DROP TABLE IF EXISTS "{table}"')
        columns = ", ".join(f'"{header}" TEXT' for header in headers)
        conn.execute(f'CREATE TABLE "{table}" ({columns})')
        if path.exists():
            with path.open("r", encoding="utf-8-sig", newline="") as handle:
                reader = csv.DictReader(handle)
                placeholders = ", ".join("?" for _ in headers)
                names = ", ".join(f'"{header}"' for header in headers)
                conn.executemany(
                    f'INSERT INTO "{table}" ({names}) VALUES ({placeholders})',
                    ([row.get(header, "") for header in headers] for row in reader),
                )
    conn.execute('CREATE INDEX IF NOT EXISTS idx_monthly_price_history_code ON monthly_price_history(code)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_monthly_signal_backtest_month ON monthly_signal_backtest(month)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_monthly_signal_backtest_signal ON monthly_signal_backtest(signal)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_monthly_signal_summary_month ON monthly_signal_summary(month)')
    conn.commit()
    conn.close()


def render_report(universe, signals, summaries, fetched, errors):
    latest = summaries[-1] if summaries else {}
    latest_month = latest.get("month", "")
    latest_rows = [row for row in signals if row["month"] == latest_month]
    buy_rows = [row for row in latest_rows if row["signal"] in {"今買い候補", "買い場近い"}]
    buy_rows = sorted(buy_rows, key=lambda item: to_float(item["buyRatio"]))[:20]
    recent_summaries = summaries[-12:]
    lines = [
        "# 月次シグナルバックテスト",
        "",
        f"生成日時: {datetime.now(timezone.utc).isoformat()}",
        f"母集団: {len(universe):,}件",
        f"価格新規取得: {len({row['code'] for row in fetched}):,}件",
        f"取得失敗: {len(errors):,}件",
        "",
        "注意: 現時点の財務データを使い、過去の月次株価に当てた断面検証です。過去その月時点の有報データ再現ではありません。",
        f"注意: 分割・上場廃止などで歪む月次リターンは、{MAX_FORWARD_RETURN_PCT:.0f}%超または{MIN_FORWARD_RETURN_PCT:.0f}%以下を外れ値として成績集計から除外します。",
        "",
        "## 最新月",
        "",
        f"- 対象月: {latest_month or '-'}",
        f"- 判定可能: {latest.get('analyzedCount', 0)}件",
        f"- 今買い候補: {latest.get('nowBuyCount', 0)}件",
        f"- 買い場近い: {latest.get('nearBuyCount', 0)}件",
        f"- データ不足: {latest.get('dataGapCount', 0)}件",
        "",
        "## 直近12か月の候補数",
        "",
        "| 月 | 判定可能 | 今買い | 買い場近い | 売り確認 | 3か月後平均 | 3か月勝率 |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for row in recent_summaries:
        lines.append(
            f"| {row['month']} | {row['analyzedCount']} | {row['nowBuyCount']} | "
            f"{row['nearBuyCount']} | {row['sellCheckCount']} | {row['buyForward3mAvg']}% | "
            f"{row['buyForward3mWinRate']}% |"
        )
    lines.extend([
        "",
        "## 最新月の候補",
        "",
    ])
    if buy_rows:
        for index, row in enumerate(buy_rows, start=1):
            lines.append(
                f"- {index}. {row['code']} {row['name']}: {row['signal']} / "
                f"株価{yen(row['close'])} / 買いライン{yen(row['buyLine'])} / "
                f"買い接近率{row['buyRatio']} / 上昇余地{row['upside']}%"
            )
    else:
        lines.append("- 該当なし")
    lines.extend([
        "",
        "## データ確認",
        "",
        f"- 月次価格履歴: `{PRICE_HISTORY_CSV.relative_to(ROOT)}`",
        f"- 月次判定CSV: `{SIGNAL_CSV.relative_to(ROOT)}`",
        f"- 月次集計CSV: `{SUMMARY_CSV.relative_to(ROOT)}`",
        f"- SQLiteテーブル: `monthly_price_history`, `monthly_signal_backtest`, `monthly_signal_summary`",
        "",
        "## 次の改善",
        "",
        "- 過去時点の財務データを保存し、当時のBPS/EPSで再判定する。",
        "- 月次ではなく週次/日次の買いライン接触も検証する。",
        "- 候補化した月から1か月、3か月、6か月後の成績をランキング条件へ反映する。",
    ])
    return "\n".join(lines) + "\n"


def signal_headers():
    return [
        "month",
        "code",
        "name",
        "market",
        "sector",
        "close",
        "buyLine",
        "sellGuidePrice",
        "targetPrice",
        "buyRatio",
        "upside",
        "pbr",
        "per",
        "netCashRatio",
        "signal",
        "reason",
        "forward1m",
        "forward3m",
        "forward6m",
        "metricSource",
        "dataStatus",
    ]


def summary_headers():
    return [
        "month",
        "universeCount",
        "priceAvailableCount",
        "analyzedCount",
        "nowBuyCount",
        "nearBuyCount",
        "sellCheckCount",
        "waitCount",
        "avoidCount",
        "dataGapCount",
        "fetchErrorCount",
        "buyForward1mAvg",
        "buyForward3mAvg",
        "buyForward6mAvg",
        "buyForward3mWinRate",
        "topBuyCodes",
    ]


def write_csv(path, rows, headers):
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow({header: row.get(header, "") for header in headers})


def signal_sort(signal):
    order = {
        "今買い候補": 0,
        "買い場近い": 1,
        "売り確認": 2,
        "待ち": 3,
        "見送り": 4,
        "データ不足": 5,
    }
    return order.get(signal, 9)


def avg_forward(rows, key):
    values = [to_float(row.get(key)) for row in rows if row.get(key) not in {"", None}]
    values = [value for value in values if math.isfinite(value)]
    if not values:
        return ""
    return round(sum(values) / len(values), 2)


def win_rate(rows, key):
    values = [to_float(row.get(key)) for row in rows if row.get(key) not in {"", None}]
    values = [value for value in values if math.isfinite(value)]
    if not values:
        return ""
    return round(len([value for value in values if value > 0]) / len(values) * 100, 1)


def blank_or_round(value):
    if value is None or not math.isfinite(value):
        return ""
    return round(value, 2)


def to_float(value):
    try:
        if value is None or value == "":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def yen(value):
    number = to_float(value)
    if number <= 0:
        return "-"
    return f"{round(number):,}円"


if __name__ == "__main__":
    main()
