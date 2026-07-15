from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.poll import Poll, Question
from app.models.response import Answer, PollResponse
from app.schemas.response import AnswerSubmit


async def get_poll_for_taking(db: AsyncSession, public_slug: str) -> Poll | None:
    result = await db.execute(
        select(Poll)
        .options(selectinload(Poll.questions).selectinload(Question.options))
        .where(Poll.public_slug == public_slug)
    )
    return result.scalar_one_or_none()


async def start_response(db: AsyncSession, poll: Poll) -> PollResponse:
    response = PollResponse(poll_id=poll.id)
    db.add(response)
    await db.commit()
    await db.refresh(response)
    return response


async def submit_answers(
    db: AsyncSession,
    poll: Poll,
    poll_response_id: int,
    answers: list[AnswerSubmit],
) -> tuple[PollResponse, bool]:
    # Load existing response
    result = await db.execute(
        select(PollResponse).where(
            PollResponse.id == poll_response_id,
            PollResponse.poll_id == poll.id,
        )
    )
    response = result.scalar_one_or_none()
    if response is None:
        raise ValueError("Poll response not found")
    if response.completed_at is not None:
        raise ValueError("Response already completed")

    # Collect valid question IDs for this poll
    valid_question_ids = {q.id for q in poll.questions}

    for ans in answers:
        if ans.question_id not in valid_question_ids:
            raise ValueError("Invalid answers")
        answer = Answer(
            poll_response_id=response.id,
            question_id=ans.question_id,
            option_id=ans.option_id,
            rating_value=ans.rating_value,
            text_value=ans.text_value,
        )
        db.add(answer)

    response.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return response, True
