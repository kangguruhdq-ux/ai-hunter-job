from sqlalchemy import Column, String, Float, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class CandidateProfile(TimeStampedBase):
    __tablename__ = "candidate_profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    name = Column(String(255), nullable=False)
    headline = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    skills = Column(JSON, default=list)
    programming_languages = Column(JSON, default=list)
    frameworks = Column(JSON, default=list)
    tools = Column(JSON, default=list)

    experience = Column(JSON, default=list)
    education = Column(JSON, default=list)
    organizations = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    years_of_experience = Column(Float, default=0.0)

    user = relationship("User", back_populates="profile")
    resume = relationship("Resume", back_populates="profile")
    matches = relationship("JobMatch", back_populates="candidate_profile", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        return self.name
