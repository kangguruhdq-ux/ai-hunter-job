from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class User(TimeStampedBase):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("CandidatePreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("GeneratedDocument", back_populates="user", cascade="all, delete-orphan")
