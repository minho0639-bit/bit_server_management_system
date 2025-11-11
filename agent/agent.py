from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import time
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import psutil
import requests

STATE_FILE = Path(__file__).resolve().parent / "agent_state.json"
SYSLOG_PATH = Path("/var/log/syslog")

SYSLOG_WARNING_EMITTED = False
IPMI_WARNING_EMITTED = False
IFTOP_AVAILABLE = shutil.which("iftop") is not None
IFTOP_WARNING_EMITTED = False

RATE_PATTERN = re.compile(r"([\d.]+)\s*([kmg]?b)(?:/s)?", re.IGNORECASE)


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


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_rate_token(token: str) -> Optional[float]:
    match = RATE_PATTERN.search(token)
    if not match:
        return None
    value = float(match.group(1))
    unit = match.group(2).lower()
    if unit == "b":
        return value / (1024 * 1024)
    if unit == "kb":
        return value / 1024
    if unit == "mb":
        return value
    if unit == "gb":
        return value * 1024
    return None


def collect_network_via_iftop() -> Optional[Tuple[float, float]]:
    global IFTOP_WARNING_EMITTED
    if not IFTOP_AVAILABLE:
        return None

    command = ["iftop", "-t", "-s", "1", "-n", "-B"]
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=15,
        )
    except (FileNotFoundError, PermissionError):
        return None
    except subprocess.SubprocessError as exc:
        if not IFTOP_WARNING_EMITTED:
            print(f"[WARN] iftop command failed: {exc}")
            IFTOP_WARNING_EMITTED = True
        return None

    if IFTOP_WARNING_EMITTED:
        print("[INFO] iftop network collection restored.")
        IFTOP_WARNING_EMITTED = False

    send_rate: Optional[float] = None
    recv_rate: Optional[float] = None
    for line in result.stdout.splitlines():
        stripped = line.strip()
        lower = stripped.lower()
        if lower.startswith("total send rate"):
            send_rate = parse_rate_token(stripped.split(":", 1)[-1])
        elif lower.startswith("total receive rate"):
            recv_rate = parse_rate_token(stripped.split(":", 1)[-1])

    if send_rate is None or recv_rate is None:
        return None
    return send_rate, recv_rate


def collect_network_via_psutil(state: Dict[str, Any]) -> Tuple[float, float]:
    now = time.monotonic()
    counters = psutil.net_io_counters()

    prev = state.get("net_prev") or {}
    prev_time = prev.get("timestamp")
    prev_sent = prev.get("bytes_sent", counters.bytes_sent)
    prev_recv = prev.get("bytes_recv", counters.bytes_recv)

    if prev_time is None:
        sent_rate = recv_rate = 0.0
    else:
        interval = max(now - prev_time, 1e-3)
        sent_rate = max(0.0, (counters.bytes_sent - prev_sent) / interval) / (1024 * 1024)
        recv_rate = max(0.0, (counters.bytes_recv - prev_recv) / interval) / (1024 * 1024)

    state["net_prev"] = {
        "timestamp": now,
        "bytes_sent": counters.bytes_sent,
        "bytes_recv": counters.bytes_recv,
    }
    return sent_rate, recv_rate


def refresh_net_snapshot(state: Dict[str, Any]) -> None:
    counters = psutil.net_io_counters()
    state["net_prev"] = {
        "timestamp": time.monotonic(),
        "bytes_sent": counters.bytes_sent,
        "bytes_recv": counters.bytes_recv,
    }


def collect_network_rates(state: Dict[str, Any]) -> Tuple[float, float]:
    rates = collect_network_via_iftop()
    if rates is not None:
        refresh_net_snapshot(state)
        return rates
    return collect_network_via_psutil(state)


def collect_metrics(state: Dict[str, Any]) -> Dict[str, Any]:
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net_sent_rate, net_recv_rate = collect_network_rates(state)

    metric = {
        "timestamp": utc_now_iso(),
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "disk_percent": disk.percent,
        "net_sent": net_sent_rate,
        "net_recv": net_recv_rate,
    }
    return metric


def read_syslog(offset: int = 0, max_bytes: int = 1024 * 512) -> Tuple[int, List[Dict[str, Any]]]:
    global SYSLOG_WARNING_EMITTED
    if not SYSLOG_PATH.exists():
        return offset, []

    entries: List[Dict[str, Any]] = []

    try:
        size = SYSLOG_PATH.stat().st_size
    except OSError:
        size = 0

    if offset > size:
        offset = 0

    try:
        with SYSLOG_PATH.open("r", encoding="utf-8", errors="ignore") as fp:
            fp.seek(offset)
            data = fp.read(max_bytes)
            new_offset = fp.tell()
    except OSError as exc:
        if not SYSLOG_WARNING_EMITTED:
            print(f"[WARN] Unable to read syslog ({SYSLOG_PATH}): {exc}")
            SYSLOG_WARNING_EMITTED = True
        return offset, []

    if SYSLOG_WARNING_EMITTED:
        print("[INFO] syslog access restored.")
        SYSLOG_WARNING_EMITTED = False

    if not data:
        return offset, []

    for line in data.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        entries.append(
            {
                "timestamp": utc_now_iso(),
                "message": stripped,
                "source_timestamp": None,
            }
        )

    return new_offset, entries


def collect_ipmi() -> Tuple[str, List[Dict[str, Any]]]:
    global IPMI_WARNING_EMITTED
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
    except subprocess.SubprocessError as exc:
        if not IPMI_WARNING_EMITTED:
            print(f"[WARN] ipmitool sel list failed: {exc}")
            IPMI_WARNING_EMITTED = True
        return "", []

    output = result.stdout.strip()
    if not output:
        return "", []

    if IPMI_WARNING_EMITTED:
        print("[INFO] ipmitool SEL access restored.")
        IPMI_WARNING_EMITTED = False

    digest = str(hash(output))
    entries = [
        {
            "timestamp": utc_now_iso(),
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
    if not IFTOP_AVAILABLE:
        print("[WARN] iftop not found. Falling back to psutil network estimation.")

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
            metrics = collect_metrics(state)
            state["last_metric_timestamp"] = metrics["timestamp"]
            save_state(state)
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
