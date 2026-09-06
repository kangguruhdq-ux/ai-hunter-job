from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.ai_activity import AIActivity
from app.schemas.activity import AIActivityResponse, DashboardStatsResponse
from app.schemas.evaluation import EvaluationMetricsResponse
from app.services.dashboard_service import DashboardService
from app.agents.orchestrator import Orchestrator

router = APIRouter(prefix="/ai", tags=["AI Observability & Activity"])

@router.get("/activity", response_model=List[AIActivityResponse])
def list_ai_activities(
    limit: int = Query(50, ge=1, le=100),
    agent_name: Optional[str] = Query(None, description="Filter by agent"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve recent AI agent activity logs for the current authenticated user (or all if admin).
    Provides execution duration in ms, actions performed, and operational status.
    """
    query = db.query(AIActivity)
    if current_user.role != "admin":
        query = query.filter(AIActivity.user_id == current_user.id)
    if agent_name:
        query = query.filter(AIActivity.agent_name == agent_name)
    return query.order_by(AIActivity.started_at.desc()).limit(limit).all()

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve summarized KPIs for the SaaS dashboard for the authenticated candidate."""
    return await DashboardService.get_dashboard_stats(db, user_id=current_user.id)

@router.get("/evaluation", response_model=EvaluationMetricsResponse)
def get_evaluation_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve AI engineering observability metrics, success rates, and latencies."""
    return DashboardService.get_evaluation_metrics(db)

@router.post("/pipeline/{job_id}", response_model=Dict[str, Any])
async def run_orchestrator_pipeline(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Run full end-to-end orchestration pipeline for authenticated user:
    Calculates match -> Skill Gap Matrix -> Tailors resume -> Generates cover letter -> Updates Application Tracker.
    Emits real-time AI activity events.
    """
    result = await Orchestrator.run_full_pipeline(db=db, job_id=job_id, user_id=current_user.id)

    m = result["match"]
    tr = result["tailored_resume"]
    cl = result["cover_letter"]
    app = result["application"]
    sg = result["skill_gap"]

    sg_dict = sg.model_dump() if hasattr(sg, "model_dump") else (sg.dict() if hasattr(sg, "dict") else sg)
    cats = sg_dict.get("categories", {})

    def extract_skills(cat_key: str):
        items = cats.get(cat_key, [])
        return [i.get("skill", str(i)) if isinstance(i, dict) else getattr(i, "skill", str(i)) for i in items]

    # Augment skill_gap dict with direct category lists for frontend convenience
    sg_dict["already_strong"] = extract_skills("Already Strong")
    sg_dict["some_experience"] = extract_skills("Some Experience")
    sg_dict["needs_improvement"] = extract_skills("Needs Improvement")
    sg_dict["missing"] = extract_skills("Missing")
    sg_dict["actionable_roadmap"] = [
        {
            "skill": item.get("title", ""),
            "action": item.get("description", ""),
            "priority": item.get("priority", "")
        } if isinstance(item, dict) else {
            "skill": getattr(item, "title", ""),
            "action": getattr(item, "description", ""),
            "priority": getattr(item, "priority", "")
        }
        for item in sg_dict.get("action_plan", [])
    ]

    return {
        "status": result["status"],
        "job_id": job_id,
        "match_score": m.overall_score,
        "tailored_resume_id": tr.id,
        "cover_letter_id": cl.id,
        "match": {
            "overall_score": m.overall_score,
            "breakdown": m.score_weights or {},
            "strengths": m.strengths or [],
            "reasoning": m.reasoning,
            "recommendation": m.recommendation
        },
        "skill_gap": sg_dict,
        "tailored_resume": {
            "id": tr.id,
            "title": tr.title,
            "document_type": tr.document_type,
            "content": tr.content
        },
        "cover_letter": {
            "id": cl.id,
            "title": cl.title,
            "document_type": cl.document_type,
            "content": cl.content
        },
        "application": {
            "id": app.id,
            "status": app.status,
            "job_id": app.job_id
        }
    }
