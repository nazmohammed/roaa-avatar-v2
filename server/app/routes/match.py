"""Intent matcher — keyword-based routing to 6 scripted answers."""

from __future__ import annotations
from dataclasses import dataclass, field
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


# ── Scripted Q&A ─────────────────────────────────────────────────


@dataclass
class ScriptedAnswer:
    id: str
    keywords: list[str]
    question: str
    answer: str


SCRIPTS: list[ScriptedAnswer] = [
    ScriptedAnswer(
        id="Q1",
        keywords=["baggage", "luggage", "bag", "carry-on", "carry on", "checked", "suitcase", "kilo", "weight"],
        question="What is the baggage allowance?",
        answer=(
            "Welcome aboard Riyadh Air. Economy class passengers enjoy 23 kilograms "
            "of checked baggage and 7 kilograms carry-on. Business class passengers "
            "receive 2 pieces of 32 kilograms each plus 2 carry-on items. For excess "
            "baggage, our ground team can assist before departure."
        ),
    ),
    ScriptedAnswer(
        id="Q2",
        keywords=["meal", "food", "eat", "dietary", "vegetarian", "vegan", "halal", "menu", "drink", "snack", "dinner", "lunch", "breakfast"],
        question="What meals are available?",
        answer=(
            "We offer a curated dining experience on all flights. Economy class "
            "features a complimentary main meal with a choice of two options. "
            "Business class passengers enjoy a multi-course à la carte menu. "
            "All meals are halal certified. Please let us know about any dietary "
            "requirements and we will do our best to accommodate."
        ),
    ),
    ScriptedAnswer(
        id="Q3",
        keywords=["wifi", "wi-fi", "internet", "connect", "online", "network", "streaming"],
        question="Is there WiFi on board?",
        answer=(
            "Yes, Riyadh Air offers complimentary high-speed WiFi on all aircraft. "
            "Simply connect to the Riyadh Air WiFi network and follow the login "
            "instructions on your personal screen. Business class passengers enjoy "
            "premium bandwidth for streaming and video calls."
        ),
    ),
    ScriptedAnswer(
        id="Q4",
        keywords=["lounge", "priority", "access", "vip", "business lounge", "waiting", "relax"],
        question="Can I access the lounge?",
        answer=(
            "Business class passengers and Riyadh Air loyalty program Gold members "
            "enjoy complimentary access to our lounges. Our Riyadh hub lounge features "
            "premium dining, shower suites, and prayer rooms. For Economy passengers, "
            "day passes are available for purchase at the lounge reception."
        ),
    ),
    ScriptedAnswer(
        id="Q5",
        keywords=["flight", "status", "delay", "delayed", "time", "arrive", "arrival", "depart", "departure", "gate", "schedule", "on time", "late"],
        question="What is my flight status?",
        answer=(
            "For real-time flight status, I recommend checking the Riyadh Air app "
            "or the departure screens in the terminal. Once on board, our captain "
            "will provide updates on departure time, flight duration, and expected "
            "arrival. If there are any changes, our crew will keep you informed promptly."
        ),
    ),
    ScriptedAnswer(
        id="Q6",
        keywords=["upgrade", "seat", "business class", "premium", "first class", "better seat", "window", "aisle", "legroom"],
        question="Can I upgrade my seat?",
        answer=(
            "Seat upgrades may be available depending on flight availability. "
            "You can check upgrade options through the Riyadh Air app up to "
            "2 hours before departure. On board, please speak with our cabin "
            "manager who can check availability and pricing for you. Business "
            "class upgrades include access to our premium dining and lounge services."
        ),
    ),
]

FALLBACK = ScriptedAnswer(
    id="FALLBACK",
    keywords=[],
    question="General inquiry",
    answer=(
        "Thank you for your question. I am currently able to help with baggage, "
        "meals, WiFi, lounge access, flight status, and seat upgrades. For other "
        "inquiries, please don't hesitate to ask any of our cabin crew members "
        "who will be happy to assist you."
    ),
)


# ── Matcher ──────────────────────────────────────────────────────


def match_intent(transcript: str) -> ScriptedAnswer:
    """Score each script by keyword hits; return best or fallback."""
    words = transcript.lower().split()
    lower = transcript.lower()

    best: ScriptedAnswer | None = None
    best_score = 0

    for script in SCRIPTS:
        score = 0
        for kw in script.keywords:
            if " " in kw:
                if kw in lower:
                    score += 2
            elif kw in lower:
                score += 1
        if score > best_score:
            best_score = score
            best = script

    return best if best and best_score > 0 else FALLBACK


# ── Route ────────────────────────────────────────────────────────


class MatchRequest(BaseModel):
    transcript: str


@router.post("/match")
async def match(req: MatchRequest):
    result = match_intent(req.transcript.strip())
    print(f'[match] "{req.transcript.strip()}" → {result.id}')
    return {
        "intentId": result.id,
        "question": result.question,
        "answer": result.answer,
        "transcript": req.transcript.strip(),
    }
