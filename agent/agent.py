from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

import psutil
import requests

STATE_FILE = Path(__file__).resolve().parent / "agent_state.json"
SYSLOG_PATH = Path("/var/log/syslog")


def load_state() -> Dict[str, Any]:
    if not STATE_FILE.exists():
        return {}
    try:
        with STATE_FILE.open("r", encoding="utf-8") as fp:
            return json.load(fp)
    except json.JSONDecodeError:
        return {}


def save_state(state: Dict[str, Any]) -> None:
    with STATE_FILE.open("w", encoding="utf-8") as fp:
        json.dump(state, fp, indent=2)


def collect_metrics() -> Dict[str, Any]:
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()

    metric = {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "disk_percent": disk.percent,
        "net_sent": net.bytes_sent / (1024 * 1024),
        "net_recv": net.bytes_recv / (1024 * 1024),
    }
    return metric


def read_syslog(offset: int = 0, max_bytes: int = 1024 * 512) -> Tuple[int, List[Dict[str, Any]]]:
    if not SYSLOG_PATH.exists():
        return offset, []

    entries: List[Dict[str, Any]] = []

    try:
        size = SYSLOG_PATH.stat().st_size
    except OSError:
        size = 0

    if offset > size:
        offset = 0

    with SYSLOG_PATH.open("r", encoding="utf-8", errors="ignore") as fp:
        fp.seek(offset)
        data = fp.read(max_bytes)
        new_offset = fp.tell()

    if not data:
        return offset, []

    for line in data.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        entries.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": stripped,
                "source_timestamp": None,
            }
        )

    return new_offset, entries


def collect_ipmi() -> Tuple[str, List[Dict[str, Any]]]:
    command = ["ipmitool", "sel", "list"]
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
        )
    except FileNotFoundError:
        return "", []
    except subprocess.SubprocessError:
        return "", []

    output = result.stdout.strip()
    if not output:
        return "", []

    digest = str(hash(output))
    entries = [
        {
            "timestamp": datetime.utcnow().isoformat(),
            "message": line.strip(),
            "source_timestamp": None,
        }
        for line in output.splitlines()
        if line.strip()
    ]
    return digest, entries


def post_json(url: str, payload: Dict[str, Any]) -> bool:
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except requests.RequestException as exc:
        print(f"[WARN] Failed POST {url}: {exc}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Single-server monitoring agent")
    parser.add_argument(
        "--backend-url",
        default=os.environ.get("MONITORING_BACKEND", "http://127.0.0.1:8000"),
        help="Base URL for the monitoring backend (default: %(default)s)",
    )
    parser.add_argument(
        "--metrics-interval",
        type=int,
        default=int(os.environ.get("METRICS_INTERVAL", "30")),
        help="Seconds between metrics samples (default: %(default)s)",
    )
    parser.add_argument(
        "--logs-interval",
        type=int,
        default=int(os.environ.get("LOGS_INTERVAL", "60")),
        help="Seconds between log uploads (default: %(default)s)",
    )
    parser.add_argument(
        "--ipmi-interval",
        type=int,
        default=int(os.environ.get("IPMI_INTERVAL", "300")),
        help="Seconds between IPMI SEL dumps (default: %(default)s)",
    )
    args = parser.parse_args()

    ipmi_available = shutil.which("ipmitool") is not None
    if not ipmi_available:
        print("[WARN] ipmitool not found. Hardware SEL collection disabled.")

    state = load_state()
    syslog_offset = state.get("syslog_offset", 0)
    last_ipmi_digest = state.get("ipmi_digest", "")

    next_metrics = time.monotonic()
    next_logs = time.monotonic()
    next_ipmi = time.monotonic()

    backend_metrics_url = f"{args.backend_url.rstrip('/')}/metrics"
    backend_syslog_url = f"{args.backend_url.rstrip('/')}/logs/syslog"
    backend_ipmi_url = f"{args.backend_url.rstrip('/')}/logs/ipmi"

    print(f"[INFO] Agent started. Backend: {args.backend_url}")

    while True:
        now = time.monotonic()

        if now >= next_metrics:
            metrics = collect_metrics()
            success = post_json(backend_metrics_url, metrics)
            if success:
                print(f"[INFO] Metrics sent at {metrics['timestamp']}")
            next_metrics = now + args.metrics_interval

        if now >= next_logs:
            syslog_offset, entries = read_syslog(syslog_offset)
            if entries:
                payload = {"entries": entries}
                if post_json(backend_syslog_url, payload):
                    state["syslog_offset"] = syslog_offset
                    save_state(state)
                    print(f"[INFO] Sent {len(entries)} syslog entries")
            next_logs = now + args.logs_interval

        if ipmi_available and now >= next_ipmi:
            digest, ipmi_entries = collect_ipmi()
            if digest and digest != last_ipmi_digest and ipmi_entries:
                if post_json(backend_ipmi_url, {"entries": ipmi_entries}):
                    last_ipmi_digest = digest
                    state["ipmi_digest"] = digest
                    save_state(state)
                    print(f"[INFO] Sent {len(ipmi_entries)} IPMI SEL entries")
            next_ipmi = now + args.ipmi_interval

        time.sleep(1)


if __name__ == "__main__":
    main()
