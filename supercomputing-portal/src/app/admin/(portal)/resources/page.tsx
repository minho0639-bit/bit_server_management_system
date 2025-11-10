import Link from "next/link";
import {
  ArrowUpRight,
  Cpu,
  DatabaseZap,
  HardHat,
  Hexagon,
  Layers,
  Network,
  Router,
  ServerCog,
  Settings2,
  Wifi,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import NodeRegistryPanel from "./node-registry-panel";

const nodeSummary = [
  {
    title: "GPU 존 A",
    ready: 62,
    capacity: 64,
    temp: "31°C",
    utilization: 89,
  },
  {
    title: "GPU 존 B",
    ready: 58,
    capacity: 64,
    temp: "29°C",
    utilization: 82,
  },
  {
    title: "CPU 존 C",
    ready: 208,
    capacity: 256,
    temp: "25°C",
    utilization: 71,
  },
  {
    title: "스토리지 존 D",
    ready: 40,
    capacity: 48,
    temp: "27°C",
    utilization: 63,
  },
];

const maintenanceTasks = [
  {
    title: "GPU node-3b 패치",
    window: "3월 14일(금) 02:00-03:00",
    owner: "SRE 팀",
  },
  {
    title: "스토리지 tier-2 확장",
    window: "3월 18일(화) 01:00-05:00",
    owner: "Storage 팀",
  },
  {
    title: "Fabric 스위치 펌웨어",
    window: "3월 22일(토) 00:30-02:00",
    owner: "Network 팀",
  },
];

const containerProfiles = [
  {
    name: "quantumflow/hpc-gpu:1.4",
    type: "GPU",
    quota: "GPU 4 · CPU 64 · RAM 256GB",
    runtime: "K8s + Slurm",
  },
  {
    name: "quantumflow/data-pipeline:2.1",
    type: "CPU",
    quota: "CPU 128 · RAM 512GB",
    runtime: "K8s + Airflow",
  },
  {
    name: "quantumflow/analysis-lite:1.8",
    type: "CPU",
    quota: "CPU 48 · RAM 192GB",
    runtime: "K8s + Jupyter",
  },
];

export default function AdminResourcesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="자원 & 노드"
        description="클러스터 노드 상태, 네트워크, 컨테이너 프로파일을 관리하고 스케일링 작업을 실행합니다."
        userName="이현수 관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400">
              노드 증설 계획
              <ServerCog className="h-3.5 w-3.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
              네트워크 토폴로지
              <Network className="h-3.5 w-3.5" />
            </button>
          </>
        }
        />

        <div className="flex-1 space-y-10 px-6 py-8">
          <NodeRegistryPanel />

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2 xl:grid-cols-4">
            {nodeSummary.map((node) => (
              <div key={node.title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">{node.title}</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Ready {node.ready}/{node.capacity}
                </p>
                <div className="mt-4 space-y-3 text-xs text-slate-300">
                  <p>온도 {node.temp}</p>
                  <div className="space-y-1">
                    <p>사용률</p>
                    <div className="h-2 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200"
                        style={{ width: `${node.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
                <Link
                  href="/admin/resources/nodes"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-200"
                >
                  상세 보기
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">리소스 풀</p>
                <h3 className="mt-2 text-xl font-semibold text-white">클러스터 리밸런싱</h3>
              </div>
              <Settings2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold text-white">GPU 풀</p>
                <p className="mt-2 text-xs text-slate-400">자원 재분배 필요 (그래픽 연구기관 요청 증가)</p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-2"><Hexagon className="h-3.5 w-3.5 text-sky-200" /> 사용률 88%</span>
                  <span className="inline-flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-sky-200" /> 예약 14건</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold text-white">CPU 풀</p>
                <p className="mt-2 text-xs text-slate-400">성능 안정적, 큐 대기 평균 4.2분</p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-sky-200" /> 사용률 75%</span>
                  <span className="inline-flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-sky-200" /> 예약 9건</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold text-white">스토리지 풀</p>
                <p className="mt-2 text-xs text-slate-400">증설 진행 중, tier-2 확장 예약</p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-2"><DatabaseZap className="h-3.5 w-3.5 text-sky-200" /> 사용률 61%</span>
                  <span className="inline-flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-sky-200" /> 예약 6건</span>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              GPU 풀 재분배 정책: 우선순위 조직(국가 연구, 공공 안전) 요청 시 자동 20% 확보. 정책 변경은 보안 승인 필요.
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200">유지 보수</p>
                <h3 className="text-lg font-semibold text-white">예정 작업</h3>
              </div>
              <HardHat className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              {maintenanceTasks.map((task) => (
                <div key={task.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm font-semibold text-white">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{task.window}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-sky-200">{task.owner}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/50 p-5 text-xs text-slate-200">
              유지 보수 기간 중 자동으로 사용자에게 알림이 발송되며, 영향을 받는 네임스페이스는 임시 노드로 이동합니다.
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">컨테이너 프로파일</p>
                <h3 className="mt-2 text-xl font-semibold text-white">운영 이미지</h3>
              </div>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-4 text-sm text-slate-200">
              {containerProfiles.map((profile) => (
                <div key={profile.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{profile.type}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{profile.name}</p>
                  <p className="mt-2 text-xs text-slate-400">{profile.quota}</p>
                  <p className="mt-1 text-xs text-slate-400">런타임: {profile.runtime}</p>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20">
                    업데이트 배포
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200">네트워크</p>
                <h3 className="mt-2 text-lg font-semibold text-white">패브릭 상태</h3>
              </div>
              <Router className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-3">
              {[
                { label: "InfiniBand Fabric", metric: "99.92%", detail: "에러 패킷 0.03%" },
                { label: "동기화 지연", metric: "1.8ms", detail: "SLA 3ms" },
                { label: "네임스페이스 라우팅", metric: "정상", detail: "최근 전환 12분 전" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.metric}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              패브릭 재구성 작업 시 affected namespace 리스트와 대체 경로가 자동으로 Slack 채널에 공유됩니다.
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Wifi className="h-5 w-5 text-sky-200" />
              <div>
                <p className="font-semibold text-white">API Gateway 상태</p>
                <p className="text-xs text-slate-400">요청 성공률 99.98%, 평균 지연 112ms</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

