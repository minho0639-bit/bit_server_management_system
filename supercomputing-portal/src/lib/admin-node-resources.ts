import { createHash } from "crypto";

import type { StoredNode } from "./admin-node-types";

interface CpuResource {
  usagePercent: number;
  cores: number;
  loadAverage: [number, number, number];
}

interface MemoryResource {
  totalGb: number;
  usedGb: number;
  usagePercent: number;
}

interface StorageResource {
  totalTb: number;
  usedTb: number;
  iops: number;
}

interface NetworkResource {
  inboundMbps: number;
  outboundMbps: number;
  packetLossPercent: number;
}

interface GpuResource {
  name: string;
  index: number;
  usagePercent: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  temperatureC: number;
}

interface ProcessResource {
  name: string;
  user: string;
  cpuPercent: number;
  memoryPercent: number;
}

export interface NodeResourceSnapshot {
  timestamp: string;
  cpu: CpuResource;
  memory: MemoryResource;
  storage: StorageResource;
  network: NetworkResource;
  gpus: GpuResource[];
  processes: ProcessResource[];
}

function pseudoRandom(seed: string, min: number, max: number) {
  const hash = createHash("sha256").update(seed).digest("hex");
  const slice = hash.slice(0, 8);
  const value = parseInt(slice, 16);
  const normalised = value / 0xffffffff;
  return min + (max - min) * normalised;
}

function round(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
}

function deriveBaseline(node: StoredNode) {
  const role = node.role.toLowerCase();
  if (role.includes("gpu")) {
    return { cores: 128, memoryGb: 1024, storageTb: 4, gpus: 4, gpuMemoryGb: 80 };
  }
  if (role.includes("storage")) {
    return { cores: 48, memoryGb: 512, storageTb: 12, gpus: 0, gpuMemoryGb: 0 };
  }
  if (role.includes("control") || role.includes("login")) {
    return { cores: 32, memoryGb: 256, storageTb: 2, gpus: 0, gpuMemoryGb: 0 };
  }
  return { cores: 64, memoryGb: 512, storageTb: 3, gpus: 0, gpuMemoryGb: 0 };
}

const PROCESS_CANDIDATES = [
  { name: "tensor-job", user: "researcher" },
  { name: "mpi-solver", user: "hpc-user" },
  { name: "data-loader", user: "etl" },
  { name: "notebook-session", user: "analysis" },
  { name: "monitor-agent", user: "system" },
  { name: "quantum-sim", user: "quantum" },
];

export function createNodeResourceSnapshot(node: StoredNode): NodeResourceSnapshot {
  const baseline = deriveBaseline(node);
  const now = new Date();
  const timeSlice = Math.floor(now.getTime() / 30000);
  const baseSeed = `${node.id}-${timeSlice}`;

  const cpuUsage = round(pseudoRandom(`${baseSeed}-cpu`, 45, 95), 1);
  const loadAvg1 = round((cpuUsage / 100) * baseline.cores * pseudoRandom(`${baseSeed}-load1`, 0.8, 1.15), 2);
  const loadAvg5 = round(loadAvg1 * pseudoRandom(`${baseSeed}-load5`, 0.7, 1.0), 2);
  const loadAvg15 = round(loadAvg1 * pseudoRandom(`${baseSeed}-load15`, 0.5, 0.8), 2);

  const memoryUsagePercent = round(pseudoRandom(`${baseSeed}-memUsage`, 38, 90), 1);
  const memoryUsedGb = round((memoryUsagePercent / 100) * baseline.memoryGb, 1);

  const storageUsagePercent = round(pseudoRandom(`${baseSeed}-storageUsage`, 40, 83), 1);
  const storageUsedTb = round((storageUsagePercent / 100) * baseline.storageTb, 2);
  const storageIops = Math.round(pseudoRandom(`${baseSeed}-iops`, 4200, 12800));

  const inboundMbps = round(pseudoRandom(`${baseSeed}-netIn`, 320, 820), 1);
  const outboundMbps = round(pseudoRandom(`${baseSeed}-netOut`, 280, 760), 1);
  const packetLoss = round(pseudoRandom(`${baseSeed}-pktLoss`, 0.01, 0.12), 3);

  const gpus: GpuResource[] = [];
  if (baseline.gpus > 0) {
    for (let idx = 0; idx < baseline.gpus; idx += 1) {
      const gpuSeed = `${baseSeed}-gpu-${idx}`;
      const usage = round(pseudoRandom(gpuSeed, 48, 97), 1);
      const memUsed = round((usage / 100) * baseline.gpuMemoryGb * pseudoRandom(`${gpuSeed}-mem`, 0.82, 0.98), 1);
      const temperature = Math.round(pseudoRandom(`${gpuSeed}-temp`, 48, 78));
      gpus.push({
        name: `NVIDIA H100-${idx}`,
        index: idx,
        usagePercent: usage,
        memoryUsedGb: memUsed,
        memoryTotalGb: baseline.gpuMemoryGb,
        temperatureC: temperature,
      });
    }
  }

  const processCount = 4;
  const processes: ProcessResource[] = [];
  for (let idx = 0; idx < processCount; idx += 1) {
    const candidate = PROCESS_CANDIDATES[(Math.round(pseudoRandom(`${baseSeed}-proc-${idx}`, 0, PROCESS_CANDIDATES.length - 1))) % PROCESS_CANDIDATES.length];
    const cpu = round(pseudoRandom(`${baseSeed}-proc-cpu-${idx}`, 4, 18), 1);
    const mem = round(pseudoRandom(`${baseSeed}-proc-mem-${idx}`, 1, 12), 1);
    processes.push({
      name: `${candidate.name}-${idx + 1}`,
      user: candidate.user,
      cpuPercent: cpu,
      memoryPercent: mem,
    });
  }

  return {
    timestamp: now.toISOString(),
    cpu: {
      usagePercent: cpuUsage,
      cores: baseline.cores,
      loadAverage: [loadAvg1, loadAvg5, loadAvg15],
    },
    memory: {
      totalGb: baseline.memoryGb,
      usedGb: memoryUsedGb,
      usagePercent: memoryUsagePercent,
    },
    storage: {
      totalTb: baseline.storageTb,
      usedTb: storageUsedTb,
      iops: storageIops,
    },
    network: {
      inboundMbps,
      outboundMbps,
      packetLossPercent: packetLoss,
    },
    gpus,
    processes,
  };
}
