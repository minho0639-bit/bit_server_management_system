# Single-Server Monitoring System

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

### 3. 대시보드 확인
- 백엔드 실행 후 브라우저에서 `http://<host>:8000/dashboard/` 에 접속하면 최신 메트릭과 수집된 로그를 확인할 수 있습니다.

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