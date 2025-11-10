import { createHash } from "crypto";

import type { NodeTelemetry, StoredNode } from "./admin-node-types";

function pseudoRandom(seed: string, min: number, max: number) {
  const hash = createHash("sha256").update(seed).digest("hex");
  const slice = hash.slice(0, 8);
  const value = parseInt(slice, 16);
  const normalised = value / 0xffffffff;
  return Math.round(min + (max - min) * normalised);
}

export function createNodeTelemetry(node: StoredNode): NodeTelemetry {
  const timeSlice = Math.floor(Date.now() / 60000);
  const seedBase = `${node.id}-${timeSlice}`;
  const cpuUsage = pseudoRandom(`${seedBase}-cpu`, 42, 96);
  const memoryUsage = pseudoRandom(`${seedBase}-memory`, 35, 92);
  const latencyMs = pseudoRandom(`${seedBase}-latency`, 22, 280);
  const heartbeatLag = pseudoRandom(`${seedBase}-heartbeat`, 3, 140);

  let gpuUsage: number | null = null;
  if (node.role.toLowerCase().includes("gpu")) {
    gpuUsage = pseudoRandom(`${seedBase}-gpu`, 38, 97);
  }

  const highestLoad = gpuUsage !== null ? Math.max(cpuUsage, gpuUsage) : cpuUsage;
  let status: NodeTelemetry["status"] = "healthy";

  if (highestLoad >= 92 || latencyMs >= 240) {
    status = "critical";
  } else if (highestLoad >= 82 || latencyMs >= 180) {
    status = "warning";
  }

  return {
    status,
    cpuUsage,
    memoryUsage,
    gpuUsage,
    latencyMs,
    lastHeartbeat: new Date(Date.now() - heartbeatLag * 1000).toISOString(),
  };
}
