from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class JobMatch(TimeStampedBase):
    __tablename__ = "job_matches"

    candidate_profile_id = Column(String(36), ForeignKey("candidate_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    overall_score = Column(Integer, nullable=False)  # 0-100
    skills_score = Column(Integer, nullable=False)
    experience_score = Column(Integer, nullable=False)
    responsibility_score = Column(Integer, nullable=False)
    education_score = Column(Integer, nullable=False)
    keyword_score = Column(Integer, nullable=False)

    score_weights = Column(JSON, default=dict)
    strengths = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=list)  # [{"skill": str, "category": str, "recommendation": str}]
    recommendation = Column(String(50), nullable=False)  # STRONG_MATCH, GOOD_MATCH, POSSIBLE_MATCH, WEAK_MATCH
    reasoning = Column(Text, nullable=False)

    candidate_profile = relationship("CandidateProfile", back_populates="matches")
    job = relationship("Job", back_populates="matches")
    user = relationship("User", back_populates="job_matches")
