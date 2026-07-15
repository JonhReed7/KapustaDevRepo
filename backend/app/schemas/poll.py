from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class OptionInput(BaseModel):
    id: Optional[int] = None
    label: str


class QuestionInput(BaseModel):
    id: Optional[int] = None
    prompt: str
    type: str  # single / multiple / rating / open_text
    options: list[OptionInput] = []
    scale: Optional[int] = None
    sort_order: int = 0


class PollCreate(BaseModel):
    title: str
    description: Optional[str] = None
    questions: list[QuestionInput] = []


class PollUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: list[QuestionInput] = []


class PollSummary(BaseModel):
    id: int
    title: str
    status: str
    responses: int
    created_at: datetime

    model_config = {"from_attributes": True}


class OptionDetail(BaseModel):
    id: int
    label: str
    sort_order: int

    model_config = {"from_attributes": True}


class QuestionDetail(BaseModel):
    id: int
    prompt: str
    type: str
    scale: Optional[int] = None
    sort_order: int
    options: list[OptionDetail] = []

    model_config = {"from_attributes": True}


class PollDetail(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    public_slug: Optional[str] = None
    created_at: datetime
    published_at: Optional[datetime] = None
    questions: list[QuestionDetail] = []

    model_config = {"from_attributes": True}


class PollPublishResponse(BaseModel):
    id: int
    status: str
    public_slug: str
    published_at: datetime

    model_config = {"from_attributes": True}


class PollCloseResponse(BaseModel):
    id: int
    status: str
    closed_at: datetime

    model_config = {"from_attributes": True}
