import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CircleCheckBig,
  Cpu,
  Gauge,
  HardDrive,
  Loader2,
  Server,
  ServerCog,
  TriangleAlert,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { getAllocationOverview } from "@/lib/admin-resource-allocations";
import { listStoredNodes } from "@/lib/admin-node-store";
import NodeMonitorOverview from "./node-monitor-overview";

const ALLOCATION_STATUS_STYLE = {
  deploying: "border-sky-400/40 bg-sky-500/10 text-sky-100",
  running: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  failed: "border-rose-400/40 bg-rose-500/10 text-rose-100",
  terminated: "border-slate-400/40 bg-slate-500/10 text-slate-100",
} as const;

const ALLOCATION_STATUS_LABEL = {
  deploying: "배포 중",
  running: "실행 중",
  failed: "실패",
  terminated: "종료",
} as const;

const RESOURCE_CAPACITY = {
  cpuCores: 4000,
  gpuCount: 256,
  memoryGb: 16384,
  storageGb: 32768,
};

const opsMetrics = [
  {
    title: "GPU 클러스터",
    value: "92%",
    sub: "노드 184/200 활성",
    status: "주의",
    accent: "from-orange-400/40 via-amber-300/30 to-transparent",
    icon: Gauge,
  },
  {
    title: "CPU 클러스터",
    value: "78%",
    sub: "노드 420/512 활성",
    status: "정상",
    accent: "from-emerald-400/40 via-teal-300/30 to-transparent",
    icon: Cpu,
  },
  {
    title: "스토리지",
    value: "65%",
    sub: "2.3PB / 3.6PB",
    status: "정상",
    accent: "from-sky-400/40 via-cyan-300/30 to-transparent",
    icon: HardDrive,
  },
  {
    title: "대기 요청",
    value: "5건",
    sub: "SLA 4시간 내 처리",
    status: "긴급",
    accent: "from-rose-400/40 via-pink-300/30 to-transparent",
    icon: AlertTriangle,
  },
];

const pendingRequests = [
  {
    id: "REQ-240313-02",
    project: "국가재난 AI 분석",
    priority: "HIGH",
    request: "GPU 12, CPU 240",
    submitted: "35분 전",
  },
  {
    id: "REQ-240312-08",
    project: "바이오 데이터 레이크",
    priority: "MEDIUM",
    request: "CPU 960, 스토리지 80TB",
    submitted: "2시간 전",
  },
  {
    id: "REQ-240312-01",
    project: "위성 관측 실시간 분석",
    priority: "HIGH",
    request: "GPU 8, CPU 320",
    submitted: "3시간 전",
  },
];

