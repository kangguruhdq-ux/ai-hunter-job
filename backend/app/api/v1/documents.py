from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.document import (
    GeneratedDocumentResponse, DocumentUpdateRequest
)
from app.services.document_service import DocumentService

router = APIRouter(tags=["Documents"])

@router.post("/jobs/{job_id}/tailored-resume", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
async def generate_tailored_resume(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate an ATS-optimized, tailored resume specifically targeted to this job.
    Strictly enforces anti-hallucination policies—only rewording verified candidate experience.
    """
    try:
        return await DocumentService.generate_tailored_resume(
            db=db, job_id=job_id, user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tailored resume: {str(e)}"
        )

@router.get("/jobs/{job_id}/tailored-resume", response_model=Optional[GeneratedDocumentResponse])
def get_latest_tailored_resume(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the most recent tailored resume generated for a job scoped to authenticated user."""
    return DocumentService.get_latest_job_document(
        db=db, job_id=job_id, document_type="tailored_resume", user_id=current_user.id
    )

@router.post("/jobs/{job_id}/cover-letter", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
async def generate_cover_letter(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate an authentic, customized cover letter for a specific job application.
    Grounded in candidate's verified achievements and aligned with employer's technology stack.
    """
    try:
        return await DocumentService.generate_cover_letter(
            db=db, job_id=job_id, user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cover letter: {str(e)}"
        )

@router.get("/jobs/{job_id}/cover-letter", response_model=Optional[GeneratedDocumentResponse])
def get_latest_cover_letter(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve the most recent cover letter generated for a job scoped to authenticated user."""
    return DocumentService.get_latest_job_document(
        db=db, job_id=job_id, document_type="cover_letter", user_id=current_user.id
    )

@router.get("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve details and markdown content for a generated document, ensuring user ownership."""
    doc = DocumentService.get_document(db, document_id, user_id=current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc

@router.put("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def update_document(
    document_id: str,
    data: DocumentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Edit content or title of an existing tailored resume or cover letter owned by current user."""
    try:
        return DocumentService.update_document(db, document_id, data, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/documents", response_model=List[GeneratedDocumentResponse])
def list_documents(
    document_type: Optional[str] = Query(None, description="Filter by tailored_resume or cover_letter"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all generated documents for the authenticated candidate."""
    return DocumentService.list_documents(
        db, document_type=document_type, job_id=job_id, user_id=current_user.id
    )

@router.get("/documents/{document_id}/download")
def download_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download the raw document as Markdown (.md) or Text file, ensuring user ownership."""
    doc = DocumentService.get_document(db, document_id, user_id=current_user.id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    safe_title = "".join(c for c in doc.title if c.isalnum() or c in (" ", "-", "_")).rstrip()
    filename = f"{safe_title}.md"
    return Response(
        content=doc.content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

