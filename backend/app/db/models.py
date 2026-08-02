from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Password reset — stores a hash of the reset token (never the raw token, so a DB leak alone
    # can't be used to reset accounts) plus its expiry. Both null when no reset is pending.
    reset_token_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ResumeHistory(Base):
    """One row per completed `/api/resume/analyze` call — written automatically by that route,
    never regenerated when read back (the Dashboard/History pages only ever display this)."""

    __tablename__ = "resume_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    resume_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    ats_score: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    # Full ResumeAnalysis (summary/skills/strengths/weaknesses/missing_skills/suggestions) as one
    # atomic blob — always read/written together, so this avoids duplicating each field into its
    # own column.
    analysis_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)


class InterviewHistory(Base):
    """One row per completed mock-interview session, saved once by the frontend when the session
    finishes (there's no single backend call to hook into — a session spans many /evaluate calls)."""

    __tablename__ = "interview_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    company_slug: Mapped[str] = mapped_column(String(100), nullable=False)
    # Denormalized so history stays readable even if the company registry changes later.
    company_display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    interview_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    overall_score: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    communication_score: Mapped[int] = mapped_column(Integer, nullable=False)
    technical_score: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence_score: Mapped[int] = mapped_column(Integer, nullable=False)
    # Full list of {question, category, candidate_answer, evaluation} — everything needed to
    # re-render the session without ever calling the LLM again.
    qa_json: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)


class InterviewReview(Base):
    """One row per InterviewHistory session — the LLM-synthesized end-of-session review (overall
    assessment, strengths, areas to improve, actionable suggestions, top-3 focus). A separate table
    rather than a new column on InterviewHistory: this app has no migration tool, and create_all()
    only creates missing tables, never alters existing ones — a new table is the safe way to add a
    field to an already-deployed schema. Best-effort: absent if generation failed or predates this
    feature, so a missing row must never break rendering a saved session."""

    __tablename__ = "interview_review"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    interview_history_id: Mapped[int] = mapped_column(
        ForeignKey("interview_history.id"), unique=True, index=True, nullable=False
    )
    overall_review: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    areas_to_improve: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    actionable_suggestions: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    focus_for_next_interview: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class JDMatchHistory(Base):
    """One row per completed `/api/toolkit/match-jd` call — written automatically by that route."""

    __tablename__ = "jd_match_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    matched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    jd_match_score: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    match_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)


class CompanyRecommendationHistory(Base):
    """One row per completed `/api/companies/recommend` call — written automatically by that
    route, so the Dashboard can show a cached 'recommended companies' section without triggering
    a fresh LLM call on every visit."""

    __tablename__ = "company_recommendation_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    recommended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    recommendations_json: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
