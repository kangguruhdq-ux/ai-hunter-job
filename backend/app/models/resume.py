from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Resume(TimeStampedBase):
    __tablename__ = "resumes"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(512), nullable=False)
    raw_text = Column(Text, nullable=True)
    parsed_data = Column(JSON, nullable=True)
    status = Column(String(50), default="uploaded", nullable=False)  # uploaded, processing, parsed, failed
    error_message = Column(Text, nullable=True)

    user = relationship("User", back_populates="resumes")
    profile = relationship("CandidateProfile", back_populates="resume", uselist=False)
