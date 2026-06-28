import csv
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"
DB_PATH = DATA_DIR / "candidate-stock-assist.sqlite"
MANIFEST_PATH = DATA_DIR / "sqlite-store-manifest.json"
REPORT_PATH = REPORTS_DIR / "latest-sqlite-store.md"


def main():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    csv_files = sorted(DATA_DIR.glob("*.csv"))
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute(
        """
        CREATE TABLE csv_store_tables (
          table_name TEXT PRIMARY KEY,
          csv_file TEXT NOT NULL,
          row_count INTEGER NOT NULL,
          column_count INTEGER NOT NULL,
          imported_at TEXT NOT NULL
        )
        """
    )

    imported = []
    for csv_file in csv_files:
        table_name = table_name_for(csv_file.name)
        rows, headers = read_csv(csv_file)
        if not headers:
            continue
        create_table(conn, table_name, headers)
        insert_rows(conn, table_name, headers, rows)
        add_common_indexes(conn, table_name, headers)
        imported.append({
            "table": table_name,
            "csv": csv_file.name,
            "rows": len(rows),
            "columns": len(headers),
            "bytes": csv_file.stat().st_size,
        })
        conn.execute(
            "INSERT INTO csv_store_tables(table_name, csv_file, row_count, column_count, imported_at) VALUES (?, ?, ?, ?, ?)",
            (table_name, csv_file.name, len(rows), len(headers), now_iso()),
        )

    create_views(conn)
    conn.commit()
    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
    table_count = conn.execute("SELECT COUNT(*) FROM csv_store_tables").fetchone()[0]
    conn.close()

    manifest = {
        "generatedAt": now_iso(),
        "database": str(DB_PATH.relative_to(ROOT)).replace("\\", "/"),
        "databaseBytes": DB_PATH.stat().st_size,
        "tables": table_count,
        "rows": sum(item["rows"] for item in imported),
        "integrity": integrity,
        "imported": imported,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8-sig")
    REPORT_PATH.write_text(render_report(manifest), encoding="utf-8-sig")
    print(f"SQLite store build: {manifest['tables']} tables / {manifest['rows']} rows / integrity={integrity}")
    print(str(REPORT_PATH.relative_to(ROOT)))

    if integrity != "ok":
        raise SystemExit(1)


def read_csv(csv_file):
    with csv_file.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = [safe_column(header) for header in (reader.fieldnames or [])]
        rows = []
        for raw in reader:
            rows.append({safe_column(key): value for key, value in raw.items()})
    return rows, headers


def create_table(conn, table_name, headers):
    columns = ", ".join(f'"{header}" TEXT' for header in headers)
    conn.execute(f'CREATE TABLE "{table_name}" ({columns})')


def insert_rows(conn, table_name, headers, rows):
    if not rows:
        return
    placeholders = ", ".join("?" for _ in headers)
    columns = ", ".join(f'"{header}"' for header in headers)
    values = [[row.get(header, "") for header in headers] for row in rows]
    conn.executemany(f'INSERT INTO "{table_name}" ({columns}) VALUES ({placeholders})', values)


def add_common_indexes(conn, table_name, headers):
    for column in ["code", "asOf", "reviewStatus", "status", "judgement"]:
        if column in headers:
            index_name = f"idx_{table_name}_{column}"
            conn.execute(f'CREATE INDEX "{index_name}" ON "{table_name}" ("{column}")')


def create_views(conn):
    tables = {row[0] for row in conn.execute("SELECT table_name FROM csv_store_tables")}
    if {"stock_master", "stock_master_universe_promotion_draft"} <= tables:
        conn.execute(
            """
            CREATE VIEW runtime_candidates AS
            SELECT
              code,
              name,
              sector,
              price,
              shares,
              cash,
              interestDebt,
              netAssets,
              bps,
              eps,
              dataConfidence,
              'stock-master.csv' AS runtimeSource
            FROM stock_master
            UNION ALL
            SELECT
              code,
              name,
              sector,
              price,
              shares,
              cash,
              interestDebt,
              netAssets,
              bps,
              eps,
              '自動財務確認' AS dataConfidence,
              'stock-master-universe-promotion-draft.csv' AS runtimeSource
            FROM stock_master_universe_promotion_draft
            WHERE code NOT IN (SELECT code FROM stock_master)
            """
        )
    elif "stock_master" in tables:
        conn.execute(
            """
            CREATE VIEW runtime_candidates AS
            SELECT
              code,
              name,
              sector,
              price,
              shares,
              cash,
              interestDebt,
              netAssets,
              bps,
              eps,
              dataConfidence,
              'stock-master.csv' AS runtimeSource
            FROM stock_master
            """
        )

    if {"runtime_candidates", "backtest_results"} <= {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type IN ('table', 'view')")}:
        conn.execute(
            """
            CREATE VIEW runtime_candidate_backtest AS
            SELECT
              s.code,
              s.name,
              s.sector,
              s.price,
              s.dataConfidence,
              b.timingLabel,
              b.winRate,
              b.averageReturn,
              b.maxDrawdown
            FROM runtime_candidates s
            LEFT JOIN backtest_results b ON b.code = s.code
            """
        )
    if {"universe_buy_candidates", "universe_buy_candidate_review"} <= tables:
        conn.execute(
            """
            CREATE VIEW auto_buy_candidate_review AS
            SELECT
              c.code,
              c.name,
              c.sector,
              c.autoBuyScore,
              c.buyRatio,
              c.upside,
              r.reviewStatus,
              r.reasons,
              r.cautions
            FROM universe_buy_candidates c
            LEFT JOIN universe_buy_candidate_review r ON r.code = c.code
            """
        )
    if {"monthly_signal_backtest", "monthly_signal_summary"} <= tables:
        conn.execute(
            """
            CREATE VIEW latest_monthly_buy_candidates AS
            SELECT
              b.month,
              b.code,
              b.name,
              b.market,
              b.sector,
              b.close,
              b.buyLine,
              b.sellGuidePrice,
              b.targetPrice,
              b.buyRatio,
              b.upside,
              b.pbr,
              b.per,
              b.netCashRatio,
              b.signal,
              b.forward1m,
              b.forward3m,
              b.forward6m
            FROM monthly_signal_backtest b
            WHERE b.month = (SELECT MAX(month) FROM monthly_signal_summary)
              AND b.signal IN ('今買い候補', '買い場近い')
            ORDER BY CAST(NULLIF(b.buyRatio, '') AS REAL) ASC, CAST(NULLIF(b.upside, '') AS REAL) DESC
            """
        )


def table_name_for(filename):
    base = filename.rsplit(".", 1)[0]
    name = re.sub(r"[^0-9a-zA-Z_]+", "_", base).strip("_").lower()
    if re.match(r"^\d", name):
        name = f"csv_{name}"
    return name


def safe_column(name):
    value = re.sub(r"[^0-9a-zA-Z_]+", "_", str(name or "column").strip()).strip("_")
    if not value:
        value = "column"
    if re.match(r"^\d", value):
        value = f"c_{value}"
    return value


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def render_report(manifest):
    largest = sorted(manifest["imported"], key=lambda item: item["rows"], reverse=True)[:12]
    lines = [
        "# SQLiteストア",
        "",
        f"生成日時: {manifest['generatedAt']}",
        "",
        f"DB: `{manifest['database']}`",
        f"テーブル: {manifest['tables']}件",
        f"総行数: {manifest['rows']:,}行",
        f"DBサイズ: {format_bytes(manifest['databaseBytes'])}",
        f"整合性: {manifest['integrity']}",
        "",
        "## 方針",
        "",
        "- SQLiteを検索、結合、ランキング生成の正本にします。",
        "- CSVは外部取得、手動確認、Git差分確認、バックアップ用に残します。",
        "- DBファイルはCSVから毎回自動再構築します。監査結果だけ追跡します。",
        "",
        "## 大きいテーブル",
        "",
        *[
            f"- {item['table']}: {item['rows']:,}行 / {item['columns']}列 / 元CSV `{item['csv']}`"
            for item in largest
        ],
        "",
        "## 代表ビュー",
        "",
        "- `runtime_candidates`: 通常候補と自動昇格候補を合わせた実運用候補",
        "- `runtime_candidate_backtest`: 通常候補とバックテスト結果",
        "- `auto_buy_candidate_review`: 自動買い候補と昇格判定",
        "- `latest_monthly_buy_candidates`: 最新月の月次買い候補",
        "",
    ]
    return "\n".join(lines)


def format_bytes(value):
    if value >= 1_000_000:
        return f"{round(value / 1_000_000, 2)}MB"
    if value >= 1_000:
        return f"{round(value / 1_000, 2)}KB"
    return f"{value}B"


if __name__ == "__main__":
    main()
