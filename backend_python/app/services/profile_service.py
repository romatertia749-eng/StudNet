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
    try:
        existing = db.query(Profile).filter(Profile.user_id == user_id).first()
        
        if existing:
            profile = existing
        else:
            profile = Profile()
            profile.user_id = user_id
        
        profile.name = profile_data.name.strip() if profile_data.name else profile_data.name
        profile.gender = profile_data.gender
        profile.age = profile_data.age
        profile.city = profile_data.city.strip() if profile_data.city else profile_data.city
        profile.university = profile_data.university.strip() if profile_data.university else profile_data.university
        profile.interests = profile_data.interests
        profile.goals = profile_data.goals
        profile.bio = profile_data.bio.strip() if profile_data.bio else profile_data.bio
        profile.username = profile_data.username.strip() if profile_data.username else profile_data.username
        profile.first_name = profile_data.first_name.strip() if profile_data.first_name else profile_data.first_name
        profile.last_name = profile_data.last_name.strip() if profile_data.last_name else profile_data.last_name
        
        # Валидация длины bio перед сохранением
        if profile.bio and len(profile.bio) > 300:
            raise ValueError("Описание не должно превышать 300 символов")
        
        if photo:
            photo_url = store_file(photo)
            if photo_url:
                profile.photo_url = photo_url
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        db.rollback()
        raise

