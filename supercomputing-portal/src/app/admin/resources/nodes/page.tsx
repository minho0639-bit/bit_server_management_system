import { ArrowLeft, Cpu, Flame, Hexagon, Network, Server } from "lucide-react";
import Link from "next/link";

import { PortalHeader } from "@/components/portal/portal-header";

const nodes = Array.from({ length: 24 }).map((_, idx) => ({
  name: `gpu-node-${idx.toString().padStart(2, "0")}`,
  status: idx % 7 === 3 ? "Warning" : "Ready",
  gpu: idx % 7 === 3 ? "H100" : "A100",
  temperature: `${28 + (idx % 5)}°C`,
  utilization: 60 + (idx % 6) * 6,
}));

export default function NodesOverviewPage() {
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
            <Flame className="h-3.5 w-3.5 text-sky-200" /> GPU 존 A · 64 노드
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
            <Cpu className="h-3.5 w-3.5 text-sky-200" /> 평균 사용률 83%
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200">
            <Network className="h-3.5 w-3.5 text-sky-200" /> 패브릭 상태 정상
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => (
            <div key={node.name} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">노드</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{node.name}</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                    node.status === "Warning" ? "bg-amber-400/20 text-amber-200" : "bg-emerald-400/20 text-emerald-200"
                  }`}
                >
                  {node.status}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-xs text-slate-300">
                <div className="inline-flex items-center gap-2"><Hexagon className="h-3.5 w-3.5 text-sky-200" /> GPU {node.gpu}</div>
                <div className="inline-flex items-center gap-2"><Server className="h-3.5 w-3.5 text-sky-200" /> 온도 {node.temperature}</div>
                <div className="inline-flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-sky-200" /> 사용률 {node.utilization}%
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200"
                    style={{ width: `${node.utilization}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

