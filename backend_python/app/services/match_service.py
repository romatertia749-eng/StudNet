from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
from app.models import Swipe, Match, Profile

def like_profile(db: Session, user_id: int, target_profile_id: int) -> tuple[bool, int | None]:
    # Проверяем, существует ли профиль
    target_profile = db.query(Profile).filter(Profile.id == target_profile_id).first()
    if not target_profile:
        raise ValueError("Профиль не найден")
    
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
    
    # Находим профиль текущего пользователя
    current_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not current_profile:
        return False, None
    
    # Проверяем взаимный лайк (ищем лайк от целевого профиля к текущему)
    mutual_swipe = db.query(Swipe).filter(
        and_(
            Swipe.user_id == target_profile.user_id,
            Swipe.target_profile_id == current_profile.id,
            Swipe.action == "like"
        )
    ).first()
    
    if mutual_swipe:
        # Создаем мэтч (user1_id всегда меньше user2_id для уникальности)
        user1_id = min(user_id, target_profile.user_id)
        user2_id = max(user_id, target_profile.user_id)
        
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
            return True, match.id
    
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

