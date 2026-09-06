from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.application import Application
from app.models.ai_activity import AIActivity
from app.schemas.auth import (
    AdminStatsResponse,
    AdminUserItem,
    AdminUsersListResponse,
    AdminUserUpdateStatusRequest,
    UserResponse
)
from app.schemas.evaluation import EvaluationMetricsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/admin", tags=["Admin Dashboard & Management"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_system_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminStatsResponse:
    """Retrieve platform-wide statistics for the Administrator Dashboard."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.role == "admin").count()
    total_resumes = db.query(Resume).count()
    total_jobs = db.query(Job).count()
    total_applications = db.query(Application).count()
    total_ai_activities = db.query(AIActivity).count()

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        total_resumes=total_resumes,
        total_jobs=total_jobs,
        total_applications=total_applications,
        total_ai_activities=total_ai_activities,
        ai_provider=settings.AI_PROVIDER,
        configured_model=settings.GEMINI_MODEL if settings.AI_PROVIDER == "gemini" else "mock-engine"
    )

@router.get("/users", response_model=AdminUsersListResponse)
def list_admin_users(
    search: Optional[str] = Query(None, description="Filter by name or email"),
    role: Optional[str] = Query(None, description="Filter by role ('user' or 'admin')"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminUsersListResponse:
    """List all registered users with activity counts (resumes, applications) and roles."""
    query = db.query(User)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(User.email.ilike(s), User.full_name.ilike(s)))

    if role:
        query = query.filter(User.role == role)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    user_items = []
    for u in users:
        res_count = db.query(Resume).filter(Resume.user_id == u.id).count()
        app_count = db.query(Application).filter(Application.user_id == u.id).count()
        user_items.append(AdminUserItem(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            resumes_count=res_count,
            applications_count=app_count,
            created_at=u.created_at
        ))

    return AdminUsersListResponse(total=total, users=user_items)

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    data: AdminUserUpdateStatusRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> UserResponse:
    """Update user active status or role. Protects against self-deactivation and self-demotion."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

    # Protect self-lockout
    if target_user.id == current_admin.id:
        if data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda tidak dapat menonaktifkan akun admin Anda sendiri."
            )
        if data.role and data.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Anda tidak dapat menurunkan role akun admin Anda sendiri."
            )

    if data.is_active is not None:
        target_user.is_active = data.is_active

    if data.role is not None:
        target_user.role = data.role

    db.commit()
    db.refresh(target_user)
    return UserResponse.model_validate(target_user)

@router.get("/ai-metrics", response_model=EvaluationMetricsResponse)
def get_admin_ai_metrics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> EvaluationMetricsResponse:
    """Retrieve system-wide AI observability, latency, and success metrics."""
    return DashboardService.get_evaluation_metrics(db)

@router.get("/system-health")
def get_admin_system_health(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """Retrieve detailed system diagnostics and operational status."""
    return {
        "status": "operational",
        "service": "JobHunter AI Engine",
        "database": "connected",
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "configured_model": settings.GEMINI_MODEL,
        "fallback_model": settings.GEMINI_FALLBACK_MODEL,
        "api_v1_path": settings.API_V1_STR
    }
