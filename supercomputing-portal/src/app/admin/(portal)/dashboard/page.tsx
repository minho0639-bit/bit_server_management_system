import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Cpu,
  Gauge,
  HardDrive,
  ServerCog,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import NodeMonitorOverview from "./node-monitor-overview";

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

export default function AdminDashboardPage() {
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

