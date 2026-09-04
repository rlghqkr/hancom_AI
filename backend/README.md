# SelfFit Backend (FastAPI)

## 실행

```bash
cd backend
cp .env.example .env   # 값 채우기
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

- 헬스체크: http://localhost:8000/health
- API 문서: http://localhost:8000/docs

## 테스트

```bash
uv run pytest
uv run ruff check .
```

## 인증

FE가 Supabase로 로그인해 받은 access token을 `Authorization: Bearer <token>` 으로 보내면,
백엔드는 Supabase JWKS(공개키)로 서명을 검증한다. 시크릿 불필요.
