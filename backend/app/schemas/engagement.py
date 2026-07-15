from pydantic import BaseModel


class EngagementResponse(BaseModel):
    poll_id: int
    total_started: int
    total_completed: int
    completion_rate: float
    avg_completion_seconds: float | None
    avg_time_per_question_seconds: float | None
    engagement_index: float
