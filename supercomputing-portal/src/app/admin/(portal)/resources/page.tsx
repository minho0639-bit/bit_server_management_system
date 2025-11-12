import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardCheck,
  Layers,
  PackagePlus,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";
import NodeRegistryPanel from "./node-registry-panel";

const nodeSummary = [
  {
    title: "GPU 존",
    ready: 120,
    capacity: 142,
    temp: "29°C",
    utilization: 84,
  },
  {
    title: "CPU 존",
    ready: 320,
    capacity: 368,
    temp: "25°C",
    utilization: 71,
  },
  {
    title: "스토리지 존",
    ready: 88,
    capacity: 102,
    temp: "27°C",
    utilization: 63,
  },
];

const containerProfiles = [
  {
    name: "quantumflow/hpc-gpu:1.4",
    type: "GPU",
    quota: "GPU 4 · CPU 64 · RAM 256GB",
    runtime: "K8s + Slurm",
    version: "1.4.2",
    digest: "sha256:93fd...a21c",
    lastScan: "오늘 09:20",
    security: "pass" as const,
    registry: "registry.quantumflow.kr",
    tag: "stable",
    changelog: "CUDA 12.2 · NCCL 2.18 · cuDNN 9.1",
  },
  {
    name: "quantumflow/data-pipeline:2.1",
    type: "CPU",
    quota: "CPU 128 · RAM 512GB",
    runtime: "K8s + Airflow",
    version: "2.1.5",
    digest: "sha256:8a7c...e4b2",
    lastScan: "어제 22:15",
    security: "pass" as const,
    registry: "registry.quantumflow.kr",
    tag: "canary",
    changelog: "Apache Airflow 2.9 · Spark 3.5 패치",
  },
  {
    name: "quantumflow/analysis-lite:1.8",
    type: "CPU",
    quota: "CPU 48 · RAM 192GB",
    runtime: "K8s + Jupyter",
    version: "1.8.1",
    digest: "sha256:5b61...9ef0",
    lastScan: "3일 전",
    security: "warn" as const,
    registry: "registry.quantumflow.kr",
    tag: "lts",
    changelog: "RStudio 추가 · JupyterLab 4.1",
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
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300"
              >
                컨테이너 할당
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400">
                노드 증설 계획
                <ServerCog className="h-3.5 w-3.5" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-100">
                이미지 카탈로그
                <Layers className="h-3.5 w-3.5" />
              </button>
            </>
          }
        />

          <div className="flex-1 space-y-10 px-6 py-8">
            <NodeRegistryPanel />

            <section className="flex flex-col gap-6 rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/10 via-slate-950/60 to-slate-950/90 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">
                  신규 워크플로
                </p>
                <h3 className="text-xl font-semibold text-white">
                  사용자 신청을 컨테이너로 즉시 배포하세요
                </h3>
                <p className="text-sm text-slate-200">
                  승인된 신청을 선택하고 권한 있는 노드에 컨테이너 이미지를 할당합니다. 배포 상태와 리소스 사용량을 한 화면에서 추적할 수 있습니다.
                </p>
                <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-widest text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1">
                    <Layers className="h-3.5 w-3.5 text-emerald-200" />
                    자동 네임스페이스 구성
                  </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1">
                      <ServerCog className="h-3.5 w-3.5 text-emerald-200" />
                      GPU/CPU 할당 검증
                    </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1">
                    <ServerCog className="h-3.5 w-3.5 text-emerald-200" />
                    상태 전환 추적
                  </span>
                </div>
              </div>
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-400 px-5 py-3 text-xs font-semibold text-slate-950 shadow-[0_15px_35px_rgba(52,211,153,0.35)] transition hover:bg-emerald-300 md:self-center"
              >
                컨테이너 할당 메뉴 열기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </section>

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-2 xl:grid-cols-4">
            {nodeSummary.map((node) => (
              <div key={node.title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">{node.title}</p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    정상 {node.ready}/{node.capacity}
                  </p>
                <div className="mt-4 space-y-3 text-xs text-slate-300">
                    <p>평균 온도 {node.temp}</p>
                  <div className="space-y-1">
                      <p>평균 사용률</p>
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

          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">
                  컨테이너 프로파일
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  운영 이미지 & 레지스트리
                </h3>
              </div>
              <Link
                href="/admin/resources/allocations"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-300 hover:text-emerald-100"
              >
                배포 현황 보기
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {containerProfiles.map((profile) => {
                const isSecure = profile.security === "pass";
                return (
                  <div
                    key={profile.name}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                          {profile.type}
                        </p>
                        <h4 className="mt-2 text-lg font-semibold text-white">
                          {profile.name}
                        </h4>
                        <p className="mt-1 text-xs text-slate-400">
                          런타임: {profile.runtime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                          v{profile.version}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${
                            isSecure
                              ? "bg-emerald-400/15 text-emerald-200"
                              : "bg-rose-400/15 text-rose-200"
                          }`}
                        >
                          {isSecure ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {isSecure ? "보안 통과" : "검토 필요"}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-300">
                      요구 리소스 {profile.quota}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {profile.changelog}
                    </p>

                    <div className="mt-4 grid gap-2 text-[11px] text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>체크섬</span>
                        <span className="font-mono text-slate-200">
                          {profile.digest}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>최근 스캔</span>
                        <span>{profile.lastScan}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>레지스트리</span>
                        <span>{profile.registry}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>태그</span>
                        <span>{profile.tag}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                      <button className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sky-100 transition hover:bg-white/20">
                        이미지 배포
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-slate-200 transition hover:border-sky-200 hover:text-sky-100">
                        스캔 보고서
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: PackagePlus,
                  title: "신규 이미지 등록",
                  description:
                    "CI/CD 파이프라인에서 푸시된 태그를 승인하고 자동 서명합니다.",
                  action: "등록 가이드",
                },
                {
                  icon: ClipboardCheck,
                  title: "취약점 스캔",
                  description:
                    "Trivy/Grype 연동으로 CVE 리포트를 생성하고 정책을 업데이트하세요.",
                  action: "스캔 수행",
                },
                {
                  icon: Layers,
                  title: "런타임 템플릿",
                  description:
                    "워크로드별 Helm 차트·K8s 매니페스트를 버전별로 관리합니다.",
                  action: "템플릿 관리",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <item.icon className="h-4 w-4 text-sky-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <button className="mt-auto inline-flex w-max items-center gap-2 text-xs font-semibold text-sky-100 transition hover:text-sky-50">
                    {item.action}
                    <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
      </div>
    </div>
  );
}

