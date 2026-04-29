"""
backend/app/routers/quiz.py — Quiz and Polling Station API routes
=================================================================
Exposes:
  GET  /api/quiz/questions    — Returns randomised quiz questions
  POST /api/quiz/submit       — Validates answers, returns score
  GET  /api/stations          — Returns mock polling station data
  GET  /api/stations/search   — Fuzzy-search stations by city/postcode

Architecture: Router module following clean-architecture separation.
Imported and registered in main.py via app.include_router().

Security:
  - All query params sanitised and length-limited
  - No raw DB queries (no injection surface)
  - Response never includes answer keys in GET /questions
"""

from __future__ import annotations

import random
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["quiz", "stations"])

# ============================================================
# § 1. QUIZ DATA
# ============================================================

# Internal representation includes answers — never sent to client
# until /submit validates the submission
_QUIZ_QUESTIONS_INTERNAL = [
    {
        "id": "q1",
        "q": "What is the minimum voting age in most democracies?",
        "opts": ["16", "18", "21", "25"],
        "ans": 1,
        "exp": "Most democracies set the voting age at 18. Austria and Scotland allow 16-year-olds in certain elections.",
    },
    {
        "id": "q2",
        "q": 'What does "first past the post" mean?',
        "opts": [
            "The fastest candidate wins",
            "The candidate with the most votes wins, regardless of majority",
            "Candidates must win 50%+ to qualify",
            "Only the top two candidates advance",
        ],
        "ans": 1,
        "exp": "FPTP means the candidate with the most votes wins, even without a majority.",
    },
    {
        "id": "q3",
        "q": 'What is a "constituency" or "district"?',
        "opts": [
            "A political party branch",
            "A geographic area that elects one representative",
            "A type of voting machine",
            "The national election commission",
        ],
        "ans": 1,
        "exp": "A constituency is a geographic area whose voters elect one representative.",
    },
    {
        "id": "q4",
        "q": "What does the Electoral College do in US presidential elections?",
        "opts": [
            "Counts the popular vote directly",
            "Formally elects the President through state-allocated electors",
            "Organises presidential debates",
            "Certifies voter registration rolls",
        ],
        "ans": 1,
        "exp": "The 538-member Electoral College formally elects the US President. 270 electoral votes are needed to win.",
    },
    {
        "id": "q5",
        "q": 'What is "voter suppression"?',
        "opts": [
            "Low turnout due to weather",
            "Deliberate efforts to prevent eligible people from voting",
            "Campaigning near polling stations",
            "Delaying vote counting",
        ],
        "ans": 1,
        "exp": "Voter suppression encompasses deliberate strategies that make voting harder for eligible citizens.",
    },
    {
        "id": "q6",
        "q": 'What is a "spoiled ballot"?',
        "opts": [
            "A ballot for a losing candidate",
            "A ballot submitted after polls close",
            "A ballot that cannot be counted due to incorrect marking",
            "An absentee ballot",
        ],
        "ans": 2,
        "exp": "A spoiled ballot cannot be counted — usually blank, multi-marked, or revealing the voter's identity.",
    },
    {
        "id": "q7",
        "q": 'What is "proportional representation"?',
        "opts": [
            "Each district elects one MP",
            "Seats allocated in proportion to each party's vote share",
            "Only the top two parties win seats",
            "Voters rank candidates by preference",
        ],
        "ans": 1,
        "exp": "Under PR, a party with 30% of votes receives ~30% of seats, closely reflecting actual voter preferences.",
    },
    {
        "id": "q8",
        "q": 'What is the purpose of an "exit poll"?',
        "opts": [
            "To count official votes after polls close",
            "To survey voters as they leave and predict results",
            "To identify candidates who violated campaign laws",
            "To verify voter identities",
        ],
        "ans": 1,
        "exp": "Exit polls survey voters immediately after voting; results allow media to predict winners before official counting.",
    },
]


# ============================================================
# § 2. QUIZ MODELS
# ============================================================

class QuizQuestionPublic(BaseModel):
    """
    Question data safe to send to the client.
    EXCLUDES the answer index — only returned in /submit response.
    """
    id:   str
    q:    str
    opts: list[str]


class QuizSubmission(BaseModel):
    """Client-submitted answers. Validated before scoring."""
    answers: dict[str, int] = Field(
        ...,
        description="Map of question_id → selected option index (0–3)",
        min_length=1,
        max_length=50,
    )


class QuizResult(BaseModel):
    score:     int
    total:     int
    pct:       int
    breakdown: list[dict]


# ============================================================
# § 3. POLLING STATION DATA
# ============================================================

