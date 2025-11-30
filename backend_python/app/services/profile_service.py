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
    
    # Получаем ID всех профилей, с которыми уже взаимодействовали
    # (лайк, пасс, любой свайп - все действия создают запись в Swipe)
    swiped_profile_ids = db.query(Swipe.target_profile_id).filter(
        Swipe.user_id == user_id
    ).distinct().all()
    swiped_profile_ids = [row[0] for row in swiped_profile_ids]
    
    # Получаем user_id пользователей, с которыми уже есть мэтч
    matched_user_ids = set()
    matches_as_user1 = db.query(Match.user2_id).filter(Match.user1_id == user_id).all()
    matches_as_user2 = db.query(Match.user1_id).filter(Match.user2_id == user_id).all()
    for row in matches_as_user1:
        matched_user_ids.add(row[0])
    for row in matches_as_user2:
        matched_user_ids.add(row[0])
    
    # Получаем ID профилей, с которыми уже есть мэтч
    matched_profile_ids = []
    if matched_user_ids:
        matched_profile_ids = [
            row[0] for row in db.query(Profile.id).filter(
                Profile.user_id.in_(matched_user_ids)
            ).all()
        ]
    
    # Объединяем все исключаемые ID профилей
    excluded_profile_ids = set(swiped_profile_ids) | set(matched_profile_ids)
    
    # Базовый запрос: исключаем свой профиль и все просмотренные
    query = db.query(Profile).filter(
        Profile.user_id != user_id
    )
    
    # Исключаем все профили, с которыми уже взаимодействовали (лайк, пасс, мэтч)
    if excluded_profile_ids:
        query = query.filter(~Profile.id.in_(excluded_profile_ids))
    
    # Фильтры по городу и университету
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

def get_incoming_likes(
    db: Session,
    user_id: int,
    page: int = 0,
    size: int = 20
) -> dict:
    """Получает профили пользователей, которые лайкнули текущего, но он ещё не ответил"""
    
    # Находим профиль текущего пользователя
    current_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not current_profile:
        return {
            "content": [],
            "total_elements": 0,
            "total_pages": 0,
            "size": size,
            "number": page
        }
    
    # Получаем user_id тех, кто лайкнул текущего пользователя
    likers_query = db.query(Swipe.user_id).filter(
        Swipe.target_profile_id == current_profile.id,
        Swipe.action == 'like'
    )
    liker_user_ids = [row[0] for row in likers_query.all()]
    
    if not liker_user_ids:
        return {
            "content": [],
            "total_elements": 0,
            "total_pages": 0,
            "size": size,
            "number": page
        }
    
    # Получаем ID профилей, на которые текущий пользователь уже ответил
    responded_profile_ids = db.query(Swipe.target_profile_id).filter(
        Swipe.user_id == user_id
    ).distinct().all()
    responded_profile_ids = [row[0] for row in responded_profile_ids]
    
    # Получаем профили лайкеров, исключая тех, на кого уже ответили
    query = db.query(Profile).filter(
        Profile.user_id.in_(liker_user_ids)
    )
    
    if responded_profile_ids:
        query = query.filter(~Profile.id.in_(responded_profile_ids))
    
    total = query.count()
    profiles = query.offset(page * size).limit(size).all()
    total_pages = math.ceil(total / size) if total > 0 else 0
    
    return {
        "content": profiles,
        "total_elements": total,
        "total_pages": total_pages,
        "size": size,
        "number": page
    }

