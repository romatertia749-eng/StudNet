from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.auth import verify_jwt_token, TelegramAuthError

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """
    Dependency для получения user_id из JWT токена
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header. Use 'Authorization: Bearer <token>'"
        )
    
    token = authorization[7:]  # Удаляем "Bearer "
    
    try:
        user_id = verify_jwt_token(token)
        return int(user_id)
    except TelegramAuthError as e:
        raise HTTPException(status_code=403, detail=str(e))

