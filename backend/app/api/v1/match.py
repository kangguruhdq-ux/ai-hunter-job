from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.match import JobMatchResponse
from app.schemas.job import JobResponse
from app.services.match_service import MatchService

router = APIRouter(tags=["Matching"])

@router.post("/jobs/{job_id}/match", response_model=JobMatchResponse)
async def calculate_job_match(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Calculate explainable match compatibility between current candidate profile and specified job.
    Computes Skills (40%), Experience (25%), Responsibilities (20%), Education (10%), Keywords (5%).
    """
    try:
        match_record = await MatchService.match_candidate_to_job(db=db, job_id=job_id)
        return match_record
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating job match. Please ensure profile is extracted."
        )

@router.get("/jobs/{job_id}/match", response_model=Optional[JobMatchResponse])
async def get_job_match(
    job_id: str,
    auto_calculate: bool = Query(True, description="Auto calculate if not yet matched"),
    db: Session = Depends(get_db)
):
    """Get match details, strengths, and skill gaps for a specific job."""
    match_record = MatchService.get_job_match(db=db, job_id=job_id)
    if not match_record and auto_calculate:
        try:
            match_record = await MatchService.match_candidate_to_job(db=db, job_id=job_id)
        except Exception:
            return None
    return match_record

@router.get("/jobs/recommended/ranked", response_model=List[Dict[str, Any]])
async def get_recommended_jobs_ranked(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Retrieve jobs ranked by AI match score against the active candidate profile."""
    ranked = await MatchService.get_recommended_jobs(db=db, limit=limit)
    response_list = []
    for item in ranked:
        job = item["job"]
        match = item["match"]
        response_list.append({
            "job": JobResponse.model_validate(job),
            "match": JobMatchResponse.model_validate(match) if match else None,
            "overall_score": item["score"]
        })
    return response_list

from app.schemas.recommendation import JobSkillGapAnalysisResponse
from app.services.recommendation_service import RecommendationService

@router.get("/jobs/{job_id}/skill-gap", response_model=JobSkillGapAnalysisResponse)
async def get_job_skill_gap_analysis(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Get in-depth skill gap analysis categorizing skills into
    Already Strong, Some Experience, Needs Improvement, and Missing,
    along with actionable preparation steps and interview focus areas.
    """
    try:
        return await RecommendationService.get_skill_gap_analysis(db=db, job_id=job_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate skill gap analysis: {str(e)}"
        )

