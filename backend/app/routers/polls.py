from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_owner
from app.models.user import User
from app.schemas.engagement import EngagementResponse
from app.schemas.poll import (
    PollCloseResponse,
    PollCreate,
    PollDetail,
    PollPublishResponse,
    PollSummary,
    PollUpdate,
)
from app.schemas.result import SurveyResultResponse
from app.services import export as export_svc
from app.services.auth import get_current_user
from app.services import poll as poll_svc

router = APIRouter(prefix="/polls", tags=["polls"])


@router.get("", response_model=list[PollSummary])
async def list_polls(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await poll_svc.get_user_polls(db, current_user.id)


@router.post("", response_model=PollDetail, status_code=status.HTTP_201_CREATED)
async def create_poll(
    body: PollCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await poll_svc.create_poll(db, current_user.id, body)


@router.get("/{poll_id}", response_model=PollDetail)
async def get_poll(
    poll_id: int,
    owner: tuple = Depends(require_owner),
):
    poll, _ = owner
    return poll


@router.patch("/{poll_id}", response_model=PollDetail)
async def update_poll(
    poll_id: int,
    body: PollUpdate,
    owner: tuple = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    poll, _ = owner
    if poll.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only edit draft polls",
        )
    return await poll_svc.update_poll(db, poll, body)


@router.post("/{poll_id}/publish", response_model=PollPublishResponse)
async def publish_poll(
    poll_id: int,
    owner: tuple = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    poll, _ = owner
    if poll.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only publish draft polls",
        )
    return await poll_svc.publish_poll(db, poll)


@router.post("/{poll_id}/close", response_model=PollCloseResponse)
async def close_poll(
    poll_id: int,
    owner: tuple = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    poll, _ = owner
    if poll.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only close active polls",
        )
    return await poll_svc.close_poll(db, poll)


@router.post("/from-template/{template_key}", response_model=PollDetail, status_code=status.HTTP_201_CREATED)
async def create_from_template(
    template_key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    poll = await poll_svc.create_from_template(db, current_user.id, template_key)
    if poll is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unknown template key",
        )
    return poll


@router.get("/{poll_id}/results", response_model=SurveyResultResponse)
async def get_results(
    poll_id: int,
    owner: tuple = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    poll, _ = owner
    return await poll_svc.get_poll_results(db, poll)


@router.get("/{poll_id}/engagement", response_model=EngagementResponse)
async def get_engagement(
    poll_id: int,
    owner: tuple = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    poll, _ = owner
    return await poll_svc.compute_engagement(db, poll)


@router.get("/{poll_id}/export")
async def export_poll(
    poll_id: int,
    format: str = "csv",
    owner: tuple = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    if format not in ("csv", "xlsx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Use csv or xlsx",
        )
    poll, _ = owner
    rows = await export_svc.export_poll_data(db, poll)

    if format == "csv":
        content = export_svc.rows_to_csv(rows)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="poll_{poll.id}.csv"'},
        )
    else:
        content = export_svc.rows_to_xlsx(rows)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="poll_{poll.id}.xlsx"'},
        )
