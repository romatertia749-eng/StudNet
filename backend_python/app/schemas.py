from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ProfileBase(BaseModel):
    name: str = Field(..., min_length=2)
    gender: str  # Валидация gender делается в роутере
    age: int = Field(..., ge=15, le=50)
    city: str
    university: str
    interests: str
    goals: str
    bio: Optional[str] = Field(None, max_length=300)
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    class Config:
        # Отключаем строгую валидацию для более гибкой обработки
        extra = "forbid"

class ProfileCreate(ProfileBase):
    user_id: int

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LikeRequest(BaseModel):
    user_id: int

class LikeResponse(BaseModel):
    matched: bool
    match_id: Optional[int] = None
    message: str

class PassResponse(BaseModel):
    message: str = "Пропущено"

class RespondToLikeRequest(BaseModel):
    targetUserId: int
    action: str = Field(..., pattern="^(accept|decline)$")

class MatchResponse(BaseModel):
    id: int
    matched_profile: Optional[ProfileResponse] = None
    matched_at: datetime
    
    class Config:
        from_attributes = True

class PageResponse(BaseModel):
    content: List[ProfileResponse]
    total_elements: int
    total_pages: int
    size: int
    number: int

class ConnectionFeedbackType:
    HELPED_ME = "HELPED_ME"
    I_HELPED = "I_HELPED"
    PROJECT_TOGETHER = "PROJECT_TOGETHER"
    EVENT_TOGETHER = "EVENT_TOGETHER"
    
    @classmethod
    def all_types(cls):
        return [cls.HELPED_ME, cls.I_HELPED, cls.PROJECT_TOGETHER, cls.EVENT_TOGETHER]

class ConnectionFeedbackCreate(BaseModel):
    match_id: int
    from_user_id: int
    to_user_id: int
    feedback_type: str = Field(..., description="Type of feedback: HELPED_ME, I_HELPED, PROJECT_TOGETHER, EVENT_TOGETHER")

class ConnectionFeedbackResponse(BaseModel):
    id: int
    match_id: int
    from_user_id: int
    to_user_id: int
    feedback_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConnectionStatsResponse(BaseModel):
    helped_others: int = Field(0, description="Сколько раз помог другим (I_HELPED)")
    helped_me: int = Field(0, description="Сколько раз ему помогли (HELPED_ME)")
    projects_together: int = Field(0, description="Сколько было совместных проектов/хакатонов")
    events_together: int = Field(0, description="Сколько было совместных ивентов")

