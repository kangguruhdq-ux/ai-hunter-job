from sqlalchemy import Column, String, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class GeneratedDocument(TimeStampedBase):
    __tablename__ = "generated_documents"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    candidate_profile_id = Column(String(36), ForeignKey("candidate_profiles.id", ondelete="SET NULL"), nullable=True)

    # tailored_resume, cover_letter
    document_type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    tailored_changes = Column(JSON, default=list)  # [{"original": str, "tailored": str, "rationale": str}]
    anti_hallucination_verified = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="documents")
