"use server";

import { promises as fs } from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-nodes.json");

export interface StoredNode {
  id: string;
  name: string;
  ipAddress: string;
  role: string;
  labels: string[];
  createdAt: string;
}

export interface NodeTelemetry {
  status: "healthy" | "warning" | "critical";
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number | null;
  latencyMs: number;
  lastHeartbeat: string;
}

export interface NodeRecord extends StoredNode {
  telemetry: NodeTelemetry;
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readRawNodes(): Promise<StoredNode[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as StoredNode[];
    }
  } catch (error) {
    console.error("[admin-node-store] Failed to parse node data:", error);
  }
  return [];
}

async function writeRawNodes(nodes: StoredNode[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(nodes, null, 2), "utf-8");
}

function normaliseLabels(labels?: unknown): string[] {
  if (!labels) return [];
  if (Array.isArray(labels)) {
    return labels
      .map((label) => (typeof label === "string" ? label.trim() : ""))
      .filter(Boolean);
  }
  if (typeof labels === "string") {
    return labels
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);
  }
  return [];
}

function isValidIp(ip: string) {
  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1?\d{1,2})(\.(25[0-5]|2[0-4]\d|1?\d{1,2})){3}$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}):){7}([0-9a-fA-F]{1,4})$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function listStoredNodes(): Promise<StoredNode[]> {
  return readRawNodes();
}

export async function registerNode(input: {
  name: string;
  ipAddress: string;
  role: string;
  labels?: string[] | string;
}): Promise<StoredNode> {
  const name = input.name?.trim();
  const ipAddress = input.ipAddress?.trim();
  const role = input.role?.trim();

  if (!name) {
    throw new Error("노드 이름을 입력하세요.");
  }
  if (!ipAddress) {
    throw new Error("IP 주소를 입력하세요.");
  }
  if (!isValidIp(ipAddress)) {
    throw new Error("올바른 IPv4 또는 IPv6 주소를 입력하세요.");
  }
  if (!role) {
    throw new Error("노드 역할을 입력하세요.");
  }

  const labels = normaliseLabels(input.labels);
  const nodes = await readRawNodes();

  if (nodes.some((node) => node.ipAddress === ipAddress)) {
    throw new Error("이미 등록된 IP 주소입니다.");
  }

  if (nodes.some((node) => node.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("이미 등록된 노드 이름입니다.");
  }

  const newNode: StoredNode = {
    id: randomUUID(),
    name,
    ipAddress,
    role,
    labels,
    createdAt: new Date().toISOString(),
  };

  nodes.push(newNode);
  await writeRawNodes(nodes);

  return newNode;
}

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

export async function listNodesWithTelemetry(): Promise<NodeRecord[]> {
  const nodes = await readRawNodes();
  return nodes.map((node) => ({
    ...node,
    telemetry: createNodeTelemetry(node),
  }));
}
