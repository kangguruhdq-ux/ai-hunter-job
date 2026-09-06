from sqlalchemy import Column, String, Integer, Float, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Job(TimeStampedBase):
    __tablename__ = "jobs"

    title = Column(String(255), index=True, nullable=False)
    company = Column(String(255), index=True, nullable=False)
    location = Column(String(255), nullable=True)
    employment_type = Column(String(100), nullable=True)  # Full-time, Contract, Remote, Hybrid
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(10), default="USD")

    raw_description = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    source_type = Column(String(50), default="manual")  # pasted, url, manual, seeded
    source_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)

    requirements = relationship("JobRequirement", back_populates="job", uselist=False, cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class JobRequirement(TimeStampedBase):
    __tablename__ = "job_requirements"

    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, unique=True)

    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    required_experience_years = Column(Float, nullable=True)
    education_requirements = Column(JSON, default=list)
    responsibilities = Column(JSON, default=list)
    keywords = Column(JSON, default=list)

    job = relationship("Job", back_populates="requirements")
