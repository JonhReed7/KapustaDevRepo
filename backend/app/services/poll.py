from datetime import datetime, timezone

from nanoid import generate
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.poll import Option, Poll, Question
from app.models.response import Answer, PollResponse
from app.schemas.poll import PollCreate, PollUpdate
from app.templates.poll_templates import POLL_TEMPLATES


async def create_poll(db: AsyncSession, owner_id: int, data: PollCreate) -> Poll:
    poll = Poll(owner_id=owner_id, title=data.title, description=data.description)
    db.add(poll)
    await db.flush()

    for q_data in data.questions:
        question = Question(
            poll_id=poll.id,
            prompt=q_data.prompt,
            type=q_data.type,
            scale=q_data.scale,
            sort_order=q_data.sort_order,
        )
        db.add(question)
        await db.flush()

        for o_data in q_data.options:
            option = Option(question_id=question.id, label=o_data.label, sort_order=0)
            db.add(option)

    await db.commit()
    return await get_poll_detail(db, poll.id)


async def update_poll(db: AsyncSession, poll: Poll, data: PollUpdate) -> Poll:
    if data.title is not None:
        poll.title = data.title
    if data.description is not None:
        poll.description = data.description

    for q in list(poll.questions):
        await db.delete(q)
    await db.flush()

    for q_data in data.questions:
        question = Question(
            poll_id=poll.id,
            prompt=q_data.prompt,
            type=q_data.type,
            scale=q_data.scale,
            sort_order=q_data.sort_order,
        )
        db.add(question)
        await db.flush()

        for o_data in q_data.options:
            option = Option(question_id=question.id, label=o_data.label, sort_order=0)
            db.add(option)

    await db.commit()
    return await get_poll_detail(db, poll.id)


async def get_poll_detail(db: AsyncSession, poll_id: int) -> Poll | None:
    result = await db.execute(
        select(Poll)
        .options(selectinload(Poll.questions).selectinload(Question.options))
        .where(Poll.id == poll_id)
    )
    return result.scalar_one_or_none()


async def get_user_polls(db: AsyncSession, owner_id: int) -> list[dict]:
    response_count = (
        select(
            PollResponse.poll_id,
            func.count(PollResponse.id).label("response_count"),
        )
        .where(PollResponse.completed_at.isnot(None))
        .group_by(PollResponse.poll_id)
        .subquery()
    )

    result = await db.execute(
        select(
            Poll.id,
            Poll.title,
            Poll.status,
            Poll.created_at,
            func.coalesce(response_count.c.response_count, 0).label("responses"),
        )
        .outerjoin(response_count, Poll.id == response_count.c.poll_id)
        .where(Poll.owner_id == owner_id)
        .order_by(Poll.created_at.desc())
    )

    return [
        {
            "id": row.id,
            "title": row.title,
            "status": row.status,
            "responses": row.responses,
            "created_at": row.created_at,
        }
        for row in result.all()
    ]


async def publish_poll(db: AsyncSession, poll: Poll) -> Poll:
    slug = generate(size=21)
    while True:
        existing = await db.execute(select(Poll).where(Poll.public_slug == slug))
        if existing.scalar_one_or_none() is None:
            break
        slug = generate(size=21)

    poll.status = "active"
    poll.public_slug = slug
    poll.published_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(poll)
    return poll


async def close_poll(db: AsyncSession, poll: Poll) -> Poll:
    poll.status = "closed"
    poll.closed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(poll)
    return poll


async def create_from_template(db: AsyncSession, owner_id: int, template_key: str) -> Poll | None:
    template = POLL_TEMPLATES.get(template_key)
    if template is None:
        return None

    poll = Poll(owner_id=owner_id, title=template["title"], description=template["description"])
    db.add(poll)
    await db.flush()

    for idx, q_data in enumerate(template["questions"]):
        question = Question(
            poll_id=poll.id,
            prompt=q_data["prompt"],
            type=q_data["type"],
            scale=q_data.get("scale"),
            sort_order=idx,
        )
        db.add(question)
        await db.flush()

        for o_idx, label in enumerate(q_data["options"]):
            option = Option(question_id=question.id, label=label, sort_order=o_idx)
            db.add(option)

    await db.commit()
    return await get_poll_detail(db, poll.id)


