import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="Valid email address")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name")
    password: str = Field(..., min_length=8, max_length=128, description="Password (at least 8 characters)")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        email_regex = r"^[^@]+@[^@]+\.[^@]+$"
        if not re.match(email_regex, v):
            raise ValueError("Format email tidak valid")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password minimal 8 karakter")
        return v

class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str = "user"
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    is_active: Optional[bool] = None
    role: Optional[str] = None

# ==================== ADMIN SCHEMAS ====================

class AdminUserCreateRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field("user", pattern=r"^(user|admin)$")
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        email_regex = r"^[^@]+@[^@]+\.[^@]+$"
        if not re.match(email_regex, v):
            raise ValueError("Format email tidak valid")
        return v

class AdminUserUpdateRequest(BaseModel):
    email: Optional[str] = Field(None, min_length=5, max_length=255)
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role: Optional[str] = Field(None, pattern=r"^(user|admin)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().lower()
        email_regex = r"^[^@]+@[^@]+\.[^@]+$"
        if not re.match(email_regex, v):
            raise ValueError("Format email tidak valid")
        return v

class AdminUserItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    resumes_count: int = 0
    applications_count: int = 0
    created_at: Optional[datetime] = None

class AdminUsersListResponse(BaseModel):
    total: int
    users: List[AdminUserItem]

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_resumes: int
    total_jobs: int
    total_applications: int
    total_ai_activities: int
    ai_provider: str
    configured_model: str
    fallback_models: List[str] = Field(default_factory=list)

class AdminUserUpdateStatusRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = Field(None, pattern=r"^(user|admin)$")

# --- Resumes ---
class AdminResumeItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    file_name: str
    file_type: str
    file_size: int
    status: str
    created_at: Optional[datetime] = None

class AdminResumesListResponse(BaseModel):
    total: int
    resumes: List[AdminResumeItem]

# --- Jobs ---
class AdminJobCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    company: str = Field(..., min_length=2, max_length=255)
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = "USD"
    raw_description: str = Field(..., min_length=10)
    required_skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    is_active: bool = True

class AdminJobUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    company: Optional[str] = Field(None, min_length=2, max_length=255)
    location: Optional[str] = None
    employment_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None
    raw_description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    is_active: Optional[bool] = None

class AdminJobItem(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    source_type: str
    is_active: bool
    matches_count: int = 0
    applications_count: int = 0
    created_at: Optional[datetime] = None

class AdminJobsListResponse(BaseModel):
    total: int
    jobs: List[AdminJobItem]

# --- Applications ---
class AdminApplicationItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    job_id: str
    job_title: str
    company: str
    status: str
    applied_date: Optional[str] = None
    interview_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AdminApplicationsListResponse(BaseModel):
    total: int
    applications: List[AdminApplicationItem]

class AdminApplicationStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern=r"^(saved|wishlist|applied|screening|interview|technical_interview|final_interview|offer|rejected|withdrawn)$")
    notes: Optional[str] = None
    interview_date: Optional[str] = None

# --- Documents ---
class AdminDocumentItem(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    document_type: str
    title: str
    anti_hallucination_verified: bool
    created_at: Optional[datetime] = None

class AdminDocumentsListResponse(BaseModel):
    total: int
    documents: List[AdminDocumentItem]

# --- AI Activity & Telemetry ---
class AdminAIActivityItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    agent_name: str
    action: str
    status: str
    started_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error: Optional[str] = None
    requested_model: Optional[str] = None
    successful_model: Optional[str] = None
    fallback_used: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AdminAIActivitiesListResponse(BaseModel):
    total: int
    activities: List[AdminAIActivityItem]

class AdminAIActivityStatsResponse(BaseModel):
    total_operations: int
    success_rate: float
    failure_rate: float
    average_latency_ms: float
    fallback_rate: float
    rate_429: float
    rate_500: float
