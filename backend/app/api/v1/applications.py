from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationResponse, KanbanColumnResponse
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    data: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """Create a new job application tracker entry."""
    try:
        return ApplicationService.create_application(db=db, data=data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/kanban", response_model=List[KanbanColumnResponse])
def get_kanban_board(
    include_archived: bool = Query(False, description="Include archived applications"),
    db: Session = Depends(get_db)
):
    """Retrieve all applications grouped into the 8 Kanban lifecycle stages."""
    return ApplicationService.get_kanban_board(db=db, include_archived=include_archived)

@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    status: Optional[str] = Query(None, description="Filter by status"),
    include_archived: bool = Query(False, description="Include archived"),
    db: Session = Depends(get_db)
):
    """List all tracked job applications."""
    return ApplicationService.list_applications(
        db=db, status=status, include_archived=include_archived
    )

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific tracked application."""
    app = ApplicationService.get_application(db, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return app

@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    data: ApplicationUpdate,
    db: Session = Depends(get_db)
):
    """Update status (e.g. drag-and-drop to Interview), notes, salary, or interview date."""
    try:
        return ApplicationService.update_application(db, application_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: str, db: Session = Depends(get_db)):
    """Delete a tracked job application."""
    deleted = ApplicationService.delete_application(db, application_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return None
