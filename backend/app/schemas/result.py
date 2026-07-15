from typing import Optional

from pydantic import BaseModel


class ResultOption(BaseModel):
    label: str
    votes: int


class ResultQuestion(BaseModel):
    id: int
    prompt: str
    type: str
    options: Optional[list[ResultOption]] = None
    average: Optional[float] = None
    scale: Optional[int] = None
    texts: Optional[list[str]] = None


class SurveyResultResponse(BaseModel):
    title: str
    total_responses: int
    questions: list[ResultQuestion]
