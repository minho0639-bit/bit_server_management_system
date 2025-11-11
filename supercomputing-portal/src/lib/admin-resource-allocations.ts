import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { listStoredNodes } from "./admin-node-store";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "admin-resource-allocations.json");

export type ResourceRequestStatus =
  | "pending"
  | "allocating"
  | "fulfilled"
  | "archived";

export type ContainerAllocationStatus =
  | "deploying"
  | "running"
  | "failed"
  | "terminated";

export interface ResourceRequirements {
  gpuCount: number;
  cpuCores: number;
  memoryGb: number;
  storageTb: number;
}

export interface ResourceRequest {
  id: string;
  project: string;
  owner: string;
  organisation: string;
  requestedAt: string;
  deadline?: string;
  status: ResourceRequestStatus;
  summary: string;
  preferredRuntime: string;
  preferredImage: string;
  tags: string[];
  requirements: ResourceRequirements;
  reviewerNotes?: string;
}

export interface ContainerAllocation {
  id: string;
  requestId: string;
  nodeId: string;
  namespace: string;
  containerImage: string;
  runtime: string;
  version: string;
  cpuCores: number;
  gpuCount: number;
  memoryGb: number;
  storageGb: number;
  status: ContainerAllocationStatus;
  createdAt: string;
  assignedBy: string;
  notes?: string;
}

type AllocationStore = {
  requests: ResourceRequest[];
  allocations: ContainerAllocation[];
};

const defaultStore: AllocationStore = {
  requests: [
    {
      id: "REQ-240313-02",
      project: "국가재난 AI 분석",
      owner: "김태윤 수석 연구원",
      organisation: "국가재난대응본부",
      requestedAt: "2025-03-13T02:30:00.000Z",
      deadline: "2025-03-20T00:00:00.000Z",
      status: "pending",
      summary:
        "재난 예측 모델링을 위한 긴급 GPU 클러스터 확장. 48시간 내 추론 파이프라인을 배포해야 함.",
      preferredRuntime: "Kubernetes + Slurm",
      preferredImage: "quantumflow/hpc-gpu:1.4",
      tags: ["GPU", "긴급", "국가사업"],
      requirements: {
        gpuCount: 12,
        cpuCores: 240,
        memoryGb: 512,
        storageTb: 24,
      },
      reviewerNotes:
        "보안 등급 2, 컨테이너 이미지 서명 확인 완료. 백업 노드: GPU 존 B.",
    },
    {
      id: "REQ-240312-08",
      project: "바이오 데이터 레이크",
      owner: "이윤지 책임 연구원",
      organisation: "생명정보융합연구단",
      requestedAt: "2025-03-12T05:45:00.000Z",
      status: "pending",
      summary:
        "유전체 데이터 병렬 처리 워크로드. CPU 자원 최적화와 고속 스토리지 연동 필요.",
      preferredRuntime: "Kubernetes + Airflow",
      preferredImage: "quantumflow/data-pipeline:2.1",
      tags: ["CPU", "대용량"],
      requirements: {
        gpuCount: 0,
        cpuCores: 960,
        memoryGb: 2048,
        storageTb: 80,
      },
      reviewerNotes:
        "데이터 주권 규정 준수 필수. 네임스페이스는 `bio-datalake` 권장.",
    },
    {
      id: "REQ-240311-01",
      project: "AI 단백질 접힘",
      owner: "박지훈 박사",
      organisation: "국가바이오데이터센터",
      requestedAt: "2025-03-11T01:10:00.000Z",
      status: "pending",
      summary:
        "AlphaFold 계열 시뮬레이션 배치. GPU 메모리 80GB 이상 필요, 노드 간 NVLink 요구.",
      preferredRuntime: "Kubernetes + Slurm",
      preferredImage: "quantumflow/hpc-gpu:1.4",
      tags: ["GPU", "바이오"],
      requirements: {
        gpuCount: 12,
        cpuCores: 320,
        memoryGb: 768,
        storageTb: 10,
      },
      reviewerNotes:
        "NVLink 노드 우선 할당. 컨테이너 환경 변수 파일 업로드 완료.",
    },
    {
      id: "REQ-240310-04",
      project: "스마트시티 시뮬레이션",
      owner: "장서연 연구위원",
      organisation: "도시연구소",
      requestedAt: "2025-03-10T04:40:00.000Z",
      status: "pending",
      summary:
        "대규모 CPU 기반 에이전트 시뮬레이션. 고밀도 CPU 노드 3000 vCore 이상 필요.",
      preferredRuntime: "Kubernetes + Custom Scheduler",
      preferredImage: "quantumflow/urban-sim:1.2",
      tags: ["CPU", "시뮬레이션"],
      requirements: {
        gpuCount: 0,
        cpuCores: 1200,
        memoryGb: 3072,
        storageTb: 12,
      },
    },
  ],
  allocations: [],
};

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultStore, null, 2),
      "utf-8",
    );
  }
}

async function readStore(): Promise<AllocationStore> {
  await ensureStore();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as AllocationStore;
    if (
      parsed &&
      Array.isArray(parsed.requests) &&
      Array.isArray(parsed.allocations)
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("[allocations] 데이터를 읽는 중 문제가 발생했습니다:", error);
  }
  return { ...defaultStore };
}

