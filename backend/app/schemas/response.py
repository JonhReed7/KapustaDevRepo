from typing import Optional

from pydantic import BaseModel


class TakeOption(BaseModel):
    id: int
    label: str

    model_config = {"from_attributes": True}


class TakeQuestion(BaseModel):
    id: int
    prompt: str
    type: str
    sort_order: int
    options: list[TakeOption] = []

    model_config = {"from_attributes": True}


class TakeSurveyResponse(BaseModel):
    title: str
    description: Optional[str] = None
    questions: list[TakeQuestion] = []

    model_config = {"from_attributes": True}


class StartResponse(BaseModel):
    poll_response_id: int


class AnswerSubmit(BaseModel):
    question_id: int
    option_id: Optional[int] = None
    rating_value: Optional[int] = None
    text_value: Optional[str] = None


class SubmitRequest(BaseModel):
    poll_response_id: int
    answers: list[AnswerSubmit]


class SubmitResponse(BaseModel):
    poll_response_id: int
    completed: bool
