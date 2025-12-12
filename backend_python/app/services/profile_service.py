from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, not_
from typing import Optional, List
from app.models import Profile, Swipe, Match
from app.schemas import ProfileCreate
from app.services.file_storage import store_file
from fastapi import UploadFile
import math
import time
import json

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
    query_start_time = time.time()
    print(f"[get_available_profiles] ===== START ===== user_id={user_id}, city={city}, university={university}, interests={interests}, page={page}, size={size}")
    
    # Находим текущий профиль
    step_start = time.time()
    current_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    step_duration = (time.time() - step_start) * 1000
    if not current_profile:
        print(f"[get_available_profiles] ❌ Current user {user_id} has no profile")
        return {
            "content": [],
            "total_elements": 0,
            "total_pages": 0,
            "size": size,
            "number": page
        }
    print(f"[get_available_profiles] ✅ Current profile found: id={current_profile.id}, name={current_profile.name}")
    
    print(f"[get_available_profiles] Current profile: id={current_profile.id}, name={current_profile.name}")
    
    # Получаем ID всех профилей, с которыми уже взаимодействовали
    # (лайк, пасс, любой свайп - все действия создают запись в Swipe)
    # ВАЖНО: учитываем только свайпы, которые сделал ТЕКУЩИЙ пользователь
    # НЕ учитываем свайпы, которые сделали ДРУГИЕ пользователи на текущего
    step_start = time.time()
    swiped_records = db.query(Swipe.target_profile_id, Swipe.action).filter(
        Swipe.user_id == user_id
    ).distinct().all()
    swiped_duration = (time.time() - step_start) * 1000
    swiped_profile_ids = [row[0] for row in swiped_records]
    print(f"[get_available_profiles] Swiped profile IDs (swipes made by user {user_id}): {swiped_profile_ids}")
    # #region agent log
    try:
        log_data = {
            "location": "profile_service.py:get_available_profiles",
            "message": "Swiped profiles query completed",
            "data": {
                "userId": user_id,
                "swipedCount": len(swiped_profile_ids),
                "durationMs": round(swiped_duration, 2)
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "A"
        }
        with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[get_available_profiles] Failed to write log: {e}")
    # #endregion
    
    # ОПТИМИЗАЦИЯ: Объединяем два запроса matches в один с OR условием
    step_start = time.time()
    matched_user_ids = set()
    # Один запрос вместо двух - используем OR для поиска мэтчей где user_id в user1_id или user2_id
    matches = db.query(Match).filter(
        or_(Match.user1_id == user_id, Match.user2_id == user_id)
    ).all()
    for match in matches:
        if match.user1_id == user_id:
            matched_user_ids.add(match.user2_id)
        else:
            matched_user_ids.add(match.user1_id)
    matches_duration = (time.time() - step_start) * 1000
    print(f"[get_available_profiles] Matched user IDs: {matched_user_ids}")
    
    # Получаем ID профилей, с которыми уже есть мэтч
    matched_profile_ids = []
    if matched_user_ids:
        step_start = time.time()
        matched_profile_ids = [
            row[0] for row in db.query(Profile.id).filter(
                Profile.user_id.in_(matched_user_ids)
            ).all()
        ]
        matched_profiles_duration = (time.time() - step_start) * 1000
        print(f"[get_available_profiles] Matched profile IDs: {matched_profile_ids}")
        # #region agent log
        try:
            log_data = {
                "location": "profile_service.py:get_available_profiles",
                "message": "Matched profiles query completed",
                "data": {
                    "userId": user_id,
                    "matchedCount": len(matched_profile_ids),
                    "durationMs": round(matched_profiles_duration, 2)
                },
                "timestamp": int(time.time() * 1000),
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "B"
            }
            with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[get_available_profiles] Failed to write log: {e}")
        # #endregion
    else:
        print(f"[get_available_profiles] Matched profile IDs: []")
    
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
    step_start = time.time()
    total = query.count()
    count_duration = (time.time() - step_start) * 1000
    print(f"[get_available_profiles] Total profiles before pagination: {total}")
    
    if total == 0:
        print(f"[get_available_profiles] ⚠️ WARNING: Total is 0! No profiles match the query.")
        print(f"[get_available_profiles] Query filters applied: user_id!={user_id}, excluded_ids={excluded_profile_ids}, city={city}, university={university}")
    
    # Пагинация
    step_start = time.time()
    profiles = query.offset(page * size).limit(size).all()
    fetch_duration = (time.time() - step_start) * 1000
    
    # Логируем найденные профили (только количество для производительности)
    print(f"[get_available_profiles] ===== RESULT ===== Found {len(profiles)} profiles after all filters")
    # #region agent log
    try:
        log_data = {
            "location": "profile_service.py:get_available_profiles",
            "message": "Profiles fetched",
            "data": {
                "userId": user_id,
                "resultCount": len(profiles),
                "totalElements": total,
                "fetchDurationMs": round(fetch_duration, 2),
                "countDurationMs": round(count_duration, 2)
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "C"
        }
        with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[get_available_profiles] Failed to write log: {e}")
    # #endregion
    
    total_pages = math.ceil(total / size) if total > 0 else 0
    
    result = {
        "content": profiles,
        "total_elements": total,
        "total_pages": total_pages,
        "size": size,
        "number": page
    }
    
    total_duration = (time.time() - query_start_time) * 1000
    print(f"[get_available_profiles] ===== RETURNING ===== content.length={len(profiles)}, total_elements={total}")
    # matches_duration может быть не определена, если matches запрос не выполнился
    matches_duration_str = f"{matches_duration:.2f}ms" if 'matches_duration' in locals() else "N/A"
    print(f"[get_available_profiles] ⏱️ QUERY TIMING: total={total_duration:.2f}ms, swiped_query={swiped_duration:.2f}ms, matches_query={matches_duration_str}, count={count_duration:.2f}ms, fetch={fetch_duration:.2f}ms")
    
    # #region agent log
    try:
        log_data = {
            "location": "profile_service.py:get_available_profiles",
            "message": "Query completed",
            "data": {
                "userId": user_id,
                "totalDurationMs": round(total_duration, 2),
                "swipedQueryMs": round(swiped_duration, 2),
                "countMs": round(count_duration, 2),
                "fetchMs": round(fetch_duration, 2),
                "resultCount": len(profiles),
                "totalElements": total,
                "swipedCount": len(swiped_profile_ids)
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "E"
        }
        with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"[get_available_profiles] Failed to write log: {e}")
    # #endregion
    
    return result

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

