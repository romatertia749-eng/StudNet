from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import (
    ConnectionFeedbackCreate,
    ConnectionFeedbackResponse,
    ConnectionFeedbackType
)
from app.services import connection_feedback_service

router = APIRouter(prefix="/api/connection-feedback", tags=["connection-feedback"])

@router.post("", response_model=ConnectionFeedbackResponse, include_in_schema=True)
def create_feedback(
    feedback: ConnectionFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Создает отметку полезности для мэтча"""
    try:
        result = connection_feedback_service.create_feedback(
            db=db,
            match_id=feedback.match_id,
            from_user_id=feedback.from_user_id,
            to_user_id=feedback.to_user_id,
            feedback_type=feedback.feedback_type
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании отметки: {str(e)}")

@router.post("/", response_model=ConnectionFeedbackResponse, include_in_schema=True)
def create_feedback_with_slash(
    feedback: ConnectionFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Создает отметку полезности для мэтча (со слэшем)"""
    return create_feedback(feedback, db)

@router.get("/match/{match_id}", response_model=List[ConnectionFeedbackResponse])
def get_feedbacks_for_match(
    match_id: int,
    user_id: Optional[int] = Query(None, description="ID пользователя для фильтрации"),
    db: Session = Depends(get_db)
):
    """Получает все отметки для мэтча"""
    try:
        feedbacks = connection_feedback_service.get_feedbacks_for_match(
            db=db,
            match_id=match_id,
            user_id=user_id
        )
        return feedbacks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении отметок: {str(e)}")

@router.get("/types", response_model=List[str])
def get_feedback_types():
    """Получает список доступных типов отметок"""
    return ConnectionFeedbackType.all_types()

@router.get("/match-id")
def get_match_id(
    user1_id: int = Query(..., description="ID первого пользователя"),
    user2_id: int = Query(..., description="ID второго пользователя"),
    db: Session = Depends(get_db)
):
    """Получает ID мэтча между двумя пользователями"""
    try:
        match_id = connection_feedback_service.get_match_id_for_users(
            db=db,
            user1_id=user1_id,
            user2_id=user2_id
        )
        if match_id is None:
            raise HTTPException(status_code=404, detail="Мэтч не найден")
        return {"match_id": match_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении мэтча: {str(e)}")

