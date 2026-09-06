from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict

class TailoredChange(BaseModel):
    original: str
    tailored: str
    rationale: str

class TailoredResumeData(BaseModel):
    title: str
    tailored_markdown: str
    tailored_changes: List[TailoredChange] = Field(default_factory=list)
    anti_hallucination_verified: bool = True

class CoverLetterData(BaseModel):
    title: str
    content: str
    tailored_aspects: List[str] = Field(default_factory=list)
    anti_hallucination_verified: bool = True

class GeneratedDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    job_id: Optional[str] = None
    candidate_profile_id: Optional[str] = None
    document_type: str
    title: str
    content: str
    tailored_changes: Optional[List[Dict]] = None
    anti_hallucination_verified: bool
    created_at: datetime
    updated_at: datetime

class DocumentUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: str
