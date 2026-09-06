from sqlalchemy import Column, String, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class CandidatePreference(TimeStampedBase):
    __tablename__ = "candidate_preferences"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    preferred_roles = Column(JSON, default=list)
    preferred_locations = Column(JSON, default=list)
    preferred_job_types = Column(JSON, default=list)  # Remote, Hybrid, Full-time, Contract
    preferred_stack = Column(JSON, default=list)

    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    currency = Column(String(10), default="USD")

    user = relationship("User", back_populates="preferences")
