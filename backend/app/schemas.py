from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MetricIn(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cpu_percent: float = Field(..., ge=0)
    memory_percent: float = Field(..., ge=0)
    disk_percent: float = Field(..., ge=0)
    net_sent: float = Field(..., ge=0)
    net_recv: float = Field(..., ge=0)


class MetricOut(MetricIn):
    id: int
    recorded_at: datetime


class LogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: str
    source_timestamp: Optional[str] = None


class LogPayload(BaseModel):
    entries: List[LogEntry]
