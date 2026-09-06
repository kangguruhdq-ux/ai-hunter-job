from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from app.models.application import Application
from app.models.job import Job
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, VALID_STATUSES, KanbanColumnResponse
)
from app.services.resume_service import ResumeService
from app.services.job_service import JobService

class ApplicationService:
    @classmethod
    def create_application(
        cls,
        db: Session,
        data: ApplicationCreate,
        user_id: Optional[str] = None
    ) -> Application:
        if not user_id:
            user = ResumeService.get_or_create_default_user(db)
            user_id = user.id

        job = JobService.get_job(db, data.job_id)
        if not job:
            raise ValueError(f"Job with ID '{data.job_id}' not found.")

        status = data.status if data.status in VALID_STATUSES else "Wishlist"

        # Check existing application
        existing = db.query(Application).filter(
            Application.user_id == user_id,
            Application.job_id == data.job_id
        ).first()

        if existing:
            # Update status instead of failing
            existing.status = status
            if data.notes:
                existing.notes = data.notes
            if data.salary_offered:
                existing.salary_offered = data.salary_offered
            if data.interview_date:
                existing.interview_date = data.interview_date
            if data.job_url:
                existing.job_url = data.job_url
            existing.is_archived = False
            db.commit()
            db.refresh(existing)
            return existing

        app = Application(
            user_id=user_id,
            job_id=data.job_id,
            status=status,
            notes=data.notes,
            salary_offered=data.salary_offered,
            interview_date=data.interview_date,
            job_url=data.job_url or job.source_url,
            is_archived=False
        )
        db.add(app)
        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def get_application(db: Session, application_id: str, user_id: Optional[str] = None) -> Optional[Application]:
        query = db.query(Application).filter(Application.id == application_id)
        if user_id:
            query = query.filter(Application.user_id == user_id)
        return query.first()

    @classmethod
    def update_application(
        cls,
        db: Session,
        application_id: str,
        data: ApplicationUpdate,
        user_id: Optional[str] = None
    ) -> Application:
        app = cls.get_application(db, application_id, user_id=user_id)
        if not app:
            raise ValueError(f"Application with ID '{application_id}' not found.")


        if data.status is not None:
            if data.status not in VALID_STATUSES:
                raise ValueError(f"Invalid status '{data.status}'. Must be one of {VALID_STATUSES}")
            app.status = data.status

        if data.notes is not None:
            app.notes = data.notes

        if data.salary_offered is not None:
            app.salary_offered = data.salary_offered

        if data.interview_date is not None:
            app.interview_date = data.interview_date

        if data.job_url is not None:
            app.job_url = data.job_url

        if data.is_archived is not None:
            app.is_archived = data.is_archived

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def list_applications(
        db: Session,
        status: Optional[str] = None,
        include_archived: bool = False,
        user_id: Optional[str] = None
    ) -> List[Application]:
        query = db.query(Application)
        if user_id:
            query = query.filter(Application.user_id == user_id)
        if not include_archived:
            query = query.filter(Application.is_archived == False)
        if status:
            query = query.filter(Application.status == status)

        return query.order_by(Application.updated_at.desc()).all()

    @classmethod
    def get_kanban_board(
        cls,
        db: Session,
        include_archived: bool = False,
        user_id: Optional[str] = None
    ) -> List[Dict]:
        applications = cls.list_applications(db, include_archived=include_archived, user_id=user_id)

        grouped: Dict[str, List[Application]] = {s: [] for s in VALID_STATUSES}
        for app in applications:
            if app.status in grouped:
                grouped[app.status].append(app)
            else:
                grouped["Wishlist"].append(app)

        columns = []
        for s in VALID_STATUSES:
            apps = grouped[s]
            columns.append({
                "status": s,
                "title": s,
                "count": len(apps),
                "applications": apps
            })
        return columns

    @staticmethod
    def delete_application(db: Session, application_id: str, user_id: Optional[str] = None) -> bool:
        query = db.query(Application).filter(Application.id == application_id)
        if user_id:
            query = query.filter(Application.user_id == user_id)
        app = query.first()
        if not app:
            return False
        db.delete(app)
        db.commit()
        return True

