import time
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.ai_activity import AIActivity
from app.core.logging import logger

class ActivityService:
    @staticmethod
    def start_activity(
        db: Session,
        agent_name: str,
        action: str,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AIActivity:
        activity = AIActivity(
            user_id=user_id,
            agent_name=agent_name,
            action=action,
            status="running",
            started_at=datetime.utcnow(),
            activity_metadata=metadata or {}
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity

    @staticmethod
    def complete_activity(
        db: Session,
        activity_id: str,
        status: str = "completed",
        error: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[AIActivity]:
        activity = db.query(AIActivity).filter(AIActivity.id == activity_id).first()
        if not activity:
            return None

        now = datetime.utcnow()
        activity.status = status
        activity.completed_at = now
        activity.error = error

        curr_meta = dict(activity.activity_metadata or {})
        try:
            from app.ai.providers.factory import get_ai_provider
            prov = get_ai_provider()
            if hasattr(prov, "last_telemetry") and prov.last_telemetry:
                for k, v in prov.last_telemetry.items():
                    if k not in curr_meta:
                        curr_meta[k] = v
        except Exception:
            pass

        if metadata:
            curr_meta.update(metadata)
        activity.activity_metadata = curr_meta

        if activity.started_at:
            delta = now - activity.started_at
            activity.duration_ms = int(delta.total_seconds() * 1000)

        db.commit()
        db.refresh(activity)
        return activity
