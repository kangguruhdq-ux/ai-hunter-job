from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.resume import ResumeUploadResponse, ResumeDetailResponse
from app.services.resume_service import ResumeService
from app.agents.resume_agent import ResumeParsingError

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload and extract text from a PDF or DOCX resume.
    Validates file format, size, and extracts text content into the database scoped to current_user.
    """
    try:
        resume = await ResumeService.process_resume_upload(db=db, file=file, user_id=current_user.id)
        return ResumeUploadResponse(
            id=resume.id,
            file_name=resume.file_name,
            file_type=resume.file_type,
            file_size=resume.file_size,
            status=resume.status,
            created_at=resume.created_at,
            message="Resume uploaded and text extracted successfully."
        )
    except ResumeParsingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't analyze this resume. Please check the file and try again."
        )

@router.get("/latest", response_model=Optional[ResumeDetailResponse])
def get_latest_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the most recently uploaded resume for the authenticated user."""
    resume = ResumeService.get_latest_resume(db, user_id=current_user.id)
    if not resume:
        return None
    return resume

@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve details and raw extracted text for a specific resume by ID, ensuring user ownership."""
    resume = ResumeService.get_resume(db, resume_id, user_id=current_user.id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID '{resume_id}' not found."
        )
    return resume

@router.get("", response_model=List[ResumeDetailResponse])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all uploaded resumes for the authenticated user."""
    return ResumeService.list_resumes(db, user_id=current_user.id)

