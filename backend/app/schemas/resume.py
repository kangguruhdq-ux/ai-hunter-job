from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict

class ResumeBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int

class ResumeUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime
    message: str

class ResumeDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    file_name: str
    file_type: str
    file_size: int
    status: str
    raw_text: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ResumeExtractTextResult(BaseModel):
    raw_text: str
    word_count: int
    char_count: int
    page_count: Optional[int] = None
