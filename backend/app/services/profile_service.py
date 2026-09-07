from typing import Optional, Any, List, Dict
from sqlalchemy.orm import Session
from app.core.logging import logger
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.models.candidate_preference import CandidatePreference
from app.models.user import User
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.candidate_preference import CandidatePreferenceData
from app.ai.providers.factory import get_ai_provider
from app.services.activity_service import ActivityService
from app.services.resume_service import ResumeService

class ProfileService:
    @classmethod
    async def extract_and_save_profile(
        cls,
        db: Session,
        resume_id: str,
        user_id: Optional[str] = None
    ) -> CandidateProfile:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume or (user_id and resume.user_id != user_id):
            raise ValueError(f"Resume {resume_id} not found.")

        if not resume.raw_text:
            raise ValueError("Resume has no extracted text to analyze.")

        target_user_id = user_id or resume.user_id

        # Track activity
        activity = ActivityService.start_activity(
            db=db,
            agent_name="ResumeAgent",
            action="extract_candidate_profile",
            user_id=target_user_id,
            metadata={"resume_id": resume_id}
        )

        try:
            provider = get_ai_provider()
            profile_data: CandidateProfileData = await provider.analyze_resume(resume.raw_text)

            # Check if profile already exists for user
            existing_profile = db.query(CandidateProfile).filter(
                CandidateProfile.user_id == target_user_id
            ).first()

            if existing_profile:
                profile = existing_profile
                profile.resume_id = resume.id
                profile.name = profile_data.name
                profile.headline = profile_data.headline
                profile.summary = profile_data.summary
                profile.location = profile_data.location
                profile.email = profile_data.email
                profile.phone = profile_data.phone
                profile.skills = profile_data.skills
                profile.programming_languages = profile_data.programming_languages
                profile.frameworks = profile_data.frameworks
                profile.tools = profile_data.tools
                profile.experience = [exp.model_dump() for exp in profile_data.experience]
                profile.education = [edu.model_dump() for edu in profile_data.education]
                profile.organizations = [org.model_dump() for org in profile_data.organizations]
                profile.certifications = profile_data.certifications
                profile.projects = [proj.model_dump() for proj in profile_data.projects]
                profile.years_of_experience = profile_data.years_of_experience
            else:
                profile = CandidateProfile(
                    user_id=target_user_id,
                    resume_id=resume.id,
                    name=profile_data.name,
                    headline=profile_data.headline,
                    summary=profile_data.summary,
                    location=profile_data.location,
                    email=profile_data.email,
                    phone=profile_data.phone,
                    skills=profile_data.skills,
                    programming_languages=profile_data.programming_languages,
                    frameworks=profile_data.frameworks,
                    tools=profile_data.tools,
                    experience=[exp.model_dump() for exp in profile_data.experience],
                    education=[edu.model_dump() for edu in profile_data.education],
                    organizations=[org.model_dump() for org in profile_data.organizations],
                    certifications=profile_data.certifications,
                    projects=[proj.model_dump() for proj in profile_data.projects],
                    years_of_experience=profile_data.years_of_experience
                )
                db.add(profile)

            # Store parsed data in resume record too
            resume.parsed_data = profile_data.model_dump()
            db.commit()
            db.refresh(profile)

            ActivityService.complete_activity(
                db=db,
                activity_id=activity.id,
                status="completed",
                metadata={"skills_count": len(profile.skills), "candidate_name": profile.name}
            )

            logger.info(f"Successfully extracted CandidateProfile {profile.id} for {profile.name}.")
            return profile

        except Exception as e:
            try:
                db.rollback()
            except Exception:
                pass
            try:
                ActivityService.complete_activity(
                    db=db,
                    activity_id=activity.id,
                    status="failed",
                    error=str(e)
                )
            except Exception:
                pass
            logger.error(f"Failed to extract candidate profile: {e}", exc_info=True)
            raise

    @staticmethod
    def get_candidate_profile(db: Session, user_id: Optional[str] = None) -> Optional[CandidateProfile]:
        if not user_id:
            user = ResumeService.get_or_create_default_user(db)
            user_id = user.id
        return db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()

    @classmethod
    def update_candidate_profile(
        cls,
        db: Session,
        profile_data: Any,
        user_id: Optional[str] = None
    ) -> CandidateProfile:
        if not user_id:
            user = ResumeService.get_or_create_default_user(db)
            user_id = user.id

        if isinstance(profile_data, dict):
            profile_data = CandidateProfileData(**profile_data)

        def dump_items(items):
            res = []
            for it in (items or []):
                if hasattr(it, "model_dump"):
                    res.append(it.model_dump())
                elif isinstance(it, dict):
                    res.append(it)
            return res

        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if not profile:
            profile = CandidateProfile(
                user_id=user_id,
                name=profile_data.name,
                headline=profile_data.headline,
                summary=profile_data.summary,
                location=profile_data.location,
                email=profile_data.email,
                phone=profile_data.phone,
                skills=profile_data.skills,
                programming_languages=profile_data.programming_languages,
                frameworks=profile_data.frameworks,
                tools=profile_data.tools,
                experience=dump_items(profile_data.experience),
                education=dump_items(profile_data.education),
                organizations=dump_items(profile_data.organizations),
                certifications=profile_data.certifications,
                projects=dump_items(profile_data.projects),
                years_of_experience=profile_data.years_of_experience
            )
            db.add(profile)
        else:
            profile.name = profile_data.name
            profile.headline = profile_data.headline
            profile.summary = profile_data.summary
            profile.location = profile_data.location
            profile.email = profile_data.email
            profile.phone = profile_data.phone
            profile.skills = profile_data.skills
            profile.programming_languages = profile_data.programming_languages
            profile.frameworks = profile_data.frameworks
            profile.tools = profile_data.tools
            profile.experience = dump_items(profile_data.experience)
            profile.education = dump_items(profile_data.education)
            profile.organizations = dump_items(profile_data.organizations)
            profile.certifications = profile_data.certifications
            profile.projects = dump_items(profile_data.projects)
            profile.years_of_experience = profile_data.years_of_experience

        db.commit()
        db.refresh(profile)
        return profile

    update_profile = update_candidate_profile

    @staticmethod
    def get_or_create_preferences(db: Session, user_id: Optional[str] = None) -> CandidatePreference:
        if not user_id:
            user = ResumeService.get_or_create_default_user(db)
            user_id = user.id

        pref = db.query(CandidatePreference).filter(CandidatePreference.user_id == user_id).first()
        if not pref:
            pref = CandidatePreference(
                user_id=user_id,
                preferred_roles=["Senior Backend Engineer", "Full Stack Engineer"],
                preferred_locations=["Remote", "San Francisco, CA"],
                preferred_job_types=["Remote", "Full-time"],
                preferred_stack=["Python", "FastAPI", "PostgreSQL", "React", "Docker"],
                min_salary=140000,
                max_salary=200000,
                currency="USD"
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def update_preferences(
        db: Session,
        pref_data: CandidatePreferenceData,
        user_id: Optional[str] = None
    ) -> CandidatePreference:
        if not user_id:
            user = ResumeService.get_or_create_default_user(db)
            user_id = user.id

        pref = db.query(CandidatePreference).filter(CandidatePreference.user_id == user_id).first()
        if not pref:
            pref = CandidatePreference(user_id=user_id)
            db.add(pref)

        pref.preferred_roles = pref_data.preferred_roles
        pref.preferred_locations = pref_data.preferred_locations
        pref.preferred_job_types = pref_data.preferred_job_types
        pref.preferred_stack = pref_data.preferred_stack
        pref.min_salary = pref_data.min_salary
        pref.max_salary = pref_data.max_salary
        pref.currency = pref_data.currency

        db.commit()
        db.refresh(pref)
        return pref
