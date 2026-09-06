from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator

class ExperienceItem(BaseModel):
    company: str
    role: Optional[str] = None
    title: Optional[str] = None
    period: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    current: bool = False
    location: Optional[str] = None
    description: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def sync_role_and_title(self):
        # Sync role and title so both are accessible
        if self.role and not self.title:
            self.title = self.role
        elif self.title and not self.role:
            self.role = self.title
        # If neither is present, both remain None
        return self

class EducationItem(BaseModel):
    institution: Optional[str] = None
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    period: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    gpa: Optional[Union[float, int, str]] = None
    details: List[str] = Field(default_factory=list)

class OrganizationItem(BaseModel):
    name: str
    role: Optional[str] = None
    period: Optional[str] = None
    responsibilities: List[str] = Field(default_factory=list)
    description: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = ""
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
    organizations: List[OrganizationItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    years_of_experience: float = 0.0

    @model_validator(mode="before")
    @classmethod
    def sync_name_and_full_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "full_name" in data and ("name" not in data or data.get("name") == "Candidate"):
                data["name"] = data["full_name"]
            elif "name" in data and "full_name" not in data:
                data["full_name"] = data["name"]
        return data

    @property
    def full_name(self) -> str:
        return self.name

class CandidateProfileResponse(CandidateProfileData):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    resume_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
