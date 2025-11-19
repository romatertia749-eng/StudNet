from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, not_
from typing import Optional, List
from app.models import Profile, Swipe, Match
from app.schemas import ProfileCreate
from app.services.file_storage import store_file
from fastapi import UploadFile
import math

def create_or_update_profile(
    db: Session,
    user_id: int,
    profile_data: ProfileCreate,
    photo: Optional[UploadFile] = None
) -> Profile:
    existing = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if existing:
        profile = existing
    else:
        profile = Profile()
        profile.user_id = user_id
    
    profile.name = profile_data.name
    profile.gender = profile_data.gender
    profile.age = profile_data.age
    profile.city = profile_data.city
    profile.university = profile_data.university
    profile.interests = profile_data.interests
    profile.goals = profile_data.goals
    profile.bio = profile_data.bio
    profile.username = profile_data.username
    profile.first_name = profile_data.first_name
    profile.last_name = profile_data.last_name
    
    if photo:
        photo_url = store_file(photo)
        if photo_url:
            profile.photo_url = photo_url
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def get_available_profiles(
    db: Session,
    user_id: int,
    city: Optional[str] = None,
    university: Optional[str] = None,
    page: int = 0,
    size: int = 20
) -> dict:
    # Находим текущий профиль
    current_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not current_profile:
        return {
            "content": [],
            "total_elements": 0,
            "total_pages": 0,
            "size": size,
            "number": page
        }
    
    # Получаем ID профилей, с которыми уже взаимодействовали
    # Swipe.user_id - это user_id пользователя, который сделал свайп
    # Swipe.target_profile_id - это id профиля, на который свайпнули
    # Нужно найти все профили, на которые уже свайпнул текущий пользователь
    swiped_profile_ids = [
        row[0] for row in db.query(Swipe.target_profile_id).filter(
            Swipe.user_id == user_id
        ).all()
    ] if current_profile else []
    
    # Получаем user_id пользователей, с которыми уже есть мэтч
    matched_user_ids = set()
    matches_as_user1 = db.query(Match.user2_id).filter(Match.user1_id == user_id).all()
    matches_as_user2 = db.query(Match.user1_id).filter(Match.user2_id == user_id).all()
    for row in matches_as_user1:
        matched_user_ids.add(row[0])
    for row in matches_as_user2:
        matched_user_ids.add(row[0])
    
    # Получаем ID профилей, с которыми уже есть мэтч
    matched_profile_ids = [
        row[0] for row in db.query(Profile.id).filter(
            Profile.user_id.in_(matched_user_ids)
        ).all()
    ] if matched_user_ids else []
    
    # Базовый запрос
    query = db.query(Profile).filter(
        Profile.user_id != user_id
    )
    
    # Исключаем профили, с которыми уже взаимодействовали
    if swiped_profile_ids:
        query = query.filter(~Profile.id.in_(swiped_profile_ids))
    
    # Исключаем профили, с которыми уже есть мэтч
    if matched_profile_ids:
        query = query.filter(~Profile.id.in_(matched_profile_ids))
    
    # Фильтры
    if city:
        query = query.filter(Profile.city == city)
    if university:
        query = query.filter(Profile.university == university)
    
    # Подсчет общего количества
    total = query.count()
    
    # Пагинация
    profiles = query.offset(page * size).limit(size).all()
    
    total_pages = math.ceil(total / size) if total > 0 else 0
    
    return {
        "content": profiles,
        "total_elements": total,
        "total_pages": total_pages,
        "size": size,
        "number": page
    }

def get_profile_by_id(db: Session, profile_id: int) -> Optional[Profile]:
    return db.query(Profile).filter(Profile.id == profile_id).first()

def get_profile_by_user_id(db: Session, user_id: int) -> Optional[Profile]:
    return db.query(Profile).filter(Profile.user_id == user_id).first()

