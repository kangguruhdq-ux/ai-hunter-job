from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.services.activity_service import ActivityService
from app.services.resume_service import ResumeService
from app.services.profile_service import ProfileService
from app.services.job_service import JobService
from app.services.match_service import MatchService
from app.services.document_service import DocumentService

class Orchestrator:
    """
    Central orchestration agent that coordinates the end-to-end user workflow:
    Resume Upload -> Profile Extraction -> Job Ingest -> Compatibility Matching ->
    Skill Gap Analysis -> Tailored Documents -> Application Tracking.
    Emits real-time AIActivity events to the observability log.
    """

    @classmethod
    async def run_full_pipeline(
        cls,
        db: Session,
        job_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs the orchestrated pipeline for matching and generating application documents."""
        activity = ActivityService.start_activity(
            db=db,
            agent_name="Orchestrator",
            action="run_job_application_pipeline",
            user_id=user_id,
            metadata={"job_id": job_id}
        )

        try:
            # 1. Ensure Profile is available
            profile = ProfileService.get_candidate_profile(db, user_id=user_id)
            if not profile:
                raise ValueError("No candidate profile found. Please upload a resume first.")

            # 2. Match Candidate against Job
            match_record = await MatchService.match_candidate_to_job(db, job_id=job_id, user_id=user_id)

            # 3. Generate Tailored Resume
            tailored_resume = await DocumentService.generate_tailored_resume(db, job_id=job_id, user_id=user_id)

            # 4. Generate Cover Letter
            cover_letter = await DocumentService.generate_cover_letter(db, job_id=job_id, user_id=user_id)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={
                    "match_score": match_record.overall_score,
                    "tailored_resume_id": tailored_resume.id,
                    "cover_letter_id": cover_letter.id
                }
            )

            return {
                "status": "success",
                "match": match_record,
                "tailored_resume": tailored_resume,
                "cover_letter": cover_letter
            }

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            logger.error(f"Orchestrator pipeline failed: {e}", exc_info=True)
            raise
