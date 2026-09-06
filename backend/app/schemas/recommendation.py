from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class SkillGapDetail(BaseModel):
    skill: str
    category: str  # Already Strong, Some Experience, Needs Improvement, Missing
    importance: str  # Required, Preferred
    recommendation: str
    learning_resource: Optional[str] = None

class ActionPlanItem(BaseModel):
    priority: str  # High, Medium, Low
    title: str
    description: str
    action_type: str  # Resume Highlight, Project Build, Conceptual Study

class JobSkillGapAnalysisResponse(BaseModel):
    job_id: str
    job_title: str
    company: str
    match_score: int
    recommendation: str  # STRONG_MATCH, GOOD_MATCH, POSSIBLE_MATCH, WEAK_MATCH
    summary: str
    categories: Dict[str, List[SkillGapDetail]]
    action_plan: List[ActionPlanItem]
    interview_focus_areas: List[str]
