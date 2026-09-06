from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, JSON, DateTime
from app.models.base import TimeStampedBase

class AIActivity(TimeStampedBase):
    __tablename__ = "ai_activities"

    user_id = Column(String(36), nullable=True, index=True)
    agent_name = Column(String(100), nullable=False, index=True)
    action = Column(String(255), nullable=False)
    status = Column(String(50), default="started", nullable=False, index=True)  # started, running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    activity_metadata = Column(JSON, default=dict)