async def compute_engagement(db: AsyncSession, poll: Poll) -> dict:
    total_started = await db.scalar(
        select(func.count(PollResponse.id)).where(PollResponse.poll_id == poll.id)
    )
    total_completed = await db.scalar(
        select(func.count(PollResponse.id)).where(
            PollResponse.poll_id == poll.id,
            PollResponse.completed_at.isnot(None),
        )
    )
    total_questions = len(poll.questions)

    if total_started == 0:
        return {
            "poll_id": poll.id,
            "total_started": 0,
            "total_completed": 0,
            "completion_rate": 0.0,
            "avg_completion_seconds": None,
            "avg_time_per_question_seconds": None,
            "engagement_index": 0.0,
        }

    completion_rate = total_completed / total_started

    avg_completion_seconds = None
    avg_time_per_question_seconds = None
    time_factor = 1.0

    if total_completed > 0 and total_questions > 0:
        avg_seconds = await db.scalar(
            select(func.avg(
                func.extract("epoch", PollResponse.completed_at - PollResponse.started_at)
            )).where(
                PollResponse.poll_id == poll.id,
                PollResponse.completed_at.isnot(None),
            )
        )
        if avg_seconds is not None:
            avg_completion_seconds = round(float(avg_seconds), 1)
            avg_time_per_question_seconds = round(float(avg_seconds) / total_questions, 1)
            avg_minutes_per_question = float(avg_seconds) / 60 / total_questions
            time_factor = 1 / (1 + avg_minutes_per_question)

    engagement_index = round(completion_rate * time_factor, 3)

    return {
        "poll_id": poll.id,
        "total_started": total_started,
        "total_completed": total_completed,
        "completion_rate": round(completion_rate, 3),
        "avg_completion_seconds": avg_completion_seconds,
        "avg_time_per_question_seconds": avg_time_per_question_seconds,
        "engagement_index": engagement_index,
    }


async def get_poll_results(db: AsyncSession, poll: Poll) -> dict:
    from app.models.poll import Option

    total_completed = await db.scalar(
        select(func.count(PollResponse.id)).where(
            PollResponse.poll_id == poll.id,
            PollResponse.completed_at.isnot(None),
        )
    )

    question_results = []
    for question in poll.questions:
        if question.type in ("single", "multiple"):
            option_votes = []
            for option in question.options:
                count = await db.scalar(
                    select(func.count(Answer.id)).where(
                        Answer.question_id == question.id,
                        Answer.option_id == option.id,
                    )
                )
                option_votes.append({"label": option.label, "votes": count or 0})
            question_results.append({
                "id": question.id,
                "prompt": question.prompt,
                "type": question.type,
                "options": option_votes,
            })
        elif question.type == "rating":
            avg = await db.scalar(
                select(func.avg(Answer.rating_value)).where(
                    Answer.question_id == question.id,
                    Answer.rating_value.isnot(None),
                )
            )
            question_results.append({
                "id": question.id,
                "prompt": question.prompt,
                "type": question.type,
                "average": round(float(avg), 1) if avg else 0.0,
                "scale": question.scale or 5,
            })
        elif question.type == "open_text":
            texts_result = await db.execute(
                select(Answer.text_value).where(
                    Answer.question_id == question.id,
                    Answer.text_value.isnot(None),
                ).order_by(Answer.id.desc()).limit(20)
            )
            texts = [row[0] for row in texts_result.all() if row[0]]
            question_results.append({
                "id": question.id,
                "prompt": question.prompt,
                "type": question.type,
                "texts": texts,
            })

    return {
        "title": poll.title,
        "total_responses": total_completed or 0,
        "questions": question_results,
    }
