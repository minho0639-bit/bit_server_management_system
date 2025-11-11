# BITWatch 서버모니터링 시스템

## 개요
- 단일 서버의 핵심 자원(CPU, 메모리, 디스크, 네트워크)을 추적하고, 시스템 로그(`/var/log/syslog`)와 하드웨어 이벤트(`ipmitool sel list`)를 수집하는 경량 모니터링 솔루션입니다.
- FastAPI 기반의 백엔드와 Python 에이전트, 그리고 기본 웹 대시보드로 구성되며 추후 다중 서버 통합을 염두에 둔 구조로 설계되었습니다.

## 디렉터리 구조
```
backend/
  app/
    main.py          # FastAPI 엔드포인트 정의
    database.py      # SQLite 초기화 및 헬퍼
    schemas.py       # Pydantic 스키마
    static/index.html# 내장 대시보드
  requirements.txt   # 백엔드 의존성
agent/
  agent.py           # 메트릭·로그 수집 에이전트
  requirements.txt   # 에이전트 의존성
```

## 빠른 시작
### 1. 백엔드 실행
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 에이전트 실행
```bash
cd agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python agent.py --backend-url http://127.0.0.1:8000
```

- `METRICS_INTERVAL`, `LOGS_INTERVAL`, `IPMI_INTERVAL` 환경 변수로 주기 조정이 가능합니다.
- `ipmitool` 명령이 없는 환경에서는 SEL 로그 전송이 자동으로 생략됩니다.

### 3. 자동화된 환경 구성 (선택)
```bash
./scripts/setup_envs.sh         # backend/.venv, agent/.venv 모두 설치
./scripts/setup_envs.sh agent   # 특정 컴포넌트만 설치
```
- `PYTHON` 환경 변수를 지정하면 다른 파이썬 인터프리터를 사용할 수 있습니다 (`PYTHON=python3.11 ./scripts/setup_envs.sh`).
- 이미 `.venv`가 존재하면 재사용하며, `requirements.txt`가 갱신된 경우만 패키지를 재설치합니다.

### 4. 대시보드 확인
- 백엔드 실행 후 브라우저에서 `http://<host>:8000/dashboard/` 에 접속하면 **BITWatch 서버모니터링 시스템** UI에서 최신 메트릭과 수집된 로그를 확인할 수 있습니다.

### 5. 권한 및 의존성
- `/var/log/syslog` 접근에는 루트 권한 혹은 `adm` 그룹 권한이 필요합니다. 권한이 부족하면 에이전트가 자동으로 경고를 출력하고 로그 수집을 건너뜁니다.
- `ipmitool sel list` 실행을 위해서는 `ipmitool` 바이너리가 설치되어 있고 BMC 접근 권한이 있어야 합니다. 명령 실행에 실패할 경우 에이전트 로그에 경고가 표시됩니다.

## 주요 API
- `POST /metrics` : CPU/메모리/디스크/네트워크 메트릭 수집
- `GET /metrics/recent?limit=50` : 최신 메트릭 조회
- `POST /logs/syslog` : syslog 라인 배치 업로드
- `GET /logs/syslog?limit=100` : 최신 syslog 조회
- `POST /logs/ipmi` : IPMI SEL 이벤트 업로드
- `GET /logs/ipmi?limit=100` : 최신 IPMI 이벤트 조회

## 향후 확장 아이디어
- 여러 서버에서 전송되는 데이터를 통합하는 중앙 허브 구성
- 알람 정책/알림 채널 연동(Slack, Email 등)
- 장기 보관을 위한 타임시리즈 데이터베이스 혹은 메시지 큐 도입