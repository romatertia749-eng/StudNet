from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas import ProfileCreate, ProfileResponse, PageResponse
from app.services import profile_service
import json

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

@router.post("", response_model=ProfileResponse)
def create_profile(
    user_id: int = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    age: int = Form(...),
    city: str = Form(...),
    university: str = Form(...),
    interests: str = Form(...),
    goals: str = Form(...),
    bio: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Валидация
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Имя должно содержать минимум 2 символа")
        if age < 15 or age > 50:
            raise HTTPException(status_code=400, detail="Возраст должен быть от 15 до 50 лет")
        if gender not in ["male", "female", "other"]:
            raise HTTPException(status_code=400, detail="Неверное значение пола")
        
        profile_data = ProfileCreate(
            user_id=user_id,
            name=name,
            gender=gender,
            age=age,
            city=city,
            university=university,
            interests=interests,
            goals=goals,
            bio=bio,
            username=username,
            first_name=first_name,
            last_name=last_name
        )
        
        profile = profile_service.create_or_update_profile(
            db=db,
            user_id=user_id,
            profile_data=profile_data,
            photo=photo
        )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании профиля: {str(e)}")

@router.get("", response_model=PageResponse)
def get_profiles(
    user_id: Optional[int] = None,
    city: Optional[str] = None,
    university: Optional[str] = None,
    page: int = 0,
    size: int = 20,
    db: Session = Depends(get_db)
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="Параметр userId обязателен")
    
    try:
        result = profile_service.get_available_profiles(
            db=db,
            user_id=user_id,
            city=city,
            university=university,
            page=page,
            size=size
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении профилей: {str(e)}")

# Важно: более специфичные роуты должны быть ПЕРЕД общим роутом /{profile_id}
@router.get("/check/{user_id}")
def check_profile_exists(user_id: int, db: Session = Depends(get_db)):
    """Проверяет наличие профиля у пользователя"""
    profile = profile_service.get_profile_by_user_id(db, user_id)
    return {"exists": profile is not None}

@router.get("/incoming-likes", response_model=PageResponse)
def get_incoming_likes(
    user_id: Optional[int] = None,
    page: int = 0,
    size: int = 20,
    db: Session = Depends(get_db)
):
    """Получает профили людей, которые лайкнули текущего пользователя"""
    if user_id is None:
        raise HTTPException(status_code=400, detail="Параметр user_id обязателен")
    
    try:
        result = profile_service.get_incoming_likes(
            db=db,
            user_id=user_id,
            page=page,
            size=size
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении входящих лайков: {str(e)}")

@router.get("/user/{user_id}", response_model=ProfileResponse)
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Получает профиль пользователя по user_id"""
    profile = profile_service.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = profile_service.get_profile_by_id(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

