import os
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from app.core.config import settings
from app.core.security import hash_password
from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job, JobRequirement
from app.models.job_match import JobMatch
from app.models.application import Application
from app.models.ai_activity import AIActivity
from app.models.generated_document import GeneratedDocument
from app.schemas.auth import (
    AdminStatsResponse,
    AdminUserItem,
    AdminUsersListResponse,
    AdminUserCreateRequest,
    AdminUserUpdateRequest,
    AdminUserUpdateStatusRequest,
    UserResponse,
    AdminResumeItem,
    AdminResumesListResponse,
    AdminJobItem,
    AdminJobsListResponse,
    AdminJobCreateRequest,
    AdminJobUpdateRequest,
    AdminApplicationItem,
    AdminApplicationsListResponse,
    AdminApplicationStatusUpdateRequest,
    AdminDocumentItem,
    AdminDocumentsListResponse,
    AdminAIActivityItem,
    AdminAIActivitiesListResponse,
    AdminAIActivityStatsResponse
)
from app.schemas.evaluation import EvaluationMetricsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/admin", tags=["Admin Command Center"])

# ==================== 1. PLATFORM OVERVIEW STATS ====================

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_system_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminStatsResponse:
    """Retrieve platform-wide telemetry statistics for the Administrator Dashboard."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.role == "admin").count()
    total_resumes = db.query(Resume).count()
    total_jobs = db.query(Job).count()
    total_applications = db.query(Application).count()
    total_ai_activities = db.query(AIActivity).count()

    fallbacks = [m.strip() for m in getattr(settings, "GEMINI_FALLBACK_MODELS", "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash").split(",") if m.strip()]

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        total_resumes=total_resumes,
        total_jobs=total_jobs,
        total_applications=total_applications,
        total_ai_activities=total_ai_activities,
        ai_provider=settings.AI_PROVIDER,
        configured_model=settings.GEMINI_MODEL if settings.AI_PROVIDER == "gemini" else "mock-engine",
        fallback_models=fallbacks
    )

# ==================== 2. USER MANAGEMENT CRUD ====================

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    data: AdminUserCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> UserResponse:
    """Create a new user account with secure password hashing and specified role."""
    clean_email = data.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{clean_email}' sudah terdaftar dalam sistem."
        )

    user = User(
        id=str(uuid.uuid4()),
        email=clean_email,
        full_name=data.full_name.strip(),
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=data.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.get("/users", response_model=AdminUsersListResponse)
def list_admin_users(
    search: Optional[str] = Query(None, description="Filter by name or email"),
    role: Optional[str] = Query(None, description="Filter by role ('user' or 'admin')"),
    status_filter: Optional[str] = Query(None, description="Filter by status ('active' or 'inactive')"),
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

    if status_filter == "active":
        query = query.filter(User.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(User.is_active == False)

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

@router.get("/users/{user_id}", response_model=AdminUserItem)
def get_admin_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminUserItem:
    """Retrieve detailed information and statistics for a specific user."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

    res_count = db.query(Resume).filter(Resume.user_id == target.id).count()
    app_count = db.query(Application).filter(Application.user_id == target.id).count()

    return AdminUserItem(
        id=target.id,
        email=target.email,
        full_name=target.full_name,
        role=target.role,
        is_active=target.is_active,
        resumes_count=res_count,
        applications_count=app_count,
        created_at=target.created_at
    )

