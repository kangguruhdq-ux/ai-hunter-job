from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.resume import ResumeUploadResponse, ResumeDetailResponse
from app.services.resume_service import ResumeService
from app.agents.resume_agent import ResumeParsingError

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and extract text from a PDF or DOCX resume.
    Validates file format, size, and extracts text content into the database.
    """
    try:
        resume = await ResumeService.process_resume_upload(db=db, file=file)
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
def get_latest_resume(db: Session = Depends(get_db)):
    """Retrieve the most recently uploaded resume for the active user."""
    resume = ResumeService.get_latest_resume(db)
    if not resume:
        return None
    return resume

@router.get("/{resume_id}", response_model=ResumeDetailResponse)
def get_resume(resume_id: str, db: Session = Depends(get_db)):
    """Retrieve details and raw extracted text for a specific resume by ID."""
    resume = ResumeService.get_resume(db, resume_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume with ID '{resume_id}' not found."
        )
    return resume

@router.get("", response_model=List[ResumeDetailResponse])
def list_resumes(db: Session = Depends(get_db)):
    """List all uploaded resumes for the active user."""
    return ResumeService.list_resumes(db)
