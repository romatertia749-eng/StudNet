from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import LikeRequest, LikeResponse, PassResponse, MatchResponse
from app.services import match_service, profile_service
from app.models import Match

router = APIRouter(prefix="/api", tags=["matches"])

@router.post("/profiles/{profile_id}/like", response_model=LikeResponse)
def like_profile(
    profile_id: int,
    request: LikeRequest,
    db: Session = Depends(get_db)
):
    try:
        matched, match_id = match_service.like_profile(
            db=db,
            user_id=request.user_id,
            target_profile_id=profile_id
        )
        
        if matched:
            return LikeResponse(
                matched=True,
                match_id=match_id,
                message="Вы замэтчились!"
            )
        else:
            return LikeResponse(
                matched=False,
                message="Лайк отправлен"
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обработке лайка: {str(e)}")

@router.post("/profiles/{profile_id}/pass", response_model=PassResponse)
def pass_profile(
    profile_id: int,
    request: LikeRequest,
    db: Session = Depends(get_db)
):
    try:
        match_service.pass_profile(
            db=db,
            user_id=request.user_id,
            target_profile_id=profile_id
        )
        return PassResponse()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при обработке пропуска: {str(e)}")

@router.get("/matches", response_model=List[MatchResponse])
def get_matches(user_id: int, db: Session = Depends(get_db)):
    matches = match_service.get_matches(db, user_id)
    
    responses = []
    for match in matches:
        # Находим профиль второго пользователя
        other_user_id = match.user2_id if match.user1_id == user_id else match.user1_id
        other_profile = profile_service.get_profile_by_user_id(db, other_user_id)
        
        responses.append(MatchResponse(
            id=match.id,
            matched_profile=other_profile,
            matched_at=match.matched_at
        ))
    
    return responses

