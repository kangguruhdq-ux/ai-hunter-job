from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.job import JobResponse

VALID_STATUSES = [
    "Wishlist",
    "Applied",
    "Screening",
    "Interview",
    "Technical Interview",
    "Final Interview",
    "Offer",
    "Rejected"
]

class ApplicationCreate(BaseModel):
    job_id: str
    status: str = "Wishlist"
    notes: Optional[str] = None
    salary_offered: Optional[int] = None
    interview_date: Optional[datetime] = None
    job_url: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    salary_offered: Optional[int] = None
    interview_date: Optional[datetime] = None
    job_url: Optional[str] = None
    is_archived: Optional[bool] = None

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    job_id: str
    status: str
    notes: Optional[str] = None
    salary_offered: Optional[int] = None
    interview_date: Optional[datetime] = None
    job_url: Optional[str] = None
    is_archived: bool
    job: Optional[JobResponse] = None
    created_at: datetime
    updated_at: datetime

class KanbanColumnResponse(BaseModel):
    status: str
    title: str
    count: int
    applications: List[ApplicationResponse]
