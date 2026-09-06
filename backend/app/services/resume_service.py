import os
import uuid
from typing import Optional, List
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging import logger
from app.models.resume import Resume
from app.models.user import User
from app.agents.resume_agent import ResumeAgent, ResumeParsingError
from app.services.activity_service import ActivityService

class ResumeService:
    @staticmethod
    def get_or_create_default_user(db: Session) -> User:
        user = db.query(User).filter(User.email == "candidate@jobhunter.ai").first()
        if not user:
            user = User(
                email="candidate@jobhunter.ai",
                full_name="Alex Mercer"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @classmethod
    async def process_resume_upload(
        cls,
        db: Session,
        file: UploadFile,
        user_id: Optional[str] = None
    ) -> Resume:
        if not user_id:
            user = cls.get_or_create_default_user(db)
            user_id = user.id

        # 1. Read file bytes
        content = await file.read()
        file_size = len(content)

        # 2. Validate file
        ext = ResumeAgent.validate_file(file.filename or "", file_size, settings.MAX_UPLOAD_SIZE_BYTES)

        # 3. Save to storage
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        unique_filename = f"{uuid.uuid4()}{ext}"
        storage_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

        with open(storage_path, "wb") as f:
            f.write(content)

        # 4. Create resume record in DB
        resume = Resume(
            user_id=user_id,
            file_name=file.filename or f"resume{ext}",
            file_type=ext.replace(".", ""),
            file_size=file_size,
            storage_path=storage_path,
            status="processing"
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        # 5. Start AI Activity tracking
        activity = ActivityService.start_activity(
            db=db,
            agent_name="ResumeAgent",
            action="parse_resume_text",
            user_id=user_id,
            metadata={"file_name": resume.file_name, "file_type": resume.file_type}
        )

        # 6. Extract text
        try:
            raw_text, page_count = ResumeAgent.extract_text(storage_path, ext)
            resume.raw_text = raw_text
            resume.status = "parsed"
            resume.error_message = None
            db.commit()
            db.refresh(resume)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"page_count": page_count, "char_count": len(raw_text)}
            )
            logger.info(f"Resume {resume.id} successfully parsed ({len(raw_text)} chars).")
            return resume

        except ResumeParsingError as e:
            resume.status = "failed"
            resume.error_message = str(e)
            db.commit()
            db.refresh(resume)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="failed",
                error=str(e)
            )
            logger.warning(f"Resume {resume.id} parsing failed: {e}")
            raise

        except Exception as e:
            err_msg = "An unexpected error occurred while parsing the resume."
            resume.status = "failed"
            resume.error_message = err_msg
            db.commit()
            db.refresh(resume)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="failed",
                error=str(e)
            )
            logger.error(f"Unexpected error parsing resume {resume.id}: {e}", exc_info=True)
            raise ResumeParsingError(err_msg)

    @staticmethod
    def get_resume(db: Session, resume_id: str, user_id: Optional[str] = None) -> Optional[Resume]:
        query = db.query(Resume).filter(Resume.id == resume_id)
        if user_id:
            query = query.filter(Resume.user_id == user_id)
        return query.first()

    @staticmethod
    def get_latest_resume(db: Session, user_id: Optional[str] = None) -> Optional[Resume]:
        query = db.query(Resume)
        if user_id:
            query = query.filter(Resume.user_id == user_id)
        return query.order_by(Resume.created_at.desc()).first()

    @staticmethod
    def list_resumes(db: Session, user_id: Optional[str] = None) -> List[Resume]:
        query = db.query(Resume)
        if user_id:
            query = query.filter(Resume.user_id == user_id)
        return query.order_by(Resume.created_at.desc()).all()
