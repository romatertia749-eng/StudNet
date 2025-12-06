from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ConnectionFeedbackCreate, ConnectionFeedbackResponse
from app.services import connection_feedback_service

# Отдельный роутер ТОЛЬКО для POST запросов
router = APIRouter(prefix="/api/connection-feedback", tags=["connection-feedback"])

@router.post("", response_model=ConnectionFeedbackResponse)
@router.post("/", response_model=ConnectionFeedbackResponse)
def create_feedback(
    feedback: ConnectionFeedbackCreate,
    db: Session = Depends(get_db)
):
    """Создает отметку полезности для мэтча"""
    print(f"[connection_feedback_post router] ===== POST REQUEST RECEIVED =====")
    print(f"[connection_feedback_post router] match_id={feedback.match_id}, from={feedback.from_user_id}, to={feedback.to_user_id}, type={feedback.feedback_type}")
    try:
        result = connection_feedback_service.create_feedback(
            db=db,
            match_id=feedback.match_id,
            from_user_id=feedback.from_user_id,
            to_user_id=feedback.to_user_id,
            feedback_type=feedback.feedback_type
        )
        print(f"[connection_feedback_post router] Success: feedback_id={result.id}")
        return result
    except ValueError as e:
        print(f"[connection_feedback_post router] ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[connection_feedback_post router] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании отметки: {str(e)}")