@router.put("/users/{user_id}", response_model=UserResponse)
def update_admin_user(
    user_id: str,
    data: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> UserResponse:
    """Update user information, credentials, or status. Protects against self-demotion."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

    # Self-lockout safeguards
    if target.id == current_admin.id:
        if data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Proteksi Keamanan: Anda tidak dapat menonaktifkan akun admin Anda sendiri."
            )
        if data.role and data.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Proteksi Keamanan: Anda tidak dapat menurunkan peran akun admin Anda sendiri."
            )

    if data.email:
        clean_email = data.email.strip().lower()
        if clean_email != target.email:
            existing = db.query(User).filter(User.email == clean_email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Email '{clean_email}' sudah digunakan oleh akun lain."
                )
            target.email = clean_email

    if data.full_name:
        target.full_name = data.full_name.strip()

    if data.role:
        target.role = data.role

    if data.is_active is not None:
        target.is_active = data.is_active

    if data.password:
        target.password_hash = hash_password(data.password)

    target.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(target)
    return UserResponse.model_validate(target)

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    data: AdminUserUpdateStatusRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> UserResponse:
    """Update user active status or role with self-lockout protection."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

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

    target_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(target_user)
    return UserResponse.model_validate(target_user)

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Safely delete a user account and cascade associated records.
    Protects against self-deletion.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found."
        )

    if target.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proteksi Keamanan: Anda tidak dapat menghapus akun admin Anda sendiri."
        )

    try:
        # Reassign or nullify activities to preserve audit history
        db.query(AIActivity).filter(AIActivity.user_id == target.id).update({AIActivity.user_id: None})
        db.delete(target)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menghapus user: {str(e)}"
        )
    return None

# ==================== 3. RESUME MANAGEMENT ====================

