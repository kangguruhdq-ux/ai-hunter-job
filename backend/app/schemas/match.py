from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, ConfigDict

class SkillGapItem(BaseModel):
    skill: str
    category: str  # Already Strong, Some Experience, Needs Improvement, Missing
    recommendation: Optional[str] = None

class MatchResultData(BaseModel):
    overall_score: int
    skills_score: int
    experience_score: int
    responsibility_score: int
    education_score: int
    keyword_score: int
    score_weights: Dict[str, float] = Field(default_factory=lambda: {
        "skills": 0.40,
        "experience": 0.25,
        "responsibilities": 0.20,
        "education": 0.10,
        "keywords": 0.05
    })
    strengths: List[str] = Field(default_factory=list)
    skill_gaps: List[SkillGapItem] = Field(default_factory=list)
    recommendation: str  # STRONG_MATCH, GOOD_MATCH, POSSIBLE_MATCH, WEAK_MATCH
    reasoning: str

class JobMatchResponse(MatchResultData):
    model_config = ConfigDict(from_attributes=True)

    id: str
    candidate_profile_id: str
    job_id: str
    created_at: datetime
    updated_at: datetime