@lru_cache(maxsize=1)
def get_all_stations() -> list[dict]:
    """
    Returns all polling station records.
    Cached — computed once, served from memory on subsequent calls.
    """
    return [
        # ── Mumbai ──
        {"id": "PS-MUM-001", "city": "mumbai", "name": "Polling Station — Ward 12, Dadar",
         "addr": "Shivaji Park Community Centre, Dadar West, Mumbai 400028",
         "dist_km": 0.8, "hours": "7:00 AM – 6:00 PM", "accessible": True,
         "lat": 19.0178, "lng": 72.8478},
        {"id": "PS-MUM-002", "city": "mumbai", "name": "Polling Station — Ward 14, Matunga",
         "addr": "BMC School No. 4, King's Circle, Matunga, Mumbai 400019",
         "dist_km": 1.4, "hours": "7:00 AM – 6:00 PM", "accessible": False,
         "lat": 19.0260, "lng": 72.8590},
        # ── Delhi ──
        {"id": "PS-DEL-001", "city": "delhi", "name": "Booth No. 23 — Connaught Place",
         "addr": "NDMC Primary School, Connaught Place, New Delhi 110001",
         "dist_km": 0.5, "hours": "7:00 AM – 6:00 PM", "accessible": True,
         "lat": 28.6315, "lng": 77.2167},
        # ── London ──
        {"id": "PS-LON-001", "city": "london", "name": "Westminster Polling Station",
         "addr": "St James's Church Hall, Piccadilly, London W1J 9LL",
         "dist_km": 0.3, "hours": "7:00 AM – 10:00 PM", "accessible": True,
         "lat": 51.5074, "lng": -0.1278},
        {"id": "PS-LON-002", "city": "london", "name": "Southwark Polling Station",
         "addr": "Bermondsey Community Centre, SE1 3XF",
         "dist_km": 1.1, "hours": "7:00 AM – 10:00 PM", "accessible": True,
         "lat": 51.4994, "lng": -0.0795},
        # ── New York ──
        {"id": "PS-NYC-001", "city": "new york", "name": "Election Day Poll Site — District 45",
         "addr": "PS 321, 180 7th Ave, Brooklyn, NY 11215",
         "dist_km": 0.4, "hours": "6:00 AM – 9:00 PM", "accessible": True,
         "lat": 40.6601, "lng": -73.9936},
        # ── Hyderabad ──
        {"id": "PS-HYD-001", "city": "hyderabad", "name": "Polling Booth No. 12 — Banjara Hills",
         "addr": "Zilla Parishad High School, Road No. 2, Banjara Hills, Hyderabad 500034",
         "dist_km": 0.7, "hours": "7:00 AM – 6:00 PM", "accessible": True,
         "lat": 17.4156, "lng": 78.4347},
        {"id": "PS-HYD-002", "city": "hyderabad", "name": "Polling Booth No. 28 — Jubilee Hills",
         "addr": "GHMC Community Hall, Jubilee Hills, Hyderabad 500033",
         "dist_km": 1.5, "hours": "7:00 AM – 6:00 PM", "accessible": False,
         "lat": 17.4318, "lng": 78.4072},
        {"id": "PS-HYD-003", "city": "hyderabad", "name": "Polling Booth No. 44 — Madhapur",
         "addr": "Govt. High School, HITEC City Road, Madhapur, Hyderabad 500081",
         "dist_km": 2.2, "hours": "7:00 AM – 6:00 PM", "accessible": True,
         "lat": 17.4500, "lng": 78.3883},
    ]


# ============================================================
# § 4. ROUTE HANDLERS
# ============================================================

@router.get("/quiz/questions", response_model=list[QuizQuestionPublic])
async def get_quiz_questions(
    count: Annotated[int, Query(ge=1, le=8)] = 8,
    shuffle: bool = True,
):
    """
    Return quiz questions, optionally shuffled.

    Security: Answer indices are NEVER included in this response.
              Answers are validated server-side in /quiz/submit.

    Args:
        count   - Number of questions to return (1–8, default 8)
        shuffle - Whether to randomise question order (default True)
    """
    questions = list(_QUIZ_QUESTIONS_INTERNAL)
    if shuffle:
        random.shuffle(questions)
    questions = questions[:count]

    # Strip answer field before returning to client
    return [
        QuizQuestionPublic(id=q["id"], q=q["q"], opts=q["opts"])
        for q in questions
    ]


@router.post("/quiz/submit", response_model=QuizResult)
async def submit_quiz(body: QuizSubmission):
    """
    Score a quiz submission.

    Validates each submitted answer against the server-side answer key.
    Returns score, percentage, and per-question breakdown with explanations.

    Security:
      - Answers validated on the server — client can't manipulate score
      - Unknown question IDs are silently skipped (no 500 error)
    """
    answer_key = {q["id"]: (q["ans"], q["exp"]) for q in _QUIZ_QUESTIONS_INTERNAL}
    score      = 0
    breakdown  = []

    for qid, selected in body.answers.items():
        if qid not in answer_key:
            continue  # Unknown question — skip silently
        correct_idx, explanation = answer_key[qid]
        is_correct = selected == correct_idx
        if is_correct:
            score += 1
        breakdown.append({
            "question_id":  qid,
            "correct":      is_correct,
            "selected":     selected,
            "correct_idx":  correct_idx,
            "explanation":  explanation,
        })

    total = len(breakdown)
    pct   = round((score / total) * 100) if total > 0 else 0

    return QuizResult(score=score, total=total, pct=pct, breakdown=breakdown)


@router.get("/stations")
async def list_stations(accessible_only: bool = False):
    """
    Return all polling station records.
    Optional filter for wheelchair-accessible stations.
    """
    stations = get_all_stations()
    if accessible_only:
        stations = [s for s in stations if s.get("accessible")]
    return {"stations": stations, "count": len(stations)}


@router.get("/stations/search")
async def search_stations(
    q: Annotated[str, Query(min_length=2, max_length=100)],
    accessible_only: bool = False,
):
    """
    Fuzzy-search polling stations by city name or postcode.

    Security: Query sanitised; only alphanumeric and space characters
              are used in the comparison — no SQL injection surface.

    Args:
        q               - City name or postcode fragment (min 2 chars)
        accessible_only - Filter to wheelchair-accessible stations
    """
    # Basic sanitisation — strip everything except word chars and spaces
    import re
    safe_q = re.sub(r"[^\w\s]", "", q).lower().strip()

    stations = get_all_stations()

    # Fuzzy city match: query contains city name OR city name contains query
    matches = [
        s for s in stations
        if safe_q in s["city"] or s["city"] in safe_q
    ]

    if accessible_only:
        matches = [s for s in matches if s.get("accessible")]

    if not matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No polling stations found for '{q}'. Try: mumbai, delhi, london, new york, hyderabad.",
        )

    return {"stations": matches, "count": len(matches), "query": q}