@router.get("/resumes", response_model=AdminResumesListResponse)
def list_admin_resumes(
    search: Optional[str] = Query(None, description="Search by file name or candidate name/email"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by parsing status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminResumesListResponse:
    """List all candidate resumes uploaded to the platform."""
    query = db.query(Resume).join(User, Resume.user_id == User.id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Resume.file_name.ilike(s), User.email.ilike(s), User.full_name.ilike(s)))

    if user_id:
        query = query.filter(Resume.user_id == user_id)

    if status:
        query = query.filter(Resume.status == status)

    total = query.count()
    resumes = query.order_by(Resume.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for r in resumes:
        items.append(AdminResumeItem(
            id=r.id,
            user_id=r.user_id,
            user_email=r.user.email if r.user else "Unknown",
            user_name=r.user.full_name if r.user else "Unknown",
            file_name=r.file_name,
            file_type=r.file_type,
            file_size=r.file_size,
            status=r.status,
            created_at=r.created_at
        ))

    return AdminResumesListResponse(total=total, resumes=items)

@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete a resume and remove its storage file if present."""
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    if resume.storage_path and os.path.exists(resume.storage_path):
        try:
            os.remove(resume.storage_path)
        except OSError:
            pass

    db.delete(resume)
    db.commit()
    return None

# ==================== 4. JOB MANAGEMENT CRUD ====================

@router.post("/jobs", response_model=AdminJobItem, status_code=status.HTTP_201_CREATED)
def create_admin_job(
    data: AdminJobCreateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminJobItem:
    """Create a new job opportunity and structured requirement profile."""
    job_id = str(uuid.uuid4())
    job = Job(
        id=job_id,
        title=data.title.strip(),
        company=data.company.strip(),
        location=data.location or "Remote",
        employment_type=data.employment_type or "Full-time",
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        salary_currency=data.salary_currency or "USD",
        raw_description=data.raw_description,
        source_type="admin",
        is_active=data.is_active
    )
    db.add(job)

    req = JobRequirement(
        id=str(uuid.uuid4()),
        job_id=job_id,
        required_skills=data.required_skills,
        responsibilities=data.responsibilities
    )
    db.add(req)

    db.commit()
    db.refresh(job)

    return AdminJobItem(
        id=job.id,
        title=job.title,
        company=job.company,
        location=job.location,
        employment_type=job.employment_type,
        source_type=job.source_type,
        is_active=job.is_active,
        matches_count=0,
        applications_count=0,
        created_at=job.created_at
    )

@router.get("/jobs", response_model=AdminJobsListResponse)
def list_admin_jobs(
    search: Optional[str] = Query(None, description="Search title or company"),
    company: Optional[str] = Query(None, description="Filter by company"),
    location: Optional[str] = Query(None, description="Filter by location"),
    is_active: Optional[bool] = Query(None, description="Filter active/inactive"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminJobsListResponse:
    """List all indexed jobs with match and application counts."""
    query = db.query(Job)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Job.title.ilike(s), Job.company.ilike(s)))

    if company:
        query = query.filter(Job.company.ilike(f"%{company.strip()}%"))

    if location:
        query = query.filter(Job.location.ilike(f"%{location.strip()}%"))

    if is_active is not None:
        query = query.filter(Job.is_active == is_active)

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for j in jobs:
        m_count = db.query(JobMatch).filter(JobMatch.job_id == j.id).count()
        a_count = db.query(Application).filter(Application.job_id == j.id).count()
        items.append(AdminJobItem(
            id=j.id,
            title=j.title,
            company=j.company,
            location=j.location,
            employment_type=j.employment_type,
            source_type=j.source_type,
            is_active=j.is_active,
            matches_count=m_count,
            applications_count=a_count,
            created_at=j.created_at
        ))

    return AdminJobsListResponse(total=total, jobs=items)

@router.get("/jobs/{job_id}")
def get_admin_job_detail(
    job_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Retrieve full detail for a job opportunity."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    m_count = db.query(JobMatch).filter(JobMatch.job_id == job.id).count()
    a_count = db.query(Application).filter(Application.job_id == job.id).count()

    req = job.requirements
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "employment_type": job.employment_type,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency,
        "raw_description": job.raw_description,
        "source_type": job.source_type,
        "is_active": job.is_active,
        "matches_count": m_count,
        "applications_count": a_count,
        "required_skills": req.required_skills if req else [],
        "responsibilities": req.responsibilities if req else [],
        "created_at": job.created_at
    }

@router.put("/jobs/{job_id}", response_model=AdminJobItem)
def update_admin_job(
    job_id: str,
    data: AdminJobUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminJobItem:
    """Update job listing metadata and requirements."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    if data.title is not None:
        job.title = data.title.strip()
    if data.company is not None:
        job.company = data.company.strip()
    if data.location is not None:
        job.location = data.location
    if data.employment_type is not None:
        job.employment_type = data.employment_type
    if data.salary_min is not None:
        job.salary_min = data.salary_min
    if data.salary_max is not None:
        job.salary_max = data.salary_max
    if data.salary_currency is not None:
        job.salary_currency = data.salary_currency
    if data.raw_description is not None:
        job.raw_description = data.raw_description
    if data.is_active is not None:
        job.is_active = data.is_active

    if data.required_skills is not None or data.responsibilities is not None:
        req = job.requirements
        if not req:
            req = JobRequirement(id=str(uuid.uuid4()), job_id=job.id)
            db.add(req)
        if data.required_skills is not None:
            req.required_skills = data.required_skills
        if data.responsibilities is not None:
            req.responsibilities = data.responsibilities

    job.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(job)

    m_count = db.query(JobMatch).filter(JobMatch.job_id == job.id).count()
    a_count = db.query(Application).filter(Application.job_id == job.id).count()

    return AdminJobItem(
        id=job.id,
        title=job.title,
        company=job.company,
        location=job.location,
        employment_type=job.employment_type,
        source_type=job.source_type,
        is_active=job.is_active,
        matches_count=m_count,
        applications_count=a_count,
        created_at=job.created_at
    )

@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete a job opportunity and cascade requirements and applications."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    db.delete(job)
    db.commit()
    return None

# ==================== 5. APPLICATION MANAGEMENT ====================

@router.get("/applications", response_model=AdminApplicationsListResponse)
def list_admin_applications(
    status: Optional[str] = Query(None, description="Filter by application stage"),
    user_id: Optional[str] = Query(None, description="Filter by candidate user ID"),
    search: Optional[str] = Query(None, description="Search company, job title, or candidate name/email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminApplicationsListResponse:
    """List all candidate job applications across the entire platform."""
    query = db.query(Application).join(User, Application.user_id == User.id).join(Job, Application.job_id == Job.id)

    if status:
        query = query.filter(Application.status == status)

    if user_id:
        query = query.filter(Application.user_id == user_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            Job.company.ilike(s),
            Job.title.ilike(s),
            User.email.ilike(s),
            User.full_name.ilike(s)
        ))

    total = query.count()
    apps = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for a in apps:
        items.append(AdminApplicationItem(
            id=a.id,
            user_id=a.user_id,
            user_email=a.user.email if a.user else "Unknown",
            user_name=a.user.full_name if a.user else "Unknown",
            job_id=a.job_id,
            job_title=a.job.title if a.job else "Unknown",
            company=a.job.company if a.job else "Unknown",
            status=a.status,
            applied_date=str(a.created_at.date()) if a.created_at else None,
            interview_date=str(a.interview_date) if a.interview_date else None,
            notes=a.notes,
            created_at=a.created_at,
            updated_at=a.updated_at
        ))

    return AdminApplicationsListResponse(total=total, applications=items)

@router.patch("/applications/{app_id}/status", response_model=AdminApplicationItem)
def update_admin_application_status(
    app_id: str,
    data: AdminApplicationStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminApplicationItem:
    """Update the recruitment stage or interview notes of an application."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    app.status = data.status
    if data.notes is not None:
        app.notes = data.notes
    if data.interview_date is not None:
        try:
            app.interview_date = datetime.fromisoformat(data.interview_date) if data.interview_date else None
        except ValueError:
            pass

    app.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app)

    return AdminApplicationItem(
        id=app.id,
        user_id=app.user_id,
        user_email=app.user.email if app.user else "Unknown",
        user_name=app.user.full_name if app.user else "Unknown",
        job_id=app.job_id,
        job_title=app.job.title if app.job else "Unknown",
        company=app.job.company if app.job else "Unknown",
        status=app.status,
        applied_date=str(app.created_at.date()) if app.created_at else None,
        interview_date=str(app.interview_date) if app.interview_date else None,
        notes=app.notes,
        created_at=app.created_at,
        updated_at=app.updated_at
    )

@router.delete("/applications/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_application(
    app_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete an application entry from the system."""
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    db.delete(app)
    db.commit()
    return None

# ==================== 6. GENERATED DOCUMENTS MANAGEMENT ====================

@router.get("/documents", response_model=AdminDocumentsListResponse)
def list_admin_documents(
    document_type: Optional[str] = Query(None, description="Filter by type (tailored_resume or cover_letter)"),
    search: Optional[str] = Query(None, description="Search document title or candidate"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminDocumentsListResponse:
    """List all AI-generated application documents."""
    query = db.query(GeneratedDocument).join(User, GeneratedDocument.user_id == User.id)

    if document_type:
        query = query.filter(GeneratedDocument.document_type == document_type)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(
            GeneratedDocument.title.ilike(s),
            User.email.ilike(s),
            User.full_name.ilike(s)
        ))

    total = query.count()
    docs = query.order_by(GeneratedDocument.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for d in docs:
        job = db.query(Job).filter(Job.id == d.job_id).first() if d.job_id else None
        items.append(AdminDocumentItem(
            id=d.id,
            user_id=d.user_id,
            user_email=d.user.email if d.user else "Unknown",
            user_name=d.user.full_name if d.user else "Unknown",
            job_id=d.job_id,
            job_title=job.title if job else None,
            company=job.company if job else None,
            document_type=d.document_type,
            title=d.title,
            anti_hallucination_verified=d.anti_hallucination_verified,
            created_at=d.created_at
        ))

    return AdminDocumentsListResponse(total=total, documents=items)

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete a generated document."""
    doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    db.delete(doc)
    db.commit()
    return None

# ==================== 7. AI ACTIVITY MONITORING & TELEMETRY ====================

@router.get("/ai-activities", response_model=AdminAIActivitiesListResponse)
def list_admin_ai_activities(
    status: Optional[str] = Query(None, description="Filter by status ('completed', 'failed', etc.)"),
    agent_name: Optional[str] = Query(None, description="Filter by agent name"),
    model_name: Optional[str] = Query(None, description="Filter by model used"),
    fallback_used: Optional[bool] = Query(None, description="Filter whether fallback model was triggered"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminAIActivitiesListResponse:
    """Retrieve detailed execution logs for all AI operations."""
    query = db.query(AIActivity)

    if status:
        query = query.filter(AIActivity.status == status)

    if agent_name:
        query = query.filter(AIActivity.agent_name == agent_name)

    total = query.count()
    activities = query.order_by(AIActivity.started_at.desc()).offset(skip).limit(limit).all()

    items = []
    for a in activities:
        user = db.query(User).filter(User.id == a.user_id).first() if a.user_id else None
        meta = a.activity_metadata or {}

        # Extract telemetry fields
        req_model = meta.get("requested_model") or settings.GEMINI_MODEL
        succ_model = meta.get("successful_model") or (req_model if a.status == "completed" else None)
        fb_used = bool(meta.get("fallback_used", False))

        if fallback_used is not None and fb_used != fallback_used:
            continue

        if model_name and model_name.lower() not in (succ_model or "").lower():
            continue

        items.append(AdminAIActivityItem(
            id=a.id,
            user_id=a.user_id,
            user_email=user.email if user else None,
            agent_name=a.agent_name,
            action=a.action,
            status=a.status,
            started_at=a.started_at,
            duration_ms=a.duration_ms,
            error=a.error,
            requested_model=req_model,
            successful_model=succ_model,
            fallback_used=fb_used,
            metadata=meta
        ))

    return AdminAIActivitiesListResponse(total=total, activities=items)

@router.get("/ai-activities/stats", response_model=AdminAIActivityStatsResponse)
def get_admin_ai_activity_stats(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> AdminAIActivityStatsResponse:
    """Calculate platform-wide AI performance and error rates."""
    total = db.query(AIActivity).count()
    if total == 0:
        return AdminAIActivityStatsResponse(
            total_operations=0,
            success_rate=100.0,
            failure_rate=0.0,
            average_latency_ms=0.0,
            fallback_rate=0.0,
            rate_429=0.0,
            rate_500=0.0
        )

    completed = db.query(AIActivity).filter(AIActivity.status == "completed").count()
    failed = db.query(AIActivity).filter(AIActivity.status == "failed").count()

    avg_latency = db.query(func.avg(AIActivity.duration_ms)).filter(AIActivity.status == "completed").scalar() or 0.0

    all_activities = db.query(AIActivity).all()
    fallback_count = 0
    count_429 = 0
    count_500 = 0

    for a in all_activities:
        meta = a.activity_metadata or {}
        if meta.get("fallback_used"):
            fallback_count += 1
        err = (a.error or "").lower()
        if "429" in err or "resource_exhausted" in err or "quota" in err:
            count_429 += 1
        elif "500" in err or "internal server error" in err or "503" in err:
            count_500 += 1

    return AdminAIActivityStatsResponse(
        total_operations=total,
        success_rate=round((completed / total) * 100.0, 1),
        failure_rate=round((failed / total) * 100.0, 1),
        average_latency_ms=round(float(avg_latency), 1),
        fallback_rate=round((fallback_count / total) * 100.0, 1),
        rate_429=round((count_429 / total) * 100.0, 1),
        rate_500=round((count_500 / total) * 100.0, 1)
    )

# ==================== 8. SYSTEM HEALTH & DIAGNOSTICS ====================

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
    fallbacks = [m.strip() for m in getattr(settings, "GEMINI_FALLBACK_MODELS", "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash").split(",") if m.strip()]

    return {
        "status": "operational",
        "service": "JobHunter AI Engine",
        "database": {
            "status": "connected",
            "dialect": "sqlite",
            "path": settings.DATABASE_URL
        },
        "environment": settings.ENVIRONMENT,
        "ai_provider": {
            "name": settings.AI_PROVIDER,
            "configured_model": settings.GEMINI_MODEL,
            "fallback_models": fallbacks,
            "quota_status": "ready"
        },
        "security": {
            "jwt_algorithm": settings.JWT_ALGORITHM,
            "token_expiry_hours": settings.ACCESS_TOKEN_EXPIRE_MINUTES // 60,
            "rbac_enforced": True
        },
        "anti_hallucination_guard": {
            "status": "enforced",
            "strict_grounding": True
        },
        "api_v1_path": settings.API_V1_STR
    }

@router.get("/settings")
def get_admin_settings(
    current_admin: User = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """Retrieve non-sensitive platform configurations."""
    fallbacks = [m.strip() for m in getattr(settings, "GEMINI_FALLBACK_MODELS", "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash").split(",") if m.strip()]
    return {
        "project_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "gemini_model": settings.GEMINI_MODEL,
        "gemini_fallback_models": fallbacks,
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024),
        "cors_origins": settings.CORS_ORIGINS,
        "token_expiry_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES
    }
