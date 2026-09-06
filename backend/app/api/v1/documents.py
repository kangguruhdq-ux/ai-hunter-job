from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.document import (
    GeneratedDocumentResponse, DocumentUpdateRequest
)
from app.services.document_service import DocumentService

router = APIRouter(tags=["Documents"])

@router.post("/jobs/{job_id}/tailored-resume", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
async def generate_tailored_resume(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate an ATS-optimized, tailored resume specifically targeted to this job.
    Strictly enforces anti-hallucination policies—only rewording verified candidate experience.
    """
    try:
        return await DocumentService.generate_tailored_resume(db=db, job_id=job_id)
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
    db: Session = Depends(get_db)
):
    """Retrieve the most recent tailored resume generated for a job."""
    return DocumentService.get_latest_job_document(
        db=db, job_id=job_id, document_type="tailored_resume"
    )

@router.get("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Retrieve details and markdown content for a generated document."""
    doc = DocumentService.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc

@router.put("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def update_document(
    document_id: str,
    data: DocumentUpdateRequest,
    db: Session = Depends(get_db)
):
    """Edit content or title of an existing tailored resume or cover letter."""
    try:
        return DocumentService.update_document(db, document_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/documents", response_model=List[GeneratedDocumentResponse])
def list_documents(
    document_type: Optional[str] = Query(None, description="Filter by tailored_resume or cover_letter"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    db: Session = Depends(get_db)
):
    """List all generated documents for the candidate."""
    return DocumentService.list_documents(db, document_type=document_type, job_id=job_id)

@router.get("/documents/{document_id}/download")
def download_document(document_id: str, db: Session = Depends(get_db)):
    """Download the raw document as Markdown (.md) or Text file."""
    doc = DocumentService.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    safe_title = "".join(c for c in doc.title if c.isalnum() or c in (" ", "-", "_")).rstrip()
    filename = f"{safe_title}.md"
    return Response(
        content=doc.content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
