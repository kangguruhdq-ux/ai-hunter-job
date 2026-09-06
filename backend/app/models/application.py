from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedBase

class Application(TimeStampedBase):
    __tablename__ = "applications"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    # Statuses: Wishlist, Applied, Screening, Interview, Technical Interview, Final Interview, Offer, Rejected
    status = Column(String(50), default="Wishlist", nullable=False, index=True)
    notes = Column(Text, nullable=True)
    salary_offered = Column(Integer, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    job_url = Column(String(512), nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
