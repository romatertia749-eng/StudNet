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

