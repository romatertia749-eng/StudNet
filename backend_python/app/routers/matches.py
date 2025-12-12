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
    import time
    import json
    query_start_time = time.time()
    try:
        # #region agent log
        try:
            log_data = {
                "location": "matches.py:get_matches",
                "message": "Request started",
                "data": {"userId": user_id},
                "timestamp": int(time.time() * 1000),
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "D"
            }
            with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[get_matches] Failed to write log: {e}")
        # #endregion
        
        # Проверяем, что user_id правильный тип
        user_id = int(user_id)
        
        # Получаем мэтчи
        step_start = time.time()
        matches = match_service.get_matches(db, user_id)
        matches_duration = (time.time() - step_start) * 1000
        print(f"[get_matches] Found {len(matches)} matches for user_id {user_id}")
        
        if len(matches) == 0:
            return []
        
        # ОПТИМИЗАЦИЯ: Загружаем все профили одним запросом вместо N+1
        other_user_ids = []
        for match in matches:
            other_user_id = match.user2_id if match.user1_id == user_id else match.user1_id
            other_user_ids.append(other_user_id)
        
        # Один запрос для всех профилей
        step_start = time.time()
        from app.models import Profile
        profiles_dict = {}
        if other_user_ids:
            profiles = db.query(Profile).filter(Profile.user_id.in_(other_user_ids)).all()
            profiles_dict = {p.user_id: p for p in profiles}
        profiles_duration = (time.time() - step_start) * 1000
        
        # #region agent log
        try:
            log_data = {
                "location": "matches.py:get_matches",
                "message": "Profiles bulk loaded",
                "data": {
                    "userId": user_id,
                    "matchesCount": len(matches),
                    "profilesLoaded": len(profiles_dict),
                    "matchesDurationMs": round(matches_duration, 2),
                    "profilesDurationMs": round(profiles_duration, 2)
                },
                "timestamp": int(time.time() * 1000),
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "D"
            }
            with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[get_matches] Failed to write log: {e}")
        # #endregion
        
        # Создаем ответы
        responses = []
        for match in matches:
            other_user_id = match.user2_id if match.user1_id == user_id else match.user1_id
            other_profile = profiles_dict.get(other_user_id)
            
            if not other_profile:
                print(f"[get_matches] WARNING: Profile not found for user_id {other_user_id} in match {match.id}")
                continue
            
            match_response = MatchResponse(
                id=match.id,
                matched_profile=other_profile,
                matched_at=match.matched_at
            )
            responses.append(match_response)
        
        total_duration = (time.time() - query_start_time) * 1000
        print(f"[get_matches] Returning {len(responses)} match responses (total: {total_duration:.2f}ms)")
        
        # #region agent log
        try:
            log_data = {
                "location": "matches.py:get_matches",
                "message": "Request completed",
                "data": {
                    "userId": user_id,
                    "resultCount": len(responses),
                    "totalDurationMs": round(total_duration, 2)
                },
                "timestamp": int(time.time() * 1000),
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "D"
            }
            with open(r"c:\Users\Lenovo\max-networking-app\.cursor\debug.log", "a", encoding="utf-8") as f:
                f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
        except Exception as e:
            print(f"[get_matches] Failed to write log: {e}")
        # #endregion
        
        return responses
    except Exception as e:
        import traceback
        print(f"[get_matches] ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ошибка при получении мэтчей: {str(e)}")

