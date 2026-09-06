from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ExperienceItem(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    current: bool = False
    description: Optional[str] = None
    achievements: List[str] = Field(default_factory=list)

class EducationItem(BaseModel):
    degree: str
    institution: str
    field_of_study: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None

class ProjectItem(BaseModel):
    name: str
    description: str
    tech_stack: List[str] = Field(default_factory=list)
    url: Optional[str] = None

class CandidateProfileData(BaseModel):
    name: str = "Candidate"
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    programming_languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    years_of_experience: float = 0.0

class CandidateProfileResponse(CandidateProfileData):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    resume_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
