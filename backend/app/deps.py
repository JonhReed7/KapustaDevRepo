from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.poll import Poll, Question
from app.models.user import User
from app.services.auth import get_current_user


async def require_owner(
    poll_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> tuple[Poll, User]:
    result = await db.execute(
        select(Poll)
        .options(selectinload(Poll.questions).selectinload(Question.options))
        .where(Poll.id == poll_id)
    )
    poll = result.scalar_one_or_none()
    if poll is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poll not found")
    if poll.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return poll, current_user
