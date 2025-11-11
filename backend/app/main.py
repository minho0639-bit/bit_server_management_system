from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from .database import get_connection, init_db, iterate_rows
from .schemas import LogPayload, MetricIn

STATIC_DIR = Path(__file__).resolve().parent / "static"

app = FastAPI(title="Single-Server Monitoring API")

if STATIC_DIR.exists():
    app.mount("/dashboard", StaticFiles(directory=STATIC_DIR, html=True), name="dashboard")


@app.on_event("startup")
def startup() -> None:
    init_db()


def get_db():
    with get_connection() as conn:
        yield conn


@app.post("/metrics", status_code=201)
def ingest_metric(metric: MetricIn, conn=Depends(get_db)) -> dict[str, Any]:
    cursor = conn.execute(
        """
        INSERT INTO metrics (
            recorded_at,
            sampled_at,
            cpu_percent,
            gpu_present,
            gpu_percent,
            memory_percent,
            disk_percent,
            net_sent,
            net_recv
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            datetime.now(timezone.utc).isoformat(),
            metric.timestamp.isoformat(),
            metric.cpu_percent,
            1 if metric.gpu_present else 0,
            metric.gpu_percent,
            metric.memory_percent,
            metric.disk_percent,
            metric.net_sent,
            metric.net_recv,
        ),
    )
    conn.commit()
    return {"id": cursor.lastrowid}


@app.get("/metrics/recent")
def recent_metrics(limit: int = Query(50, ge=1, le=500)) -> List[dict[str, Any]]:
    rows = list(
        iterate_rows(
            """
            SELECT
                id,
                recorded_at,
                sampled_at,
                cpu_percent,
                gpu_present,
                gpu_percent,
                memory_percent,
                disk_percent,
                net_sent,
                net_recv
            FROM metrics
            ORDER BY recorded_at DESC
            LIMIT ?
            """,
            (limit,),
        )
    )
    results: List[dict[str, Any]] = []
    for row in rows:
        data = dict(row)
        if "gpu_present" in data and data["gpu_present"] is not None:
            data["gpu_present"] = bool(data["gpu_present"])
        if not data.get("gpu_present"):
            data["gpu_percent"] = None
        results.append(data)
    return results


@app.post("/logs/syslog", status_code=201)
def ingest_syslog(payload: LogPayload, conn=Depends(get_db)) -> dict[str, Any]:
    if not payload.entries:
        raise HTTPException(status_code=400, detail="No entries provided")

    conn.executemany(
        """
        INSERT INTO syslog_entries (recorded_at, source_timestamp, message)
        VALUES (?, ?, ?)
        """,
        [
            (
                datetime.now(timezone.utc).isoformat(),
                entry.timestamp.isoformat(),
                entry.message,
            )
            for entry in payload.entries
        ],
    )
    conn.commit()
    return {"inserted": len(payload.entries)}


@app.get("/logs/syslog")
def recent_syslog(limit: int = Query(100, ge=1, le=1000)) -> List[dict[str, Any]]:
    rows = list(
        iterate_rows(
            """
            SELECT id, recorded_at, source_timestamp, message
            FROM syslog_entries
            ORDER BY recorded_at DESC
            LIMIT ?
            """,
            (limit,),
        )
    )
    return [dict(row) for row in rows]


@app.post("/logs/ipmi", status_code=201)
def ingest_ipmi(payload: LogPayload, conn=Depends(get_db)) -> dict[str, Any]:
    if not payload.entries:
        raise HTTPException(status_code=400, detail="No entries provided")

    conn.executemany(
        """
        INSERT INTO ipmi_logs (recorded_at, source_timestamp, message)
        VALUES (?, ?, ?)
        """,
        [
            (
                datetime.now(timezone.utc).isoformat(),
                entry.timestamp.isoformat() if entry.timestamp else None,
                entry.message,
            )
            for entry in payload.entries
        ],
    )
    conn.commit()
    return {"inserted": len(payload.entries)}


@app.get("/logs/ipmi")
def recent_ipmi(limit: int = Query(100, ge=1, le=1000)) -> List[dict[str, Any]]:
    rows = list(
        iterate_rows(
            """
            SELECT id, recorded_at, source_timestamp, message
            FROM ipmi_logs
            ORDER BY recorded_at DESC
            LIMIT ?
            """,
            (limit,),
        )
    )
    return [dict(row) for row in rows]


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    dashboard_path = STATIC_DIR / "index.html"
    if dashboard_path.exists():
        with dashboard_path.open("r", encoding="utf-8") as fp:
            return HTMLResponse(content=fp.read())
    return HTMLResponse(content="<h1>Single-Server Monitoring API</h1>")