async function writeStore(store: AllocationStore) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function computeRequestStatus(
  request: ResourceRequest,
  allocations: ContainerAllocation[],
): ResourceRequestStatus {
  const related = allocations.filter(
    (allocation) => allocation.requestId === request.id,
  );

  if (related.length === 0) {
    return "pending";
  }

  if (related.every((entry) => entry.status === "terminated")) {
    return "archived";
  }

  if (related.some((entry) => entry.status === "running")) {
    return "fulfilled";
  }

  if (related.some((entry) => entry.status === "failed")) {
    return "allocating";
  }

  return "allocating";
}

export async function listResourceRequests(): Promise<ResourceRequest[]> {
  const store = await readStore();
  return store.requests.map((request) => ({
    ...request,
    status: computeRequestStatus(request, store.allocations),
  }));
}

export async function listContainerAllocations(): Promise<ContainerAllocation[]> {
  const store = await readStore();
  return store.allocations;
}

export async function getResourceRequest(
  requestId: string,
): Promise<ResourceRequest | null> {
  const store = await readStore();
  const request = store.requests.find((entry) => entry.id === requestId);
  if (!request) {
    return null;
  }
  return {
    ...request,
    status: computeRequestStatus(request, store.allocations),
  };
}

export async function createContainerAllocation(input: {
  requestId: string;
  nodeId: string;
  namespace: string;
  containerImage: string;
  runtime: string;
  version: string;
  cpuCores: number;
  gpuCount: number;
  memoryGb: number;
  storageGb: number;
  assignedBy: string;
  notes?: string;
}): Promise<{ allocation: ContainerAllocation; request: ResourceRequest }> {
  const {
    requestId,
    nodeId,
    namespace,
    containerImage,
    runtime,
    version,
    cpuCores,
    gpuCount,
    memoryGb,
    storageGb,
    assignedBy,
    notes,
  } = input;

  if (!requestId) {
    throw new Error("요청 ID가 필요합니다.");
  }
  if (!nodeId) {
    throw new Error("할당할 노드를 선택하세요.");
  }
  if (!namespace) {
    throw new Error("네임스페이스를 입력하세요.");
  }
  if (!containerImage) {
    throw new Error("컨테이너 이미지를 입력하세요.");
  }
  if (!runtime) {
    throw new Error("런타임을 입력하세요.");
  }
  if (!version) {
    throw new Error("배포 버전을 입력하세요.");
  }
  if (!assignedBy) {
    throw new Error("배포 담당자를 입력하세요.");
  }

  const numericFields = [
    ["cpuCores", cpuCores],
    ["gpuCount", gpuCount],
    ["memoryGb", memoryGb],
    ["storageGb", storageGb],
  ] as const;

  for (const [label, value] of numericFields) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label} 값이 올바르지 않습니다.`);
    }
  }

  const store = await readStore();
  const requestIndex = store.requests.findIndex(
    (entry) => entry.id === requestId,
  );
  if (requestIndex === -1) {
    throw new Error("해당 신청을 찾을 수 없습니다.");
  }

  const nodes = await listStoredNodes();
  if (!nodes.some((node) => node.id === nodeId)) {
    throw new Error("선택한 노드를 찾을 수 없습니다. 먼저 노드를 등록하세요.");
  }

  const allocation: ContainerAllocation = {
    id: randomUUID(),
    requestId,
    nodeId,
    namespace: namespace.trim(),
    containerImage: containerImage.trim(),
    runtime: runtime.trim(),
    version: version.trim(),
    cpuCores,
    gpuCount,
    memoryGb,
    storageGb,
    status: "deploying",
    createdAt: new Date().toISOString(),
    assignedBy: assignedBy.trim(),
    notes: notes?.trim() || undefined,
  };

  store.allocations.push(allocation);
  store.requests[requestIndex] = {
    ...store.requests[requestIndex],
    status: computeRequestStatus(store.requests[requestIndex], store.allocations),
  };

  await writeStore(store);

  return {
    allocation,
    request: {
      ...store.requests[requestIndex],
      status: computeRequestStatus(
        store.requests[requestIndex],
        store.allocations,
      ),
    },
  };
}

export async function updateContainerAllocationStatus(input: {
  allocationId: string;
  status: ContainerAllocationStatus;
}): Promise<ContainerAllocation> {
  const { allocationId, status } = input;
  if (!allocationId) {
    throw new Error("할당 ID가 필요합니다.");
  }
  if (!status) {
    throw new Error("상태 값을 입력하세요.");
  }

  const store = await readStore();
  const index = store.allocations.findIndex(
    (entry) => entry.id === allocationId,
  );
  if (index === -1) {
    throw new Error("해당 할당 레코드를 찾을 수 없습니다.");
  }

  store.allocations[index] = {
    ...store.allocations[index],
    status,
  };

  const requestIndex = store.requests.findIndex(
    (entry) => entry.id === store.allocations[index].requestId,
  );

  if (requestIndex !== -1) {
    store.requests[requestIndex] = {
      ...store.requests[requestIndex],
      status: computeRequestStatus(
        store.requests[requestIndex],
        store.allocations,
      ),
    };
  }

  await writeStore(store);

  return store.allocations[index];
}

export async function getAllocationOverview(): Promise<{
  requests: ResourceRequest[];
  allocations: ContainerAllocation[];
}> {
  const store = await readStore();
  const requests = store.requests.map((request) => ({
    ...request,
    status: computeRequestStatus(request, store.allocations),
  }));

  return {
    requests,
    allocations: store.allocations,
  };
}

