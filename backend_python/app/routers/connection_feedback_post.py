from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from app.database import get_db
from app.schemas import ConnectionFeedbackCreate, ConnectionFeedbackResponse
from app.services import connection_feedback_service

logger = logging.getLogger(__name__)

# Отдельный роутер ТОЛЬКО для POST запросов
router = APIRouter(prefix="/api/connection-feedback", tags=["connection-feedback"])

@router.post("", response_model=ConnectionFeedbackResponse)
@router.post("/", response_model=ConnectionFeedbackResponse)
def create_feedback(
    feedback: ConnectionFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Создает отметку полезности для мэтча"""
    logger.info(f"[connection_feedback_post] POST request: match_id={feedback.match_id}, from={feedback.from_user_id}, to={feedback.to_user_id}, type={feedback.feedback_type}")
    try:
        result = connection_feedback_service.create_feedback(
            db=db,
            match_id=feedback.match_id,
            from_user_id=feedback.from_user_id,
            to_user_id=feedback.to_user_id,
            feedback_type=feedback.feedback_type
        )
        logger.info(f"[connection_feedback_post] Success: feedback_id={result.id}")
        return result
    except ValueError as e:
        logger.warning(f"[connection_feedback_post] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[connection_feedback_post] Exception: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка при создании отметки: {str(e)}")

