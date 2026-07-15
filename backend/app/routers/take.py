from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.response import (
    StartResponse,
    SubmitRequest,
    SubmitResponse,
    TakeSurveyResponse,
)
from app.services import response as resp_svc

router = APIRouter(prefix="/take", tags=["take"])


@router.get("/{public_slug}", response_model=TakeSurveyResponse)
async def get_survey(
    public_slug: str,
    db: AsyncSession = Depends(get_db),
):
    poll = await resp_svc.get_poll_for_taking(db, public_slug)
    if poll is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found or not available",
        )
    return poll


@router.post("/{public_slug}/start", response_model=StartResponse, status_code=status.HTTP_201_CREATED)
async def start_survey(
    public_slug: str,
    db: AsyncSession = Depends(get_db),
):
    poll = await resp_svc.get_poll_for_taking(db, public_slug)
    if poll is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found or not available",
        )
    response = await resp_svc.start_response(db, poll)
    return StartResponse(poll_response_id=response.id)


@router.post("/{public_slug}/responses", response_model=SubmitResponse)
async def submit_responses(
    public_slug: str,
    body: SubmitRequest,
    db: AsyncSession = Depends(get_db),
):
    poll = await resp_svc.get_poll_for_taking(db, public_slug)
    if poll is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found or not available",
        )
    try:
        response, completed = await resp_svc.submit_answers(
            db, poll, body.poll_response_id, body.answers
        )
    except ValueError as e:
        detail = str(e)
        code = status.HTTP_404_NOT_FOUND if "not found" in detail.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail)

    return SubmitResponse(poll_response_id=response.id, completed=completed)
