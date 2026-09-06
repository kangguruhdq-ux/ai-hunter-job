from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.logging import logger
from app.models.job import Job, JobRequirement
from app.models.candidate_profile import CandidateProfile
from app.models.job_match import JobMatch
from app.models.user import User
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData
from app.agents.match_agent import MatchAgent
from app.services.activity_service import ActivityService
from app.services.profile_service import ProfileService
from app.services.job_service import JobService

class MatchService:
    @classmethod
    async def match_candidate_to_job(
        cls,
        db: Session,
        job_id: str,
        user_id: Optional[str] = None
    ) -> JobMatch:
        profile = ProfileService.get_candidate_profile(db, user_id=user_id)
        if not profile:
            # Auto-extract from latest resume if exists
            user = ProfileService.get_or_create_preferences(db, user_id=user_id).user
            from app.models.resume import Resume
            latest_resume = db.query(Resume).filter(Resume.user_id == user.id, Resume.status == "parsed").first()
            if latest_resume:
                profile = await ProfileService.extract_and_save_profile(db, latest_resume.id, user.id)
            else:
                raise ValueError("No candidate profile or parsed resume found. Please upload a resume first.")

        job = JobService.get_job(db, job_id)
        if not job:
            raise ValueError(f"Job with ID '{job_id}' not found.")

        # Prepare schemas
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
            organizations=getattr(profile, "organizations", []) or [],
            certifications=profile.certifications or [],
            projects=profile.projects or [],
            years_of_experience=profile.years_of_experience or 0.0
        )

        req = job.requirements
        job_analysis = JobAnalysisData(
            title=job.title,
            company=job.company,
            location=job.location,
            employment_type=job.employment_type,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            required_skills=req.required_skills if req else [],
            preferred_skills=req.preferred_skills if req else [],
            required_experience_years=req.required_experience_years if req else 3.0,
            education_requirements=req.education_requirements if req else [],
            responsibilities=req.responsibilities if req else [],
            keywords=req.keywords if req else [],
            summary=job.summary or ""
        )

        activity = ActivityService.start_activity(
            db=db,
            agent_name="MatchAgent",
            action="calculate_candidate_job_match",
            user_id=profile.user_id,
            metadata={"job_id": job.id, "job_title": job.title, "company": job.company}
        )

        try:
            match_result: MatchResultData = await MatchAgent.match(profile_data, job_analysis)

            # Check if match record already exists
            existing_match = db.query(JobMatch).filter(
                JobMatch.candidate_profile_id == profile.id,
                JobMatch.job_id == job.id
            ).first()

            if existing_match:
                match_record = existing_match
                match_record.overall_score = match_result.overall_score
                match_record.skills_score = match_result.skills_score
                match_record.experience_score = match_result.experience_score
                match_record.responsibility_score = match_result.responsibility_score
                match_record.education_score = match_result.education_score
                match_record.keyword_score = match_result.keyword_score
                match_record.score_weights = match_result.score_weights
                match_record.strengths = match_result.strengths
                match_record.skill_gaps = [g.model_dump() for g in match_result.skill_gaps]
                match_record.recommendation = match_result.recommendation
                match_record.reasoning = match_result.reasoning
            else:
                match_record = JobMatch(
                    candidate_profile_id=profile.id,
                    job_id=job.id,
                    overall_score=match_result.overall_score,
                    skills_score=match_result.skills_score,
                    experience_score=match_result.experience_score,
                    responsibility_score=match_result.responsibility_score,
                    education_score=match_result.education_score,
                    keyword_score=match_result.keyword_score,
                    score_weights=match_result.score_weights,
                    strengths=match_result.strengths,
                    skill_gaps=[g.model_dump() for g in match_result.skill_gaps],
                    recommendation=match_result.recommendation,
                    reasoning=match_result.reasoning
                )
                db.add(match_record)

            db.commit()
            db.refresh(match_record)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={
                    "overall_score": match_record.overall_score,
                    "recommendation": match_record.recommendation
                }
            )
            return match_record

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            logger.error(f"Failed to match candidate to job: {e}", exc_info=True)
            raise

    @staticmethod
    def get_job_match(
        db: Session,
        job_id: str,
        user_id: Optional[str] = None
    ) -> Optional[JobMatch]:
        profile = ProfileService.get_candidate_profile(db, user_id=user_id)
        if not profile:
            return None
        return db.query(JobMatch).filter(
            JobMatch.candidate_profile_id == profile.id,
            JobMatch.job_id == job_id
        ).first()

    @classmethod
    async def get_recommended_jobs(
        cls,
        db: Session,
        user_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Rank jobs by match score against active candidate profile.
        Calculates match for any active job that hasn't been matched yet.
        """
        profile = ProfileService.get_candidate_profile(db, user_id=user_id)
        if not profile:
            # If no profile yet, return jobs with estimated score of 0
            jobs = JobService.list_jobs(db, limit=limit)
            return [{"job": j, "match": None, "score": 0} for j in jobs]

        jobs = JobService.list_jobs(db, limit=50)
        results = []
        for job in jobs:
            existing = cls.get_job_match(db, job.id, user_id=user_id)
            if not existing:
                try:
                    existing = await cls.match_candidate_to_job(db, job.id, user_id=user_id)
                except Exception as e:
                    logger.warning(f"Auto-match failed for job {job.id}: {e}")

            score = existing.overall_score if existing else 0
            results.append({"job": job, "match": existing, "score": score})

        # Rank descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
