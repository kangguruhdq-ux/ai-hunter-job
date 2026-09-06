from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.job import (
    JobResponse, JobCreatePasted, JobCreateUrl, JobCreateManual
)
from app.services.job_service import JobService
from app.agents.job_agent import JobFetchError
from app.api.deps import get_current_admin_user
from app.models.user import User

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job_pasted(
    data: JobCreatePasted,
    db: Session = Depends(get_db)
):
    """
    Ingest and analyze a pasted job description using AI JobAgent.
    Extracts requirements, skills, experience level, and responsibilities.
    """
    try:
        job = await JobService.create_from_pasted(db=db, data=data)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to analyze job description: {str(e)}"
        )

@router.post("/import-url", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def import_job_from_url(
    data: JobCreateUrl,
    db: Session = Depends(get_db)
):
    """
    Ethically fetch and analyze a job posting from a public URL.
    Respects terms, anti-bot mechanisms, and timeouts.
    """
    try:
        job = await JobService.create_from_url(db=db, url=data.url)
        return job
    except JobFetchError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve this job automatically. Please paste the job description."
        )

@router.post("/manual", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job_manual(
    data: JobCreateManual,
    db: Session = Depends(get_db)
):
    """Manually add a structured job without running AI text analysis."""
    return JobService.create_manual(db=db, data=data)

@router.post("/seed", response_model=List[JobResponse])
def seed_sample_jobs(db: Session = Depends(get_db)):
    """Seed sample realistic engineering jobs (Stripe, Datadog, Linear, Airbnb)."""
    return JobService.seed_sample_jobs(db)

@router.get("", response_model=List[JobResponse])
def list_jobs(
    search: Optional[str] = Query(None, description="Search by title or company"),
    location: Optional[str] = Query(None, description="Filter by location"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List active jobs with optional text search and location filters."""
    # If no jobs exist in DB yet, auto-seed defaults for great immediate UX
    existing = JobService.list_jobs(db, search=search, location=location, limit=limit, offset=offset)
    if not existing and not search and offset == 0:
        JobService.seed_sample_jobs(db)
        existing = JobService.list_jobs(db, limit=limit, offset=offset)
    return existing

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    """Retrieve full details, responsibilities, and requirements for a single job."""
    job = JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Remove a job from active listings. Requires administrator role."""
    job = JobService.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    db.delete(job)
    db.commit()
    return None
