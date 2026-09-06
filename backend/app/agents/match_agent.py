import re
from typing import List, Dict, Set, Tuple
from app.core.logging import logger
from app.schemas.candidate_profile import CandidateProfileData
from app.schemas.job import JobAnalysisData
from app.schemas.match import MatchResultData, SkillGapItem
from app.ai.providers.factory import get_ai_provider

class MatchAgent:
    """
    Agent responsible for explainable, deterministic candidate-job compatibility scoring.
    Combines strict mathematical weighting with AI semantic reasoning.
    """

    WEIGHTS = {
        "skills": 0.40,
        "experience": 0.25,
        "responsibilities": 0.20,
        "education": 0.10,
        "keywords": 0.05
    }

    @classmethod
    def calculate_deterministic_scores(
        cls,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> Tuple[Dict[str, int], int, List[str], List[SkillGapItem], str]:
        """
        Pure deterministic calculation for reproducible, explainable scoring.
        Returns: (score_breakdown, overall_score, strengths, skill_gaps, recommendation)
        """
        # Build candidate skill set (case-insensitive)
        candidate_skills: Set[str] = set()
        for s in (profile.skills + profile.programming_languages + profile.frameworks + profile.tools):
            candidate_skills.add(s.lower().strip())

        # Also search candidate experience/project descriptions for mentions
        exp_text = " ".join([e.description or "" for e in profile.experience] + [" ".join(e.achievements) for e in profile.experience])
        proj_text = " ".join([p.description for p in profile.projects] + [" ".join(p.tech_stack) for p in profile.projects])
        full_candidate_corpus = (exp_text + " " + proj_text + " " + (profile.summary or "")).lower()

        def candidate_has_skill(skill_name: str) -> bool:
            lower = skill_name.lower().strip()
            if lower in candidate_skills:
                return True
            pattern = r"\b" + re.escape(lower) + r"\b"
            return bool(re.search(pattern, full_candidate_corpus))

        # 1. Skills Score (40%)
        req_matched = [s for s in job.required_skills if candidate_has_skill(s)]
        pref_matched = [s for s in job.preferred_skills if candidate_has_skill(s)]

        req_denom = max(len(job.required_skills), 1)
        pref_denom = max(len(job.preferred_skills), 1) if job.preferred_skills else 1.0

        req_ratio = len(req_matched) / req_denom
        pref_ratio = len(pref_matched) / pref_denom if job.preferred_skills else 1.0

        # Required skills carry 85% of skills score, preferred carries 15%
        skills_score = int(round(min(100, max(10, (req_ratio * 0.85 + pref_ratio * 0.15) * 100))))

        # 2. Experience Score (25%)
        target_years = job.required_experience_years or 3.0
        if profile.years_of_experience >= target_years:
            experience_score = 100
        else:
            exp_ratio = profile.years_of_experience / target_years
            experience_score = int(round(min(95, max(30, exp_ratio * 100))))

        # 3. Responsibility Match Score (20%)
        # Evaluate overlap between candidate achievements and job responsibilities
        resp_matches = 0
        total_resp = max(len(job.responsibilities), 1)
        for resp in job.responsibilities:
            resp_words = [w.lower() for w in re.findall(r"\w+", resp) if len(w) > 3]
            overlap = any(w in full_candidate_corpus for w in resp_words)
            if overlap:
                resp_matches += 1
        resp_ratio = resp_matches / total_resp
        responsibility_score = int(round(min(100, max(40, resp_ratio * 100))))

        # 4. Education Score (10%)
        education_score = 100 if profile.education else 80

        # 5. Keyword Match Score (5%)
        kw_denom = max(len(job.keywords), 1)
        kw_matched = [k for k in job.keywords if candidate_has_skill(k)]
        keyword_score = int(round(min(100, max(20, (len(kw_matched) / kw_denom) * 100))))

        # Overall Weighted Score
        overall_score = int(round(
            skills_score * cls.WEIGHTS["skills"] +
            experience_score * cls.WEIGHTS["experience"] +
            responsibility_score * cls.WEIGHTS["responsibilities"] +
            education_score * cls.WEIGHTS["education"] +
            keyword_score * cls.WEIGHTS["keywords"]
        ))
        overall_score = min(100, max(0, overall_score))

        # Strengths & Skill Gaps
        strengths = req_matched + pref_matched
        if not strengths and req_matched:
            strengths = req_matched

        skill_gaps: List[SkillGapItem] = []
        for s in job.required_skills:
            if candidate_has_skill(s):
                skill_gaps.append(SkillGapItem(
                    skill=s,
                    category="Already Strong",
                    recommendation=f"Feature practical achievements demonstrating {s} on your resume."
                ))
            else:
                skill_gaps.append(SkillGapItem(
                    skill=s,
                    category="Missing",
                    recommendation=f"Prioritize building a practical project or reviewing fundamentals for {s}."
                ))

        for s in job.preferred_skills:
            if candidate_has_skill(s):
                skill_gaps.append(SkillGapItem(
                    skill=s,
                    category="Some Experience",
                    recommendation=f"Mention hands-on experience and familiarity with {s}."
                ))
            else:
                skill_gaps.append(SkillGapItem(
                    skill=s,
                    category="Needs Improvement",
                    recommendation=f"Review overview and architectural use-cases for {s}."
                ))

        # Recommendation Category
        if overall_score >= 80:
            rec = "STRONG_MATCH"
        elif overall_score >= 65:
            rec = "GOOD_MATCH"
        elif overall_score >= 50:
            rec = "POSSIBLE_MATCH"
        else:
            rec = "WEAK_MATCH"

        breakdown = {
            "skills": skills_score,
            "experience": experience_score,
            "responsibilities": responsibility_score,
            "education": education_score,
            "keywords": keyword_score
        }

        return breakdown, overall_score, strengths, skill_gaps, rec

    @classmethod
    async def match(
        cls,
        profile: CandidateProfileData,
        job: JobAnalysisData
    ) -> MatchResultData:
        """Run explainable matching combining deterministic metrics and AI semantic reasoning."""
        breakdown, overall, strengths, gaps, rec = cls.calculate_deterministic_scores(profile, job)

        # AI provider semantic evaluation
        provider = get_ai_provider()
        try:
            ai_result = await provider.match_candidate(profile, job)
            # Use deterministic scores for explainability and trust, with AI reasoning
            return MatchResultData(
                overall_score=overall,
                skills_score=breakdown["skills"],
                experience_score=breakdown["experience"],
                responsibility_score=breakdown["responsibilities"],
                education_score=breakdown["education"],
                keyword_score=breakdown["keywords"],
                score_weights=cls.WEIGHTS,
                strengths=strengths or ai_result.strengths,
                skill_gaps=gaps,
                recommendation=rec,
                reasoning=ai_result.reasoning or f"{rec.replace('_', ' ').title()} based on core skill alignment."
            )
        except Exception as e:
            logger.warning(f"AI semantic reasoning fallback: {e}")
            reason = (
                f"{rec.replace('_', ' ').title()} ({overall}%). "
                f"Candidate aligns with {len(strengths)} key requirements. "
                f"Main skill gaps: {', '.join([g.skill for g in gaps if g.category == 'Missing'][:3]) or 'None'}."
            )
            return MatchResultData(
                overall_score=overall,
                skills_score=breakdown["skills"],
                experience_score=breakdown["experience"],
                responsibility_score=breakdown["responsibilities"],
                education_score=breakdown["education"],
                keyword_score=breakdown["keywords"],
                score_weights=cls.WEIGHTS,
                strengths=strengths,
                skill_gaps=gaps,
                recommendation=rec,
                reasoning=reason
            )
