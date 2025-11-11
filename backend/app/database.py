from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterator

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "monitoring.db"


def ensure_db_path() -> None:
    """Ensure the parent directory for the database exists."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row factory configured."""
    ensure_db_path()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialise database tables if they do not already exist."""
    ensure_db_path()
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT NOT NULL,
                sampled_at TEXT NOT NULL,
                cpu_percent REAL NOT NULL,
                memory_percent REAL NOT NULL,
                disk_percent REAL NOT NULL,
                net_sent REAL NOT NULL,
                net_recv REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS syslog_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT NOT NULL,
                source_timestamp TEXT,
                message TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ipmi_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT NOT NULL,
                source_timestamp TEXT,
                message TEXT NOT NULL
            );
            """
        )

    # Backfill for deployments created without sampled_at
    with get_connection() as conn:
        cursor = conn.execute("PRAGMA table_info(metrics)")
        columns = {row["name"] for row in cursor.fetchall()}
        if "sampled_at" not in columns:
            conn.execute("ALTER TABLE metrics ADD COLUMN sampled_at TEXT DEFAULT ''")
            conn.commit()


def iterate_rows(query: str, params: tuple = ()) -> Iterator[sqlite3.Row]:
    """Helper generator to execute a query and yield rows."""
    with get_connection() as conn:
        cursor = conn.execute(query, params)
        for row in cursor:
            yield row
