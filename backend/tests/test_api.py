from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_questions_public():
    r = client.get("/api/questions")
    assert r.status_code == 200
    assert len(r.json()) == 5


def test_me_requires_token():
    assert client.get("/api/me").status_code == 401


def test_me_rejects_garbage_token():
    r = client.get("/api/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


def test_cors_allows_localhost_3000():
    r = client.options(
        "/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"},
    )
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
