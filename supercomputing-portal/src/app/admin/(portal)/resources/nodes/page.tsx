import Link from "next/link";
import {
  ActivitySquare,
  ArrowLeft,
  Cpu,
  Gauge,
  Hexagon,
  Network,
  Server,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import { listStoredNodes } from "@/lib/admin-node-store";
import { createNodeTelemetry } from "@/lib/admin-node-telemetry";

type ClusterZoneKey = "gpu" | "cpu" | "storage";

const CLUSTER_ZONE_META: Record<
  ClusterZoneKey,
  { label: string; description: string; accent: string }
> = {
  gpu: {
    label: "GPU 존",
    description: "고성능 연산 노드",
    accent: "from-sky-400 via-cyan-300 to-emerald-300",
  },
  cpu: {
    label: "CPU 존",
    description: "범용 컴퓨팅 노드",
    accent: "from-emerald-400 via-teal-300 to-sky-300",
  },
  storage: {
    label: "스토리지 존",
    description: "고속 데이터 노드",
    accent: "from-amber-400 via-orange-300 to-rose-300",
  },
};

const STATUS_STYLE: Record<
  "healthy" | "warning" | "critical",
  string
> = {
  healthy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  critical: "border-rose-500/40 bg-rose-500/10 text-rose-100",
};

const STATUS_LABEL: Record<"healthy" | "warning" | "critical", string> = {
  healthy: "정상",
  warning: "주의",
  critical: "위험",
};

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

export const dynamic = "force-dynamic";

export default async function NodesOverviewPage() {
  const nodes = await listStoredNodes();
  const telemetryByNode = new Map(
    nodes.map((node) => [node.id, createNodeTelemetry(node)]),
  );

  const zoneGroups = (Object.keys(CLUSTER_ZONE_META) as ClusterZoneKey[]).map(
    (key) => {
      const meta = CLUSTER_ZONE_META[key];
      const groupNodes = nodes.filter((node) =>
        node.labels.includes(meta.label),
      );
      return {
        key,
        meta,
        nodes: groupNodes,
      };
    },
  );

  const unassignedNodes = nodes.filter(
    (node) =>
      !Object.values(CLUSTER_ZONE_META).some((meta) =>
        node.labels.includes(meta.label),
      ),
  );

  const totalNodes = nodes.length;

  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="노드 상세"
        description="물리 노드별 상태를 확인하고 유지 보수 작업을 예약하세요."
        userName="이현수 관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <Link
            href="/admin/resources"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 자원 목록으로
          </Link>
        }
      />

      <div className="flex-1 space-y-8 px-6 py-8">
        <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-200">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
            <ActivitySquare className="h-3.5 w-3.5 text-sky-200" />
            총 등록 노드 {totalNodes}대
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
            <Network className="h-3.5 w-3.5 text-sky-200" />
            존 구성 {zoneGroups.filter((zone) => zone.nodes.length > 0).length} /{" "}
            {zoneGroups.length}
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
            <Server className="h-3.5 w-3.5 text-sky-200" />
            미할당 노드 {unassignedNodes.length}대
          </div>
        </section>

        {zoneGroups.map((group) => (
          <section
            key={group.key}
            className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200">
                  {group.meta.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {group.meta.description}
                </h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100">
                <span className="text-slate-400">
                  {group.nodes.length > 0
                    ? `${group.nodes.length}대 등록`
                    : "등록된 노드 없음"}
                </span>
              </span>
            </div>

            {group.nodes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/40 p-8 text-center text-sm text-slate-300">
                {group.meta.label}에 등록된 노드가 없습니다. 노드 레지스트리에서 해당 존을 선택해 할당하세요.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {group.nodes.map((node) => {
                  const telemetry = telemetryByNode.get(node.id);
                  const status = telemetry?.status ?? "healthy";
                  const gpuUsage =
                    telemetry?.gpuUsage !== null && telemetry?.gpuUsage !== undefined
                      ? telemetry.gpuUsage
                      : null;
                  return (
                    <div
                      key={node.id}
                      className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                            노드
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-white">
                            {node.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {node.ipAddress} · {node.role}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLE[status]}`}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-2">
                            <Cpu className="h-3.5 w-3.5 text-sky-200" />
                            CPU 사용률
                          </span>
                          <span className="font-semibold text-slate-100">
                            {telemetry?.cpuUsage ?? 0}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
                            style={{ width: `${telemetry?.cpuUsage ?? 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-2">
                            <Gauge className="h-3.5 w-3.5 text-sky-200" />
                            메모리 사용률
                          </span>
                          <span className="font-semibold text-slate-100">
                            {telemetry?.memoryUsage ?? 0}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300"
                            style={{ width: `${telemetry?.memoryUsage ?? 0}%` }}
                          />
                        </div>
                        {gpuUsage !== null ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-2">
                                <Hexagon className="h-3.5 w-3.5 text-sky-200" />
                                GPU 사용률
                              </span>
                              <span className="font-semibold text-slate-100">
                                {gpuUsage}%
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-purple-300 to-pink-300"
                                style={{ width: `${gpuUsage}%` }}
                              />
                            </div>
                          </>
                        ) : null}
                        <div className="mt-3">
                          <p className="text-[11px] text-slate-400">
                            존 레이블
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {node.labels.length === 0 ? (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                                레이블 없음
                              </span>
                            ) : (
                              node.labels.map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-300"
                                >
                                  {label}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>최근 하트비트</span>
                          <span>
                            {telemetry?.lastHeartbeat
                              ? formatRelativeTime(telemetry.lastHeartbeat)
                              : "정보 없음"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>등록</span>
                          <span>{formatRelativeTime(node.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}

        {unassignedNodes.length > 0 ? (
          <section className="space-y-6 rounded-3xl border border-dashed border-white/15 bg-slate-950/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  기타 노드
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  존 미할당 노드
                </h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100">
                {unassignedNodes.length}대
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {unassignedNodes.map((node) => {
                const telemetry = telemetryByNode.get(node.id);
                const status = telemetry?.status ?? "healthy";
                return (
                  <div
                    key={node.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                          노드
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          {node.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {node.ipAddress} · {node.role}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-sky-200" />
                          CPU 사용률
                        </span>
                        <span className="font-semibold text-slate-100">
                          {telemetry?.cpuUsage ?? 0}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
                          style={{ width: `${telemetry?.cpuUsage ?? 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>등록</span>
                        <span>{formatRelativeTime(node.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

