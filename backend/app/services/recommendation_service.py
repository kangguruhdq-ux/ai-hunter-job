from typing import Optional
from sqlalchemy.orm import Session
from app.models.job import Job
from app.models.job_match import JobMatch
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData
from app.schemas.recommendation import JobSkillGapAnalysisResponse
from app.agents.recommendation_agent import RecommendationAgent
from app.services.activity_service import ActivityService
from app.services.profile_service import ProfileService
from app.services.job_service import JobService
from app.services.match_service import MatchService

class RecommendationService:
    @classmethod
    async def get_skill_gap_analysis(
        cls,
        db: Session,
        job_id: str,
        user_id: Optional[str] = None
    ) -> JobSkillGapAnalysisResponse:
        job = JobService.get_job(db, job_id)
        if not job:
            raise ValueError(f"Job with ID '{job_id}' not found.")

        profile = ProfileService.get_candidate_profile(db, user_id=user_id)
        if not profile:
            raise ValueError("Candidate profile not found. Please upload and parse your resume first.")

        # Ensure match is calculated
        match_record = MatchService.get_job_match(db, job_id, user_id=user_id)
        if not match_record:
            match_record = await MatchService.match_candidate_to_job(db, job_id, user_id=user_id)

        activity = ActivityService.start_activity(
            db=db,
            agent_name="RecommendationAgent",
            action="generate_skill_gap_analysis",
            user_id=profile.user_id,
            metadata={"job_id": job.id, "job_title": job.title}
        )

        try:
            profile_data = CandidateProfileData(
                name=profile.name,
                skills=profile.skills or [],
                programming_languages=profile.programming_languages or [],
                frameworks=profile.frameworks or [],
                tools=profile.tools or [],
                experience=profile.experience or [],
                education=profile.education or [],
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

            match_data = MatchResultData(
                overall_score=match_record.overall_score,
                skills_score=match_record.skills_score,
                experience_score=match_record.experience_score,
                responsibility_score=match_record.responsibility_score,
                education_score=match_record.education_score,
                keyword_score=match_record.keyword_score,
                score_weights=match_record.score_weights or {},
                strengths=match_record.strengths or [],
                skill_gaps=[],
                recommendation=match_record.recommendation,
                reasoning=match_record.reasoning
            )

            response = RecommendationAgent.generate_detailed_analysis(
                profile=profile_data,
                job=job_analysis,
                match=match_data,
                job_id=job.id
            )

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"action_plan_count": len(response.action_plan)}
            )

            return response

        except Exception as e:
            ActivityService.complete_activity(
                db=db, activity_id=activity.id, status="failed", error=str(e)
            )
            raise
