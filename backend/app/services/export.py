import csv
import io
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.poll import Poll, Question
from app.models.response import Answer, PollResponse


async def export_poll_data(
    db: AsyncSession, poll: Poll
) -> list[dict]:
    # Load questions
    q_result = await db.execute(
        select(Question).where(Question.poll_id == poll.id).order_by(Question.sort_order)
    )
    questions = {q.id: q for q in q_result.scalars().all()}

    # Load all responses with answers
    r_result = await db.execute(
        select(PollResponse)
        .where(PollResponse.poll_id == poll.id, PollResponse.completed_at.isnot(None))
        .order_by(PollResponse.id)
    )
    responses = r_result.scalars().all()

    rows = []
    for resp in responses:
        a_result = await db.execute(
            select(Answer).where(Answer.poll_response_id == resp.id)
        )
        for ans in a_result.scalars().all():
            question = questions.get(ans.question_id)
            if question is None:
                continue
            answer_text = ""
            if ans.option_id is not None:
                # Need to resolve option label
                from app.models.poll import Option
                o_result = await db.execute(select(Option).where(Option.id == ans.option_id))
                option = o_result.scalar_one_or_none()
                answer_text = option.label if option else ""
            elif ans.rating_value is not None:
                answer_text = str(ans.rating_value)
            elif ans.text_value is not None:
                answer_text = ans.text_value

            rows.append({
                "response_id": resp.id,
                "question": question.prompt,
                "type": question.type,
                "answer": answer_text,
                "answered_at": ans.answered_at.isoformat() if ans.answered_at else "",
            })

    return rows


def rows_to_csv(rows: list[dict]) -> str:
    if not rows:
        return "response_id,question,type,answer,answered_at\n"
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["response_id", "question", "type", "answer", "answered_at"])
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


def rows_to_xlsx(rows: list[dict]) -> bytes:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    ws.title = "Export"
    ws.append(["response_id", "question", "type", "answer", "answered_at"])
    for row in rows:
        ws.append([
            row["response_id"],
            row["question"],
            row["type"],
            row["answer"],
            row["answered_at"],
        ])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
