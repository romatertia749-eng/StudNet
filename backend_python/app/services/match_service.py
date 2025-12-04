from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from app.models import Swipe, Match, Profile

def like_profile(db: Session, user_id: int, target_profile_id: int) -> tuple[bool, int | None]:
    """Лайкает профиль и создает мэтч если есть взаимный лайк"""
    print(f"[like_profile] user_id={user_id}, target_profile_id={target_profile_id}")
    
    # Проверяем, существует ли профиль
    target_profile = db.query(Profile).filter(Profile.id == target_profile_id).first()
    if not target_profile:
        raise ValueError("Профиль не найден")
    
    print(f"[like_profile] Target profile found: user_id={target_profile.user_id}, name={target_profile.name}")
    
    # Проверяем, не был ли уже свайп
    existing_swipe = db.query(Swipe).filter(
        and_(
            Swipe.user_id == user_id,
            Swipe.target_profile_id == target_profile_id
        )
    ).first()
    
    if existing_swipe:
        raise ValueError("Вы уже взаимодействовали с этим профилем")
    
    # Сохраняем лайк
    swipe = Swipe(
        user_id=user_id,
        target_profile_id=target_profile_id,
        action="like"
    )
    db.add(swipe)
    db.commit()
    print(f"[like_profile] Swipe saved: user_id={user_id} -> profile_id={target_profile_id}")
    
    # Находим профиль текущего пользователя
    current_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not current_profile:
        print(f"[like_profile] WARNING: Current user profile not found for user_id={user_id}")
        return False, None
    
    print(f"[like_profile] Current profile found: id={current_profile.id}, name={current_profile.name}")
    
    # Проверяем взаимный лайк (ищем лайк от целевого профиля к текущему)
    mutual_swipe = db.query(Swipe).filter(
        and_(
            Swipe.user_id == target_profile.user_id,
            Swipe.target_profile_id == current_profile.id,
            Swipe.action == "like"
        )
    ).first()
    
    if mutual_swipe:
        print(f"[like_profile] MUTUAL LIKE FOUND! Creating match...")
        # Создаем мэтч (user1_id всегда меньше user2_id для уникальности)
        user1_id = min(user_id, target_profile.user_id)
        user2_id = max(user_id, target_profile.user_id)
        
        print(f"[like_profile] Match will be: user1_id={user1_id}, user2_id={user2_id}")
        
        # Проверяем, не существует ли уже мэтч
        existing_match = db.query(Match).filter(
            and_(
                Match.user1_id == user1_id,
                Match.user2_id == user2_id
            )
        ).first()
        
        if not existing_match:
            match = Match(user1_id=user1_id, user2_id=user2_id)
            db.add(match)
            db.commit()
            db.refresh(match)
            print(f"[like_profile] Match created! match_id={match.id}")
            return True, match.id
        else:
            print(f"[like_profile] Match already exists: match_id={existing_match.id}")
            return True, existing_match.id
    else:
        print(f"[like_profile] No mutual like yet. Waiting for other user to like back.")
    
    return False, None

def pass_profile(db: Session, user_id: int, target_profile_id: int):
    # Проверяем, не был ли уже свайп
    existing_swipe = db.query(Swipe).filter(
        and_(
            Swipe.user_id == user_id,
            Swipe.target_profile_id == target_profile_id
        )
    ).first()
    
    if existing_swipe:
        return  # Уже был свайп, ничего не делаем
    
    swipe = Swipe(
        user_id=user_id,
        target_profile_id=target_profile_id,
        action="pass"
    )
    db.add(swipe)
    db.commit()

def get_matches(db: Session, user_id: int) -> List[Match]:
    return db.query(Match).filter(
        or_(
            Match.user1_id == user_id,
            Match.user2_id == user_id
        )
    ).all()

