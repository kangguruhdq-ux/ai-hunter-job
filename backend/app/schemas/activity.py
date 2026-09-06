from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class AIActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: Optional[str] = None
    agent_name: str
    action: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None
    activity_metadata: Optional[Dict[str, Any]] = None

class DashboardStatsResponse(BaseModel):
    recommended_jobs_count: int
    applications_count: int
    interviews_count: int
    offers_count: int
    average_match_score: int
    active_resume_filename: Optional[str] = None
    candidate_name: Optional[str] = None
    top_matches: list = []
    # Helpful aliases for UI and API clients
    total_jobs: int = 0
    active_applications: int = 0
    resumes_tailored: int = 0
    avg_match_score: int = 0
    provider: str = "mock"
