from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models import ConnectionFeedback, Match, Profile
from app.schemas import ConnectionFeedbackType

def create_feedback(
    db: Session,
    match_id: int,
    from_user_id: int,
    to_user_id: int,
    feedback_type: str
) -> ConnectionFeedback:
    """Создает отметку полезности для мэтча"""
    
    # Проверяем, что тип валидный
    if feedback_type not in ConnectionFeedbackType.all_types():
        raise ValueError(f"Неверный тип отметки: {feedback_type}")
    
    # Проверяем, что мэтч существует
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise ValueError("Мэтч не найден")
    
    # Проверяем, что пользователи являются участниками мэтча
    if not ((match.user1_id == from_user_id and match.user2_id == to_user_id) or
            (match.user1_id == to_user_id and match.user2_id == from_user_id)):
        raise ValueError("Пользователи не являются участниками этого мэтча")
    
    # Проверяем, что не существует уже такой отметки
    existing = db.query(ConnectionFeedback).filter(
        and_(
            ConnectionFeedback.match_id == match_id,
            ConnectionFeedback.from_user_id == from_user_id,
            ConnectionFeedback.feedback_type == feedback_type
        )
    ).first()
    
    if existing:
        raise ValueError("Такая отметка уже существует")
    
    # Создаем отметку
    feedback = ConnectionFeedback(
        match_id=match_id,
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        feedback_type=feedback_type
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

def get_feedbacks_for_match(
    db: Session,
    match_id: int,
    user_id: Optional[int] = None
) -> List[ConnectionFeedback]:
    """Получает все отметки для мэтча, опционально фильтруя по пользователю"""
    query = db.query(ConnectionFeedback).filter(
        ConnectionFeedback.match_id == match_id
    )
    
    if user_id:
        query = query.filter(
            ConnectionFeedback.from_user_id == user_id
        )
    
    return query.all()

def get_user_stats(db: Session, user_id: int) -> dict:
    """Получает статистику отметок для пользователя"""
    
    # Сколько раз помог другим (I_HELPED от него к другим)
    helped_others = db.query(func.count(ConnectionFeedback.id)).filter(
        and_(
            ConnectionFeedback.from_user_id == user_id,
            ConnectionFeedback.feedback_type == ConnectionFeedbackType.I_HELPED
        )
    ).scalar() or 0
    
    # Сколько раз ему помогли (HELPED_ME от других к нему)
    helped_me = db.query(func.count(ConnectionFeedback.id)).filter(
        and_(
            ConnectionFeedback.to_user_id == user_id,
            ConnectionFeedback.feedback_type == ConnectionFeedbackType.HELPED_ME
        )
    ).scalar() or 0
    
    # Сколько было совместных проектов/хакатонов (PROJECT_TOGETHER)
    # Считаем уникальные мэтчи с отметками PROJECT_TOGETHER, где пользователь участвовал
    projects_feedbacks = db.query(ConnectionFeedback.match_id).filter(
        and_(
            or_(
                ConnectionFeedback.from_user_id == user_id,
                ConnectionFeedback.to_user_id == user_id
            ),
            ConnectionFeedback.feedback_type == ConnectionFeedbackType.PROJECT_TOGETHER
        )
    ).distinct().all()
    projects_together = len(projects_feedbacks)
    
    # Сколько было совместных ивентов (EVENT_TOGETHER)
    events_feedbacks = db.query(ConnectionFeedback.match_id).filter(
        and_(
            or_(
                ConnectionFeedback.from_user_id == user_id,
                ConnectionFeedback.to_user_id == user_id
            ),
            ConnectionFeedback.feedback_type == ConnectionFeedbackType.EVENT_TOGETHER
        )
    ).distinct().all()
    events_together = len(events_feedbacks)
    
    return {
        "helped_others": helped_others,
        "helped_me": helped_me,
        "projects_together": projects_together,
        "events_together": events_together
    }

def get_match_id_for_users(db: Session, user1_id: int, user2_id: int) -> Optional[int]:
    """Получает ID мэтча между двумя пользователями"""
    match = db.query(Match).filter(
        or_(
            and_(Match.user1_id == user1_id, Match.user2_id == user2_id),
            and_(Match.user1_id == user2_id, Match.user2_id == user1_id)
        )
    ).first()
    
    return match.id if match else None