def get_available_profiles(
    db: Session,
    user_id: int,
    city: Optional[str] = None,
    university: Optional[str] = None,
    interests: Optional[str] = None,
    page: int = 0,
    size: int = 20
) -> dict:
    print(f"[get_available_profiles] Request for user_id={user_id}, city={city}, university={university}, interests={interests}, page={page}, size={size}")
    
    # Находим текущий профиль
    current_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not current_profile:
        print(f"[get_available_profiles] Current user {user_id} has no profile")
        return {
            "content": [],
            "total_elements": 0,
            "total_pages": 0,
            "size": size,
            "number": page
        }
    
    print(f"[get_available_profiles] Current profile: id={current_profile.id}, name={current_profile.name}")
    
    # Получаем ID всех профилей, с которыми уже взаимодействовали
    # (лайк, пасс, любой свайп - все действия создают запись в Swipe)
    # ВАЖНО: учитываем только свайпы, которые сделал ТЕКУЩИЙ пользователь
    # НЕ учитываем свайпы, которые сделали ДРУГИЕ пользователи на текущего
    swiped_records = db.query(Swipe.target_profile_id, Swipe.action).filter(
        Swipe.user_id == user_id
    ).distinct().all()
    swiped_profile_ids = [row[0] for row in swiped_records]
    print(f"[get_available_profiles] Swiped profile IDs (swipes made by user {user_id}): {swiped_profile_ids}")
    if swiped_records:
        print(f"[get_available_profiles] Swipe details:")
        for target_id, action in swiped_records:
            target_profile = db.query(Profile).filter(Profile.id == target_id).first()
            if target_profile:
                print(f"  - Swiped profile id={target_id}, user_id={target_profile.user_id}, name={target_profile.name}, action={action}")
    
    # Проверяем, есть ли профиль брата в базе (для отладки)
    all_other_profiles = db.query(Profile).filter(Profile.user_id != user_id).all()
    print(f"[get_available_profiles] All other profiles in DB ({len(all_other_profiles)} total):")
    for p in all_other_profiles:
        print(f"  - Profile id={p.id}, user_id={p.user_id}, name={p.name}, city={p.city}, university={p.university}")
    
    # Получаем user_id пользователей, с которыми уже есть мэтч
    matched_user_ids = set()
    matches_as_user1 = db.query(Match.user2_id).filter(Match.user1_id == user_id).all()
    matches_as_user2 = db.query(Match.user1_id).filter(Match.user2_id == user_id).all()
    for row in matches_as_user1:
        matched_user_ids.add(row[0])
    for row in matches_as_user2:
        matched_user_ids.add(row[0])
    print(f"[get_available_profiles] Matched user IDs: {matched_user_ids}")
    
    # Получаем ID профилей, с которыми уже есть мэтч
    matched_profile_ids = []
    if matched_user_ids:
        matched_profile_ids = [
            row[0] for row in db.query(Profile.id).filter(
                Profile.user_id.in_(matched_user_ids)
            ).all()
        ]
    print(f"[get_available_profiles] Matched profile IDs: {matched_profile_ids}")
    
    # Объединяем все исключаемые ID профилей
    excluded_profile_ids = set(swiped_profile_ids) | set(matched_profile_ids)
    print(f"[get_available_profiles] Excluded profile IDs: {excluded_profile_ids}")
    
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
        print(f"[get_available_profiles] Filtering by city: {city}")
    if university:
        query = query.filter(Profile.university == university)
        print(f"[get_available_profiles] Filtering by university: {university}")
    
    # Фильтр по интересам (если передан)
    # ВАЖНО: фильтр по интересам временно отключен, чтобы не блокировать профили
    # TODO: реализовать правильную фильтрацию по интересам
    if interests:
        # interests приходит как строка через запятую: "IT,Дизайн"
        interest_list = [i.strip() for i in interests.split(',') if i.strip()]
        if interest_list:
            print(f"[get_available_profiles] WARNING: Interests filter requested but NOT APPLIED to avoid blocking profiles: {interest_list}")
            print(f"[get_available_profiles] This is a temporary fix - interests filtering will be implemented properly later")
            # ВРЕМЕННО ОТКЛЮЧЕНО: фильтр по интересам
            # conditions = []
            # for interest in interest_list:
            #     conditions.append(
            #         Profile.interests.contains(f'"{interest}"') |
            #         Profile.interests.contains(f"'{interest}'") |
            #         Profile.interests.ilike(f'%{interest}%')
            #     )
            # if conditions:
            #     query = query.filter(or_(*conditions))
    
    # Подсчет общего количества
    total = query.count()
    print(f"[get_available_profiles] Total profiles before pagination: {total}")
    
    # Пагинация
    profiles = query.offset(page * size).limit(size).all()
    
    # Логируем найденные профили
    print(f"[get_available_profiles] Found {len(profiles)} profiles after all filters:")
    for profile in profiles:
        print(f"  - Profile id={profile.id}, user_id={profile.user_id}, name={profile.name}, city={profile.city}, university={profile.university}, interests={profile.interests}")
    
    # Проверяем, какие профили были исключены и почему
    excluded_profiles = []
    for p in all_other_profiles:
        if p.id in excluded_profile_ids:
            excluded_profiles.append((p.id, p.user_id, p.name, "excluded (swiped or matched)"))
        elif p.id not in [pr.id for pr in profiles]:
            # Проверяем, почему профиль был отфильтрован
            reason_parts = []
            if city and p.city != city:
                reason_parts.append(f"city mismatch ({p.city} != {city})")
            if university and p.university != university:
                reason_parts.append(f"university mismatch ({p.university} != {university})")
            if interests:
                interest_list = [i.strip() for i in interests.split(',') if i.strip()]
                if interest_list:
                    # Проверяем, есть ли совпадение интересов
                    profile_interests_str = p.interests or "[]"
                    has_match = False
                    for interest in interest_list:
                        if f'"{interest}"' in profile_interests_str or f"'{interest}'" in profile_interests_str or interest.lower() in profile_interests_str.lower():
                            has_match = True
                            break
                    if not has_match:
                        reason_parts.append(f"interests mismatch (profile: {profile_interests_str}, filter: {interest_list})")
            reason = "filtered out: " + (", ".join(reason_parts) if reason_parts else "unknown reason")
            excluded_profiles.append((p.id, p.user_id, p.name, reason))
    if excluded_profiles:
        print(f"[get_available_profiles] Excluded/filtered profiles ({len(excluded_profiles)}):")
        for p_id, u_id, name, reason in excluded_profiles:
            print(f"  - Profile id={p_id}, user_id={u_id}, name={name}, reason={reason}")
    
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
    # В Swipe: user_id - кто сделал свайп, target_profile_id - на кого свайпнули
    likers_query = db.query(Swipe.user_id).filter(
        Swipe.target_profile_id == current_profile.id,
        Swipe.action == 'like'
    ).distinct()
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
    responded_swipes = db.query(Swipe.target_profile_id).filter(
        Swipe.user_id == user_id
    ).distinct().all()
    responded_profile_ids = [row[0] for row in responded_swipes] if responded_swipes else []
    
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

