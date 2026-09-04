from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["questions"])

# FE의 하드코딩된 질문 목록과 동일. DB 연결 전까지는 seed 데이터로 제공.
SEED_QUESTIONS = [
    {"id": 1, "order": 1, "text": "1분간 자기소개를 해주세요."},
    {"id": 2, "order": 2, "text": "이 직무에 지원한 동기를 말씀해주세요."},
    {"id": 3, "order": 3, "text": "본인의 강점과 약점은 무엇인가요?"},
    {"id": 4, "order": 4, "text": "협업 중 갈등을 해결했던 경험이 있나요?"},
    {"id": 5, "order": 5, "text": "마지막으로 하고 싶은 말씀이 있다면 해주세요."},
]


@router.get("/questions")
def list_questions() -> list[dict]:
    return SEED_QUESTIONS
