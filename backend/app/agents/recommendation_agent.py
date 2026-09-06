from typing import List, Dict
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData
from app.schemas.recommendation import (
    JobSkillGapAnalysisResponse, SkillGapDetail, ActionPlanItem
)

class RecommendationAgent:
    """
    Agent responsible for synthesizing skill gaps, identifying learning priorities,
    and generating actionable recommendations to maximize candidate application success.
    """

    @classmethod
    def generate_detailed_analysis(
        cls,
        profile: CandidateProfileData,
        job: JobAnalysisData,
        match: MatchResultData,
        job_id: str
    ) -> JobSkillGapAnalysisResponse:
        candidate_skills_lower = {
            s.lower().strip()
            for s in (profile.skills + profile.programming_languages + profile.frameworks + profile.tools)
        }

        categories: Dict[str, List[SkillGapDetail]] = {
            "Already Strong": [],
            "Some Experience": [],
            "Needs Improvement": [],
            "Missing": []
        }

        # Classify required skills
        for skill in job.required_skills:
            if skill.lower().strip() in candidate_skills_lower:
                item = SkillGapDetail(
                    skill=skill,
                    category="Already Strong",
                    importance="Required",
                    recommendation=f"Feature practical achievements demonstrating {skill} in your tailored resume and interviews.",
                    learning_resource=f"Official {skill} Production Documentation & Best Practices"
                )
                categories["Already Strong"].append(item)
            else:
                item = SkillGapDetail(
                    skill=skill,
                    category="Missing",
                    importance="Required",
                    recommendation=f"Crucial missing prerequisite. Study core architecture and deploy a proof-of-concept with {skill}.",
                    learning_resource=f"Deep-dive interactive courses and practical tutorials for {skill}"
                )
                categories["Missing"].append(item)

        # Classify preferred skills
        for skill in job.preferred_skills:
            if skill.lower().strip() in candidate_skills_lower:
                item = SkillGapDetail(
                    skill=skill,
                    category="Some Experience",
                    importance="Preferred",
                    recommendation=f"Mention previous experience with {skill} during interviews to differentiate yourself.",
                    learning_resource=f"Advanced patterns in {skill}"
                )
                categories["Some Experience"].append(item)
            else:
                item = SkillGapDetail(
                    skill=skill,
                    category="Needs Improvement",
                    importance="Preferred",
                    recommendation=f"Nice-to-have skill. Familiarize yourself with how {job.company} leverages {skill}.",
                    learning_resource=f"High-level architectural overview of {skill}"
                )
                categories["Needs Improvement"].append(item)

        # Generate Action Plan
        action_plan: List[ActionPlanItem] = []

        # High priority actions for missing required skills
        missing_req = [i.skill for i in categories["Missing"]]
        if missing_req:
            action_plan.append(ActionPlanItem(
                priority="High",
                title=f"Address Core Gaps in {', '.join(missing_req[:2])}",
                description=f"Before applying, review fundamental concepts and prepare to explain adjacent experience that bridges this gap.",
                action_type="Conceptual Study"
            ))

        # Action for already strong skills
        strong_skills = [i.skill for i in categories["Already Strong"]]
        if strong_skills:
            action_plan.append(ActionPlanItem(
                priority="High",
                title=f"Highlight Proven Mastery of {', '.join(strong_skills[:3])}",
                description=f"Tailor resume bullet points to emphasize verified achievements involving {', '.join(strong_skills[:3])}.",
                action_type="Resume Highlight"
            ))

        # Medium priority for preferred skills
        needs_imp = [i.skill for i in categories["Needs Improvement"]]
        if needs_imp:
            action_plan.append(ActionPlanItem(
                priority="Medium",
                title=f"Familiarize with {', '.join(needs_imp[:2])}",
                description=f"Read documentation on how {job.company} uses {needs_imp[0]} in distributed infrastructure.",
                action_type="Project Build"
            ))

        # Interview focus areas
        interview_focus: List[str] = [
            f"Be ready to speak deeply on {strong_skills[0] if strong_skills else 'your core technical stack'}.",
            f"Explain how you design fault-tolerant systems handling real-world scale at {job.company}.",
        ]
        if missing_req:
            interview_focus.append(
                f"Prepare an honest narrative on your learning agility regarding {missing_req[0]} and parallel tools you've used."
            )

        summary = (
            f"Candidate satisfies {len(categories['Already Strong'])} of {len(job.required_skills)} required skills. "
            f"Focus on highlighting verified achievements in {', '.join(strong_skills[:2])} while preparing answers for "
            f"{', '.join(missing_req[:2]) or 'adjacent architectures'}."
        )

        return JobSkillGapAnalysisResponse(
            job_id=job_id,
            job_title=job.title,
            company=job.company,
            match_score=match.overall_score,
            recommendation=match.recommendation,
            summary=summary,
            categories=categories,
            action_plan=action_plan,
            interview_focus_areas=interview_focus
        )
