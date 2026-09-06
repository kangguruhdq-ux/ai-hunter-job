from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
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
    db: Session = Depends(get_db)
):
    """
    Retrieve recent AI agent activity logs for real-time observability.
    Provides execution duration in ms, actions performed, and operational status.
    """
    query = db.query(AIActivity)
    if agent_name:
        query = query.filter(AIActivity.agent_name == agent_name)
    return query.order_by(AIActivity.started_at.desc()).limit(limit).all()

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Retrieve summarized KPIs for the SaaS dashboard."""
    return await DashboardService.get_dashboard_stats(db)

@router.get("/evaluation", response_model=EvaluationMetricsResponse)
def get_evaluation_metrics(db: Session = Depends(get_db)):
    """Retrieve AI engineering observability metrics, success rates, and latencies."""
    return DashboardService.get_evaluation_metrics(db)

@router.post("/pipeline/{job_id}", response_model=Dict[str, Any])
async def run_orchestrator_pipeline(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Run full end-to-end orchestration pipeline:
    Calculates match -> Tailors resume -> Generates cover letter.
    Emits real-time AI activity events.
    """
    result = await Orchestrator.run_full_pipeline(db=db, job_id=job_id)
    return {
        "status": result["status"],
        "job_id": job_id,
        "match_score": result["match"].overall_score,
        "tailored_resume_id": result["tailored_resume"].id,
        "cover_letter_id": result["cover_letter"].id
    }
