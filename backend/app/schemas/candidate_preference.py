from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class CandidatePreferenceData(BaseModel):
    preferred_roles: List[str] = Field(default_factory=list)
    preferred_locations: List[str] = Field(default_factory=list)
    preferred_job_types: List[str] = Field(default_factory=list)
    preferred_stack: List[str] = Field(default_factory=list)
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: str = "USD"

class CandidatePreferenceResponse(CandidatePreferenceData):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
