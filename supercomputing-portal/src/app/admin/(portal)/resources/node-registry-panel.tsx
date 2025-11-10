"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  RefreshCcw,
  Server,
  Tag,
} from "lucide-react";

type NodeStatus = "healthy" | "warning" | "critical";

interface NodeTelemetry {
  status: NodeStatus;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number | null;
  latencyMs: number;
  lastHeartbeat: string;
}

interface RegisteredNode {
  id: string;
  name: string;
  ipAddress: string;
  role: string;
  labels: string[];
  createdAt: string;
  telemetry: NodeTelemetry;
}

const STATUS_BADGE: Record<NodeStatus, string> = {
  healthy: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/40",
  warning: "bg-amber-500/15 text-amber-200 border border-amber-500/40",
  critical: "bg-rose-500/15 text-rose-200 border border-rose-500/40",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  healthy: "정상",
  warning: "주의",
  critical: "위험",
};

function formatRelative(isoDate: string) {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}초 전`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay}일 전`;
}

function formatLabels(labels: string[]) {
  if (labels.length === 0) {
    return "레이블 없음";
  }
  return labels.join(", ");
}

export default function NodeRegistryPanel() {
  const [nodes, setNodes] = useState<RegisteredNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    ipAddress: "",
    role: "",
    labels: "",
  });

  const totalByStatus = useMemo(() => {
    return nodes.reduce(
      (acc, node) => {
        acc[node.telemetry.status] += 1;
        return acc;
      },
      { healthy: 0, warning: 0, critical: 0 } as Record<NodeStatus, number>,
    );
  }, [nodes]);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/nodes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("노드 데이터를 불러오지 못했습니다.");
      }
      const data = (await response.json()) as { nodes?: RegisteredNode[] };
      setNodes(data.nodes ?? []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "노드 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler = () => {
      fetchNodes();
    };
    window.addEventListener("admin-nodes:updated", handler);
    return () => {
      window.removeEventListener("admin-nodes:updated", handler);
    };
  }, [fetchNodes]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setSuccess(null);
      setSubmitting(true);

      const payload = {
        name: formState.name.trim(),
        ipAddress: formState.ipAddress.trim(),
        role: formState.role.trim(),
        labels: formState.labels
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
      };

      try {
        const response = await fetch("/api/admin/nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as {
          error?: string;
          node?: RegisteredNode;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "노드 등록에 실패했습니다.");
        }

        setSuccess(`${result.node?.name ?? payload.name} 노드가 등록되었습니다.`);
        setFormState({ name: "", ipAddress: "", role: "", labels: "" });

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("admin-nodes:updated"));
        } else {
          fetchNodes();
        }
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "노드 등록에 실패했습니다.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [fetchNodes, formState],
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="xl:w-[320px] xl:flex-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                노드 등록
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                모니터링 대상 추가
              </h3>
            </div>
            <Server className="h-5 w-5 text-sky-300" />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-sm text-slate-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                노드 이름
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="예) gpu-node-a01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                IP 주소
              </label>
              <input
                type="text"
                required
                value={formState.ipAddress}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    ipAddress: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="192.168.20.34"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                역할 / 영역
              </label>
              <input
                type="text"
                required
                value={formState.role}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, role: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="GPU Cluster / Storage / Control Plane"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
                레이블 (쉼표 구분)
              </label>
              <input
                type="text"
                value={formState.labels}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, labels: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                placeholder="zone-a, gpu, maintenance"
              />
            </div>
            {error && (
              <p className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
            {success && (
              <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4" /> {success}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? "등록 중..." : "노드 등록"}
            </button>
          </form>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                등록 현황
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                실시간 노드 상태
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                onClick={() => fetchNodes()}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 transition hover:border-sky-300 hover:text-sky-200"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                새로고침
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 text-xs text-slate-300 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                <Activity className="h-3.5 w-3.5 text-sky-200" />
                전체 노드
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{nodes.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">정상</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-200">
                {totalByStatus.healthy}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">주의 / 위험</p>
              <p className="mt-3 text-2xl font-semibold text-amber-200">
                {totalByStatus.warning + totalByStatus.critical}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/5 text-left text-xs text-slate-200">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-4 py-3">노드</th>
                  <th className="px-4 py-3">IP / 영역</th>
                  <th className="px-4 py-3">레이블</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">지표</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      노드 정보를 불러오는 중입니다...
                    </td>
                  </tr>
                ) : nodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      아직 등록된 노드가 없습니다. 왼쪽 폼에서 노드를 추가하세요.
                    </td>
                  </tr>
                ) : (
                  nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-white/5">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{node.name}</p>
                        <p className="text-[11px] text-slate-400">
                          등록 {formatRelative(node.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-sm text-sky-200">{node.ipAddress}</p>
                        <p className="text-[11px] text-slate-400">{node.role}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="flex items-center gap-2 text-[11px] text-slate-300">
                          <Tag className="h-3 w-3 text-slate-400" />
                          {formatLabels(node.labels)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_BADGE[node.telemetry.status]}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-current" />
                          {STATUS_LABEL[node.telemetry.status]}
                        </span>
                        <p className="mt-2 text-[10px] text-slate-400">
                          최근 heartbeat {formatRelative(node.telemetry.lastHeartbeat)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid gap-1 text-[11px] text-slate-300">
                          <p>CPU {node.telemetry.cpuUsage}%</p>
                          <p>Memory {node.telemetry.memoryUsage}%</p>
                          {node.telemetry.gpuUsage !== null && (
                            <p>GPU {node.telemetry.gpuUsage}%</p>
                          )}
                          <p>Latency {node.telemetry.latencyMs}ms</p>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