const recentIncidents = [
  {
    title: "GPU-Cluster zone-a 노드 불안정",
    time: "18분 전",
    status: "조치 완료",
  },
  {
    title: "스토리지 tier-2 대역폭 급증",
    time: "1시간 전",
    status: "모니터링",
  },
  {
    title: "Kubernetes API latency 경보",
    time: "어제 23:40",
    status: "해결",
  },
];

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}일 전`;
}

export default async function AdminDashboardPage() {
  const [{ requests, allocations }, nodes] = await Promise.all([
    getAllocationOverview(),
    listStoredNodes(),
  ]);

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const requestById = new Map(requests.map((request) => [request.id, request]));

  const allocationCounts = allocations.reduce(
    (acc, allocation) => {
      acc[allocation.status] += 1;
      return acc;
    },
    {
      deploying: 0,
      running: 0,
      failed: 0,
      terminated: 0,
    },
  );

  const recentAllocations = allocations
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const totalActiveNodes = new Set(
    allocations
      .filter((allocation) => allocation.status === "running")
      .map((allocation) => allocation.nodeId),
  ).size;

  const runningAllocations = allocations.filter(
    (allocation) => allocation.status === "running",
  );

  const resourceUsage = runningAllocations.reduce(
    (acc, allocation) => {
      acc.cpuCores += allocation.cpuCores;
      acc.gpuCount += allocation.gpuCount;
      acc.memoryGb += allocation.memoryGb;
      acc.storageGb += allocation.storageGb;
      return acc;
    },
    { cpuCores: 0, gpuCount: 0, memoryGb: 0, storageGb: 0 },
  );

  const resourceMetrics = [
    {
      id: "cpu",
      label: "CPU 사용량",
      value: resourceUsage.cpuCores,
      capacity: RESOURCE_CAPACITY.cpuCores,
      unit: "vCore",
    },
    {
      id: "gpu",
      label: "GPU 사용량",
      value: resourceUsage.gpuCount,
      capacity: RESOURCE_CAPACITY.gpuCount,
      unit: "GPU",
    },
    {
      id: "memory",
      label: "메모리 사용량",
      value: resourceUsage.memoryGb,
      capacity: RESOURCE_CAPACITY.memoryGb,
      unit: "GB",
    },
    {
      id: "storage",
      label: "스토리지 사용량",
      value: resourceUsage.storageGb,
      capacity: RESOURCE_CAPACITY.storageGb,
      unit: "GB",
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="운영 대시보드"
        description="슈퍼컴퓨팅 클러스터 상태, 경보, 승인 요청을 실시간으로 확인합니다."
        userName="이현수 관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <>
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition hover:bg-sky-400"
            >
              대기 요청 검토
              <ServerCog className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
            >
              일일 리포트 보기
              <BarChart3 className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
          <section className="grid gap-6 xl:grid-cols-4">
            {opsMetrics.map((metric) => (
              <div
                key={metric.title}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div
                  className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${metric.accent}`}
                />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                      {metric.title}
                    </p>
                    <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-slate-100">
                    <metric.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-300/80">
                  <span>{metric.sub}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                      metric.status === "긴급"
                        ? "bg-rose-400/20 text-rose-200"
                        : metric.status === "주의"
                          ? "bg-amber-400/20 text-amber-200"
                          : "bg-emerald-400/20 text-emerald-200"
                    }`}
                  >
                    {metric.status}
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 xl:grid-cols-[minmax(0,_1.15fr)_minmax(0,_0.85fr)]">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-200">
                    컨테이너 워크로드
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    할당된 컨테이너 상태
                  </h2>
                </div>
                <Link
                  href="/admin/resources/allocations"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_12px_30px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300"
                >
                  상세 보기
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>실행 중</span>
                    <CircleCheckBig className="h-4 w-4 text-emerald-300" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-emerald-100">
                    {allocationCounts.running}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    활성 컨테이너 파드 · 노드 {totalActiveNodes}대
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>배포 중</span>
                    <Loader2 className="h-4 w-4 text-sky-300" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-sky-100">
                    {allocationCounts.deploying}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    파이프라인 진행 중 컨테이너
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>장애 발생</span>
                    <TriangleAlert className="h-4 w-4 text-rose-300" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-rose-200">
                    {allocationCounts.failed}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    확인 필요 · 자동 롤백 미적용
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>종료됨</span>
                    <Activity className="h-4 w-4 text-slate-300" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-slate-200">
                    {allocationCounts.terminated}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    완료 또는 수동 종료된 컨테이너
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-left text-xs text-slate-200">
                  <thead className="bg-slate-950/70 text-[11px] uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-4 py-3">컨테이너</th>
                      <th className="px-4 py-3">신청 / 노드</th>
                      <th className="px-4 py-3">리소스</th>
                      <th className="px-4 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {recentAllocations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-slate-400"
                        >
                          아직 생성된 컨테이너 할당이 없습니다.{" "}
                          <Link
                            href="/admin/resources/allocations"
                            className="text-sky-200 underline underline-offset-4"
                          >
                            컨테이너 할당 메뉴
                          </Link>{" "}
                          에서 첫 배포를 시작하세요.
                        </td>
                      </tr>
                    ) : (
                      recentAllocations.map((allocation) => {
                        const node = nodeById.get(allocation.nodeId);
                        const request = requestById.get(allocation.requestId);
                        return (
                          <tr key={allocation.id} className="hover:bg-white/5">
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-white">
                                {allocation.containerImage}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {allocation.namespace} · {allocation.runtime}
                              </p>
                              <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
                                {formatRelativeTime(allocation.createdAt)} ·{" "}
                                {allocation.version}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-[11px] text-slate-300">
                                <p className="font-semibold text-sky-100">
                                  {request?.project ?? "알 수 없는 신청"}
                                </p>
                                <p className="mt-1">
                                  신청 {allocation.requestId}
                                </p>
                              </div>
                              <div className="mt-2 text-[11px] text-slate-400">
                                <p>
                                  노드 {node?.name ?? "미등록"} ·{" "}
                                  {node?.role ?? "역할 미상"}
                                </p>
                                <p className="text-[10px]">
                                  {node
                                    ? node.labels.join(", ") || "레이블 없음"
                                    : "노드 정보 없음"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[11px] text-slate-300">
                              <p>CPU {allocation.cpuCores} vCore</p>
                              <p>GPU {allocation.gpuCount}</p>
                              <p>메모리 {allocation.memoryGb} GB</p>
                              <p>스토리지 {allocation.storageGb} GB</p>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${ALLOCATION_STATUS_STYLE[allocation.status]}`}
                              >
                                <Server className="h-3.5 w-3.5" />
                                {ALLOCATION_STATUS_LABEL[allocation.status]}
                              </span>
                              <p className="mt-2 text-[10px] text-slate-400">
                                담당 {allocation.assignedBy}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-200">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  상태 요약
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  컨테이너 파이프라인 상황판
                </h3>
              </div>
                <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    리소스 모니터링
                  </p>
                  <div className="grid gap-3">
                    {resourceMetrics.map((metric) => {
                      const percent =
                        metric.capacity > 0
                          ? Math.min(100, Math.round((metric.value / metric.capacity) * 100))
                          : 0;
                      return (
                        <div key={metric.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>{metric.label}</span>
                            <span className="font-semibold text-white">
                              {metric.value.toLocaleString()} /{" "}
                              {metric.capacity.toLocaleString()} {metric.unit}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            사용률 {percent}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              <div className="space-y-4 text-xs text-slate-300">
                {([
                  {
                    title: "배포 파이프라인",
                    value: allocationCounts.deploying,
                    description:
                      "CI/CD가 컨테이너 이미지를 노드에 배치 중입니다.",
                    accent: "from-sky-400 via-blue-400 to-emerald-400",
                  },
                  {
                    title: "실행 중 워크로드",
                    value: allocationCounts.running,
                    description:
                      "SLA 감시 대상. 지연 경보 발생 시 자동 알림.",
                    accent: "from-emerald-400 via-teal-400 to-cyan-300",
                  },
                  {
                    title: "장애/종료 기록",
                    value: allocationCounts.failed + allocationCounts.terminated,
                    description:
                      "최근 24시간 내 실패 또는 종료된 컨테이너 수.",
                    accent: "from-rose-400 via-orange-400 to-amber-300",
                  },
                ] as const).map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/80 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                        {item.title}
                      </p>
                      <span className="text-lg font-semibold text-white">
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full w-full bg-gradient-to-r ${item.accent}`}
                        style={{
                          opacity:
                            item.value === 0
                              ? 0.2
                              : Math.min(1, 0.25 + item.value / 10),
                        }}
                      />
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
              >
                컨테이너 워크플로 열기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_1.05fr)_minmax(0,_0.95fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  승인 요청
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">대기 중 워크로드</h2>
              </div>
              <Link
                href="/admin/requests"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
              >
                전체 보기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
              <table className="min-w-full divide-y divide-white/5 text-sm text-slate-200">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">요청 ID</th>
                    <th className="px-4 py-3 text-left">프로젝트</th>
                    <th className="px-4 py-3 text-left">요청 자원</th>
                    <th className="px-4 py-3 text-left">우선순위</th>
                    <th className="px-4 py-3 text-left">요청 시각</th>
                    <th className="px-4 py-3 text-left" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-white/5">
                      <td className="px-4 py-4 font-semibold text-white">{request.id}</td>
                      <td className="px-4 py-4">{request.project}</td>
                      <td className="px-4 py-4 text-sm text-slate-300">{request.request}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            request.priority === "HIGH"
                              ? "bg-rose-400/20 text-rose-200"
                              : request.priority === "MEDIUM"
                                ? "bg-amber-400/20 text-amber-200"
                                : "bg-emerald-400/20 text-emerald-200"
                          }`}
                        >
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">{request.submitted}</td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/admin/requests/${request.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20"
                        >
                          검토
                          <ServerCog className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                    실시간 경보
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">알림 피드</h3>
                </div>
                <BellRing className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-4 space-y-4">
                {recentIncidents.map((incident) => (
                  <div key={incident.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">{incident.title}</p>
                    <p className="mt-2 text-xs text-slate-400">{incident.time}</p>
                    <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-sky-200">
                      {incident.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">클러스터 지도</p>
            <h3 className="mt-2 text-lg font-semibold text-white">물리 노드 상태</h3>
            <div className="mt-6 grid grid-cols-6 gap-3 text-xs">
              {Array.from({ length: 36 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl border border-white/10 ${
                    idx % 12 === 4
                      ? "bg-rose-500/30"
                      : idx % 10 === 3
                        ? "bg-amber-400/30"
                        : "bg-emerald-400/25"
                  }`}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-400">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400/80" /> Ready</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400/80" /> Warning</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose-500/80" /> NotReady</span>
            </div>
          </div>
          <NodeMonitorOverview className="rounded-3xl border border-white/10 bg-white/5 p-6" />
        </section>
      </div>
    </div>
  );
}

