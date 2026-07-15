from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, Text, DateTime, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PollResponse(Base):
    __tablename__ = "poll_responses"
    __table_args__ = (
        Index("idx_poll_responses_poll_id", "poll_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    poll_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("polls.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    poll = relationship("Poll", back_populates="responses")
    answers = relationship("Answer", back_populates="poll_response", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (
        Index("idx_answers_poll_response_id", "poll_response_id"),
        Index("idx_answers_question_id", "question_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    poll_response_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("poll_responses.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    option_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("options.id", ondelete="CASCADE"), nullable=True
    )
    text_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rating_value: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    poll_response = relationship("PollResponse", back_populates="answers")
    question = relationship("Question", back_populates="answers")
