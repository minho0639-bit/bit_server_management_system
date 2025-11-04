import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock4,
  CloudCog,
  Filter,
  FileText,
  PencilLine,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { PortalHeader } from "@/components/portal/portal-header";

const queueColumns = [
  {
    title: "승인 대기",
    description: "정책 검증 완료, 운영팀 승인 필요",
    color: "border-amber-400/40",
    tickets: [
      {
        id: "REQ-240313-02",
        project: "국가재난 AI 분석",
        owner: "국가재난대응본부",
        request: "GPU 12기 · CPU 240 vCore",
        submitted: "35분 전",
      },
      {
        id: "REQ-240312-08",
        project: "바이오 데이터 레이크",
        owner: "생명정보융합연구단",
        request: "CPU 960 vCore · 스토리지 80TB",
        submitted: "2시간 전",
      },
    ],
  },
  {
    title: "추가 정보 요청",
    description: "요청자에게 보완 자료 요청 진행",
    color: "border-sky-400/40",
    tickets: [
      {
        id: "REQ-240312-01",
        project: "위성 관측 실시간 분석",
        owner: "천문우주연구원",
        request: "GPU 8기 · CPU 320 vCore",
        submitted: "3시간 전",
      },
      {
        id: "REQ-240311-05",
        project: "스마트팜 자율 제어",
        owner: "농업기술연구원",
        request: "CPU 480 vCore",
        submitted: "어제 21:12",
      },
    ],
  },
  {
    title: "자동 할당 진행",
    description: "승인 완료, 네임스페이스 프로비저닝 중",
    color: "border-emerald-400/40",
    tickets: [
      {
        id: "REQ-240311-01",
        project: "AI 단백질 접힘",
        owner: "국가바이오데이터센터",
        request: "GPU 12기 · 스토리지 24TB",
        submitted: "어제 14:30",
      },
      {
        id: "REQ-240310-04",
        project: "스마트시티 시뮬레이션",
        owner: "도시연구소",
        request: "CPU 1,200 vCore",
        submitted: "어제 10:24",
      },
    ],
  },
];

const reviewChecklist = [
  "연구 목적 및 산·학·연 구분",
  "최근 6개월 사용량 및 초과 여부",
  "보안 등급 및 데이터 분류",
  "컨테이너 이미지 보안 스캔 결과",
  "추가 협력기관 공유 계획",
];

export default function AdminRequestsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PortalHeader
        title="신청 관리"
        description="대기 중인 자원 신청을 검토하고 정책에 따라 승인·반려·보완을 처리하세요."
        userName="이현수 관리자"
        userRole="운영 총괄"
        avatarLabel="AD"
        actions={
          <>
            <button className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_10px_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-400">
              큐 자동 정렬
              <CloudCog className="h-3.5 w-3.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-200 hover:text-sky-100">
              필터 설정
              <Filter className="h-3.5 w-3.5" />
            </button>
          </>
        }
      />

      <div className="flex-1 space-y-10 px-6 py-8">
        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 xl:grid-cols-3">
          {queueColumns.map((column) => (
            <div
              key={column.title}
              className={`flex flex-col gap-4 rounded-3xl border ${column.color} bg-slate-950/40 p-5`}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">{column.title}</p>
                <p className="text-sm text-slate-300/70">{column.description}</p>
              </div>
              <div className="space-y-4">
                {column.tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{ticket.project}</p>
                        <p className="text-xs text-slate-400">{ticket.owner}</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-200">
                        {ticket.submitted}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-300">{ticket.request}</p>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                      <Link
                        href={`/admin/requests/${ticket.id}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sky-100 transition hover:bg-white/20"
                      >
                        상세 검토
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-slate-300">
                        {ticket.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">검토 체크리스트</p>
                <h3 className="mt-2 text-xl font-semibold text-white">승인 전 확인 사항</h3>
              </div>
              <ClipboardList className="h-4 w-4 text-slate-400" />
            </div>
            <ul className="mt-6 space-y-4 text-sm text-slate-200">
              {reviewChecklist.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              고위험 데이터(개인정보, 방사선 등급)는 보안 담당자 이중 승인 필요. 요청 시 보안팀 협조를 호출하세요.
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900/70 to-slate-950/80 p-6 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200">보류 티켓</p>
                <h3 className="text-lg font-semibold text-white">사유 기록</h3>
              </div>
              <ShieldAlert className="h-4 w-4 text-slate-300" />
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">REQ-240310-04</p>
                <p className="mt-2 text-sm font-semibold text-white">보안 검토 대기</p>
                <p className="mt-1 text-xs text-slate-400">컨테이너 이미지 서명 검증 필요</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400">
                  <Clock4 className="h-3.5 w-3.5" /> SLA 1시간 남음
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">REQ-240309-02</p>
                <p className="mt-2 text-sm font-semibold text-white">정책 초과</p>
                <p className="mt-1 text-xs text-slate-400">GPU 32기 요청 - 조직 최대치 초과</p>
                <div className="mt-3 flex gap-2">
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-200">
                    <PencilLine className="h-3.5 w-3.5" /> 정책 예외 승인
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-200">
                    <Trash2 className="h-3.5 w-3.5" /> 반려 사유 작성
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950/50 p-5 text-xs text-slate-200">
              승인 후에는 자동으로 Kubernetes 네임스페이스와 자원 쿼터가 생성되며, 작업 로그는 90일간 보관됩니다.
              <Link
                href="/admin/resources"
                className="ml-2 inline-flex items-center gap-1 text-sky-200"
              >
                자원 현황 보기
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300/80">표준 양식</p>
              <h3 className="text-xl font-semibold text-white">신청 템플릿 관리</h3>
            </div>
            <div className="flex gap-3 text-xs font-semibold text-slate-200">
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition hover:border-sky-200 hover:text-sky-100">
                <FileText className="h-3.5 w-3.5" /> 템플릿 수정
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition hover:border-sky-200 hover:text-sky-100">
                <ClipboardList className="h-3.5 w-3.5" /> 검증 규칙 설정
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {["GPU 집중형", "대규모 HPC", "데이터 파이프라인", "고속 스토리지"].map((template) => (
              <div key={template} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">템플릿</p>
                <p className="mt-2 text-lg font-semibold text-white">{template}</p>
                <p className="mt-2 text-xs text-slate-400">검증 규칙 6건 · 자동 할당 스크립트 포함</p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:bg-white/20">
                  상세 보기
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

