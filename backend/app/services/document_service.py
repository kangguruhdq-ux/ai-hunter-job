from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.job import Job
from app.models.candidate_profile import CandidateProfile
from app.models.generated_document import GeneratedDocument
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.document import (
    TailoredResumeData, CoverLetterData, DocumentUpdateRequest
)
from app.agents.resume_tailor_agent import ResumeTailorAgent
from app.agents.cover_letter_agent import CoverLetterAgent
from app.services.activity_service import ActivityService
from app.services.profile_service import ProfileService
from app.services.job_service import JobService

class DocumentService:
    @classmethod
    async def generate_tailored_resume(
        cls,
        db: Session,
        job_id: str,
        user_id: Optional[str] = None
    ) -> GeneratedDocument:
        job = JobService.get_job(db, job_id)
        if not job:
            raise ValueError(f"Job with ID '{job_id}' not found.")

        profile = ProfileService.get_candidate_profile(db, user_id=user_id)
        if not profile:
            raise ValueError("Candidate profile not found. Please upload a resume first.")

        activity = ActivityService.start_activity(
            db=db,
            agent_name="ResumeTailorAgent",
            action="generate_tailored_resume",
            user_id=profile.user_id,
            metadata={"job_id": job.id, "job_title": job.title, "company": job.company}
        )

        try:
            profile_data = CandidateProfileData(
                name=profile.name,
                headline=profile.headline,
                summary=profile.summary,
                location=profile.location,
                email=profile.email,
                phone=profile.phone,
                skills=profile.skills or [],
                programming_languages=profile.programming_languages or [],
                frameworks=profile.frameworks or [],
                tools=profile.tools or [],
                experience=profile.experience or [],
                education=profile.education or [],
                certifications=profile.certifications or [],
                projects=profile.projects or [],
                years_of_experience=profile.years_of_experience or 0.0
            )

            req = job.requirements
            job_analysis = JobAnalysisData(
                title=job.title,
                company=job.company,
                location=job.location,
                required_skills=req.required_skills if req else [],
                preferred_skills=req.preferred_skills if req else [],
                required_experience_years=req.required_experience_years if req else 3.0,
                responsibilities=req.responsibilities if req else [],
                keywords=req.keywords if req else [],
                summary=job.summary or ""
            )

            tailored_data: TailoredResumeData = await ResumeTailorAgent.tailor(profile_data, job_analysis)

            # Persist document
            doc = GeneratedDocument(
                user_id=profile.user_id,
                job_id=job.id,
                candidate_profile_id=profile.id,
                document_type="tailored_resume",
                title=tailored_data.title,
                content=tailored_data.tailored_markdown,
                tailored_changes=[c.model_dump() for c in tailored_data.tailored_changes],
                anti_hallucination_verified=tailored_data.anti_hallucination_verified
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"document_id": doc.id, "changes_count": len(tailored_data.tailored_changes)}
            )
            return doc

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            logger.error(f"Failed to generate tailored resume: {e}", exc_info=True)
            raise

    @classmethod
    async def generate_cover_letter(
        cls,
        db: Session,
        job_id: str,
        user_id: Optional[str] = None
    ) -> GeneratedDocument:
        job = JobService.get_job(db, job_id)
        if not job:
            raise ValueError(f"Job with ID '{job_id}' not found.")

        profile = ProfileService.get_candidate_profile(db, user_id=user_id)
        if not profile:
            raise ValueError("Candidate profile not found. Please upload a resume first.")

        activity = ActivityService.start_activity(
            db=db,
            agent_name="CoverLetterAgent",
            action="generate_cover_letter",
            user_id=profile.user_id,
            metadata={"job_id": job.id, "job_title": job.title, "company": job.company}
        )

        try:
            profile_data = CandidateProfileData(
                name=profile.name,
                headline=profile.headline,
                summary=profile.summary,
                location=profile.location,
                email=profile.email,
                phone=profile.phone,
                skills=profile.skills or [],
                programming_languages=profile.programming_languages or [],
                frameworks=profile.frameworks or [],
                tools=profile.tools or [],
                experience=profile.experience or [],
                education=profile.education or [],
                certifications=profile.certifications or [],
                projects=profile.projects or [],
                years_of_experience=profile.years_of_experience or 0.0
            )

            req = job.requirements
            job_analysis = JobAnalysisData(
                title=job.title,
                company=job.company,
                location=job.location,
                required_skills=req.required_skills if req else [],
                preferred_skills=req.preferred_skills if req else [],
                required_experience_years=req.required_experience_years if req else 3.0,
                responsibilities=req.responsibilities if req else [],
                keywords=req.keywords if req else [],
                summary=job.summary or ""
            )

            letter_data: CoverLetterData = await CoverLetterAgent.generate(
                profile=profile_data,
                job=job_analysis,
                company=job.company,
                job_title=job.title
            )

            doc = GeneratedDocument(
                user_id=profile.user_id,
                job_id=job.id,
                candidate_profile_id=profile.id,
                document_type="cover_letter",
                title=letter_data.title,
                content=letter_data.content,
                tailored_changes=[{"aspect": a} for a in letter_data.tailored_aspects],
                anti_hallucination_verified=letter_data.anti_hallucination_verified
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"document_id": doc.id, "char_count": len(doc.content)}
            )
            return doc

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            logger.error(f"Failed to generate cover letter: {e}", exc_info=True)
            raise


    @staticmethod
    def get_document(db: Session, document_id: str) -> Optional[GeneratedDocument]:
        return db.query(GeneratedDocument).filter(GeneratedDocument.id == document_id).first()

    @staticmethod
    def get_latest_job_document(
        db: Session,
        job_id: str,
        document_type: str,
        user_id: Optional[str] = None
    ) -> Optional[GeneratedDocument]:
        query = db.query(GeneratedDocument).filter(
            GeneratedDocument.job_id == job_id,
            GeneratedDocument.document_type == document_type
        )
        if user_id:
            query = query.filter(GeneratedDocument.user_id == user_id)
        return query.order_by(GeneratedDocument.created_at.desc()).first()

    @staticmethod
    def list_documents(
        db: Session,
        document_type: Optional[str] = None,
        job_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[GeneratedDocument]:
        query = db.query(GeneratedDocument)
        if document_type:
            query = query.filter(GeneratedDocument.document_type == document_type)
        if job_id:
            query = query.filter(GeneratedDocument.job_id == job_id)
        if user_id:
            query = query.filter(GeneratedDocument.user_id == user_id)
        return query.order_by(GeneratedDocument.created_at.desc()).all()

    @staticmethod
    def update_document(
        db: Session,
        document_id: str,
        data: DocumentUpdateRequest
    ) -> GeneratedDocument:
        doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == document_id).first()
        if not doc:
            raise ValueError(f"Document with ID '{document_id}' not found.")

        if data.title:
            doc.title = data.title
        doc.content = data.content

        db.commit()
        db.refresh(doc)
        return doc
