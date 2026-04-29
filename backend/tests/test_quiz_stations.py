"""
tests/test_quiz_stations.py — Tests for Quiz and Polling Station API
=====================================================================
Coverage:
  - GET  /api/quiz/questions   (count param, shuffle, no answer leakage)
  - POST /api/quiz/submit      (correct scoring, unknown IDs, edge cases)
  - GET  /api/stations         (full list, accessible filter)
  - GET  /api/stations/search  (match, no match, accessibility filter)

Run: pytest tests/ -v --cov=app --cov-report=term-missing
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

# ── Fixture ──────────────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    with TestClient(create_app()) as c:
        yield c

# ── Quiz: GET /api/quiz/questions ────────────────────────────

class TestGetQuizQuestions:
    def test_returns_200(self, client):
        r = client.get("/api/quiz/questions")
        assert r.status_code == 200

    def test_returns_eight_questions_by_default(self, client):
        r = client.get("/api/quiz/questions")
        assert len(r.json()) == 8

    def test_count_param_respected(self, client):
        r = client.get("/api/quiz/questions?count=3")
        assert len(r.json()) == 3

    def test_count_too_high_rejected(self, client):
        r = client.get("/api/quiz/questions?count=99")
        assert r.status_code == 422

    def test_count_zero_rejected(self, client):
        r = client.get("/api/quiz/questions?count=0")
        assert r.status_code == 422

    def test_answer_field_not_in_response(self, client):
        """Security: answer index must NEVER be returned to the client."""
        r = client.get("/api/quiz/questions")
        for q in r.json():
            assert "ans" not in q, "Answer index leaked to client!"
            assert "answer" not in q

    def test_each_question_has_required_fields(self, client):
        r = client.get("/api/quiz/questions")
        for q in r.json():
            assert "id"   in q
            assert "q"    in q
            assert "opts" in q

    def test_each_question_has_four_options(self, client):
        r = client.get("/api/quiz/questions")
        for q in r.json():
            assert len(q["opts"]) == 4, f"Question {q['id']} has {len(q['opts'])} options, expected 4"

    def test_question_ids_unique(self, client):
        r = client.get("/api/quiz/questions")
        ids = [q["id"] for q in r.json()]
        assert len(ids) == len(set(ids)), "Duplicate question IDs in response"


# ── Quiz: POST /api/quiz/submit ──────────────────────────────

class TestSubmitQuiz:
    def _get_questions(self, client):
        """Helper: fetch question IDs for building submissions."""
        return client.get("/api/quiz/questions?shuffle=false").json()

    def test_perfect_score(self, client):
        """Submit all correct answers (known from internal key)."""
        from app.routers.quiz import _QUIZ_QUESTIONS_INTERNAL
        answers = {q["id"]: q["ans"] for q in _QUIZ_QUESTIONS_INTERNAL}
        r = client.post("/api/quiz/submit", json={"answers": answers})
        assert r.status_code == 200
        body = r.json()
        assert body["score"] == 8
        assert body["pct"]   == 100

    def test_zero_score(self, client):
        """Submit all wrong answers."""
        from app.routers.quiz import _QUIZ_QUESTIONS_INTERNAL
        # Pick an option that is definitely wrong: always use index 0
        # unless the correct answer IS 0, in which case use 1
        answers = {
            q["id"]: 0 if q["ans"] != 0 else 1
            for q in _QUIZ_QUESTIONS_INTERNAL
        }
        r = client.post("/api/quiz/submit", json={"answers": answers})
        assert r.status_code == 200
        assert r.json()["score"] == 0
        assert r.json()["pct"]   == 0

    def test_partial_score(self, client):
        """Submit 4 correct, 4 wrong."""
        from app.routers.quiz import _QUIZ_QUESTIONS_INTERNAL
        answers = {}
        for i, q in enumerate(_QUIZ_QUESTIONS_INTERNAL):
            answers[q["id"]] = q["ans"] if i < 4 else (0 if q["ans"] != 0 else 1)
        r = client.post("/api/quiz/submit", json={"answers": answers})
        assert r.status_code == 200
        assert r.json()["score"] == 4

    def test_unknown_question_ids_skipped(self, client):
        """Unknown IDs should be silently ignored — no 500."""
        r = client.post("/api/quiz/submit", json={"answers": {"fake-id": 0, "another-fake": 2}})
        assert r.status_code == 200
        assert r.json()["score"] == 0
        assert r.json()["total"] == 0

    def test_empty_answers_rejected(self, client):
        r = client.post("/api/quiz/submit", json={"answers": {}})
        assert r.status_code == 422

    def test_breakdown_returned(self, client):
        from app.routers.quiz import _QUIZ_QUESTIONS_INTERNAL
        answers = {_QUIZ_QUESTIONS_INTERNAL[0]["id"]: _QUIZ_QUESTIONS_INTERNAL[0]["ans"]}
        r = client.post("/api/quiz/submit", json={"answers": answers})
        breakdown = r.json()["breakdown"]
        assert len(breakdown) == 1
        assert "correct"     in breakdown[0]
        assert "explanation" in breakdown[0]
        assert "selected"    in breakdown[0]
        assert "correct_idx" in breakdown[0]

    def test_explanation_present_for_all_answers(self, client):
        from app.routers.quiz import _QUIZ_QUESTIONS_INTERNAL
        answers = {q["id"]: q["ans"] for q in _QUIZ_QUESTIONS_INTERNAL}
        r = client.post("/api/quiz/submit", json={"answers": answers})
        for item in r.json()["breakdown"]:
            assert item["explanation"], "Explanation should not be empty"


# ── Stations: GET /api/stations ──────────────────────────────

class TestListStations:
    def test_returns_200(self, client):
        r = client.get("/api/stations")
        assert r.status_code == 200

    def test_returns_stations_list(self, client):
        r = client.get("/api/stations")
        body = r.json()
        assert "stations" in body
        assert "count"    in body
        assert isinstance(body["stations"], list)
        assert body["count"] == len(body["stations"])

    def test_has_at_least_five_stations(self, client):
        r = client.get("/api/stations")
        assert r.json()["count"] >= 5

    def test_accessible_filter(self, client):
        r = client.get("/api/stations?accessible_only=true")
        stations = r.json()["stations"]
        assert all(s["accessible"] for s in stations), \
            "All returned stations should be wheelchair accessible"

    def test_station_has_required_fields(self, client):
        r = client.get("/api/stations")
        s = r.json()["stations"][0]
        for field in ("id", "city", "name", "addr", "dist_km", "hours", "accessible", "lat", "lng"):
            assert field in s, f"Missing field: {field}"

    def test_station_ids_unique(self, client):
        r = client.get("/api/stations")
        ids = [s["id"] for s in r.json()["stations"]]
        assert len(ids) == len(set(ids))


# ── Stations: GET /api/stations/search ───────────────────────

class TestSearchStations:
    def test_mumbai_search_returns_results(self, client):
        r = client.get("/api/stations/search?q=mumbai")
        assert r.status_code == 200
        assert r.json()["count"] > 0

    def test_london_search_returns_results(self, client):
        r = client.get("/api/stations/search?q=london")
        assert r.status_code == 200
        assert r.json()["count"] > 0

    def test_unknown_city_returns_404(self, client):
        r = client.get("/api/stations/search?q=atlantis")
        assert r.status_code == 404

    def test_query_too_short_rejected(self, client):
        r = client.get("/api/stations/search?q=a")
        assert r.status_code == 422

    def test_query_too_long_rejected(self, client):
        r = client.get("/api/stations/search?q=" + "a" * 101)
        assert r.status_code == 422

    def test_accessible_filter_in_search(self, client):
        r = client.get("/api/stations/search?q=hyderabad&accessible_only=true")
        assert r.status_code == 200
        stations = r.json()["stations"]
        assert all(s["accessible"] for s in stations)

    def test_response_includes_query_echo(self, client):
        r = client.get("/api/stations/search?q=delhi")
        assert "query" in r.json()

    def test_injection_attempt_handled_safely(self, client):
        """SQL/script injection in search query should return 404, not 500."""
        r = client.get("/api/stations/search?q='; DROP TABLE")
        # Should either return 404 (no match after sanitisation) or 422 (too short)
        assert r.status_code in (404, 422)
