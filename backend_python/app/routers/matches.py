from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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
        print(f"[pass_profile] user_id={request.user_id}, target_profile_id={profile_id}")
        match_service.pass_profile(
            db=db,
            user_id=request.user_id,
            target_profile_id=profile_id
        )
        print(f"[pass_profile] Pass saved successfully")
        return PassResponse(message="Пропущено")
    except Exception as e:
        print(f"[pass_profile] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при обработке пропуска: {str(e)}")

@router.post("/likes/respond", response_model=LikeResponse)
def respond_to_like(
    request: RespondToLikeRequest,
    user_id: Optional[int] = Query(None, description="ID текущего пользователя"),
    db: Session = Depends(get_db)
):
    """Ответить на входящий лайк: accept (мэтч) или decline (пропустить)"""
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
    """Получает список мэтчей для пользователя"""
    try:
        print(f"[get_matches] Request received for user_id={user_id} (type: {type(user_id)})")
        
        # Проверяем, что user_id правильный тип
        user_id = int(user_id)
        
        matches = match_service.get_matches(db, user_id)
        print(f"[get_matches] Found {len(matches)} matches for user_id {user_id}")
        
        if len(matches) == 0:
            print(f"[get_matches] No matches found. Checking if user_id exists in matches table...")
            # Проверяем все мэтчи для отладки
            all_matches = db.query(Match).all()
            print(f"[get_matches] Total matches in DB: {len(all_matches)}")
            for m in all_matches:
                print(f"[get_matches] DB match: id={m.id}, user1_id={m.user1_id} (type: {type(m.user1_id)}), user2_id={m.user2_id} (type: {type(m.user2_id)})")
        
        responses = []
        for match in matches:
            # Находим профиль второго пользователя
            other_user_id = match.user2_id if match.user1_id == user_id else match.user1_id
            print(f"[get_matches] Processing match {match.id}: user1_id={match.user1_id}, user2_id={match.user2_id}, other_user_id={other_user_id}")
            
            other_profile = profile_service.get_profile_by_user_id(db, other_user_id)
            
            if not other_profile:
                print(f"[get_matches] WARNING: Profile not found for user_id {other_user_id} in match {match.id}")
                # Проверяем, есть ли профиль с таким user_id вообще
                from app.models import Profile
                all_profiles = db.query(Profile).filter(Profile.user_id == other_user_id).all()
                print(f"[get_matches] Profiles with user_id {other_user_id}: {len(all_profiles)}")
                continue
            
            print(f"[get_matches] Found profile for user_id {other_user_id}: id={other_profile.id}, name={other_profile.name}, user_id={other_profile.user_id}")
            
            # Создаем MatchResponse
            match_response = MatchResponse(
                id=match.id,
                matched_profile=other_profile,
                matched_at=match.matched_at
            )
            
            print(f"[get_matches] Created MatchResponse: id={match_response.id}, profile_id={match_response.matched_profile.id if match_response.matched_profile else None}")
            responses.append(match_response)
        
        print(f"[get_matches] Returning {len(responses)} match responses")
        if len(responses) > 0:
            print(f"[get_matches] First response profile: {responses[0].matched_profile.name if responses[0].matched_profile else 'None'}")
        return responses
    except Exception as e:
        import traceback
        print(f"[get_matches] ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ошибка при получении мэтчей: {str(e)}")

