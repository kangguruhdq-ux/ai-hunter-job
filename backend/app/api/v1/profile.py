from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.candidate_profile import (
    CandidateProfileData, CandidateProfileResponse
)
from app.schemas.candidate_preference import (
    CandidatePreferenceData, CandidatePreferenceResponse
)
from app.services.profile_service import ProfileService
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/candidate", tags=["Candidate Profile"])

@router.post("/profile/extract/{resume_id}", response_model=CandidateProfileResponse)
async def extract_profile_from_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Extract structured candidate profile from an uploaded resume using AI.
    Runs ResumeAgent, populates candidate skills, experience, and education for current_user.
    """
    try:
        profile = await ProfileService.extract_and_save_profile(
            db=db, resume_id=resume_id, user_id=current_user.id
        )
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract candidate profile. Please check AI provider configuration."
        )

@router.post("/resume/analyze", response_model=CandidateProfileResponse)
async def analyze_latest_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Shortcut endpoint to analyze the most recently uploaded resume for current_user.
    """
    latest_resume = ResumeService.get_latest_resume(db, user_id=current_user.id)
    if not latest_resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume has been uploaded yet. Please upload a resume first."
        )
    return await extract_profile_from_resume(resume_id=latest_resume.id, db=db, current_user=current_user)

@router.get("/profile", response_model=Optional[CandidateProfileResponse])
def get_candidate_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the current active candidate profile for authenticated user."""
    profile = ProfileService.get_candidate_profile(db, user_id=current_user.id)
    if not profile:
        return None
    return profile

@router.put("/profile", response_model=CandidateProfileResponse)
def update_candidate_profile(
    profile_data: CandidateProfileData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update existing candidate profile fields, skills, or experience for authenticated user."""
    return ProfileService.update_candidate_profile(
        db=db, profile_data=profile_data, user_id=current_user.id
    )

@router.get("/preferences", response_model=CandidatePreferenceResponse)
def get_candidate_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve candidate career preferences and search filters (AI Memory) for authenticated user."""
    return ProfileService.get_or_create_preferences(db, user_id=current_user.id)

@router.put("/preferences", response_model=CandidatePreferenceResponse)
def update_candidate_preferences(
    pref_data: CandidatePreferenceData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update candidate career preferences for authenticated user."""
    return ProfileService.update_preferences(
        db=db, pref_data=pref_data, user_id=current_user.id
    )

