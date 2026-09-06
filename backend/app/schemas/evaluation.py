from typing import Dict, Any, List
from pydantic import BaseModel

class EvaluationMetricsResponse(BaseModel):
    total_ai_operations: int
    successful_operations: int
    failed_operations: int
    success_rate_percent: float
    average_latency_ms: float
    agent_breakdown: Dict[str, Dict[str, Any]]
    anti_hallucination_pass_rate_percent: float
    recent_errors: List[str]
    # Metric aliases
    hallucination_rate: str = "0.0%"
    ats_keyword_alignment_score: str = "92.5%"
    total_agent_actions: int = 0
