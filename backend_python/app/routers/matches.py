from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import LikeRequest, LikeResponse, PassResponse, MatchResponse, RespondToLikeRequest
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

@router.post("/likes/respond", response_model=LikeResponse)
def respond_to_like(
    request: RespondToLikeRequest,
    user_id: int = None,
    db: Session = Depends(get_db)
):
    """Ответить на входящий лайк: accept (мэтч) или decline (пропустить)"""
    # user_id берём из query params или из заголовка авторизации
    # Для простоты пока берём из query
    if user_id is None:
        raise HTTPException(status_code=400, detail="Параметр user_id обязателен")
    
    try:
        # Находим профиль того, кто лайкнул
        target_profile = profile_service.get_profile_by_user_id(db, request.targetUserId)
        if not target_profile:
            raise HTTPException(status_code=404, detail="Профиль не найден")
        
        if request.action == 'accept':
            # Accept = лайк в ответ, что создаст мэтч
            matched, match_id = match_service.like_profile(
                db=db,
                user_id=user_id,
                target_profile_id=target_profile.id
            )
            return LikeResponse(
                matched=matched,
                match_id=match_id,
                message="Вы замэтчились!" if matched else "Лайк отправлен"
            )
        else:
            # Decline = pass
            match_service.pass_profile(
                db=db,
                user_id=user_id,
                target_profile_id=target_profile.id
            )
            return LikeResponse(
                matched=False,
                message="Пропущено"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при ответе на лайк: {str(e)}")

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

