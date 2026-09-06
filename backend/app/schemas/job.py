from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class JobAnalysisData(BaseModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    salary: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    required_experience_years: Optional[float] = None
    education_requirements: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    summary: str = ""

class JobCreatePasted(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    raw_text: str

class JobCreateUrl(BaseModel):
    url: str

class JobCreateManual(BaseModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    salary: Optional[str] = None
    raw_description: str
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    required_experience_years: Optional[float] = None
    responsibilities: List[str] = Field(default_factory=list)

class JobRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_id: str
    required_skills: List[str]
    preferred_skills: List[str]
    required_experience_years: Optional[float] = None
    education_requirements: List[str]
    responsibilities: List[str]
    keywords: List[str]

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str
    raw_description: str
    summary: Optional[str] = None
    source_type: str
    source_url: Optional[str] = None
    is_active: bool
    requirements: Optional[JobRequirementResponse] = None
    created_at: datetime
    updated_at: datetime
