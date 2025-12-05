from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from pydantic import ValidationError
from app.database import get_db
from app.models import Profile
from app.schemas import ProfileCreate, ProfileResponse, PageResponse
from app.services import profile_service
import json

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

# ВАЖНО: Роуты с параметрами должны быть ПЕРЕД роутами без параметров
# Иначе FastAPI может неправильно их обработать

# Внутренняя функция для создания/обновления профиля
def _create_profile_impl(
    user_id: int,
    name: str,
    gender: str,
    age: int,
    city: str,
    university: str,
    interests: str,
    goals: str,
    bio: Optional[str],
    username: Optional[str],
    first_name: Optional[str],
    last_name: Optional[str],
    photo: Optional[UploadFile],
    db: Session
):
    try:
        # Валидация базовых полей
        if not name or len(name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Имя должно содержать минимум 2 символа")
        if not isinstance(age, int) or age < 15 or age > 50:
            raise HTTPException(status_code=400, detail="Возраст должен быть от 15 до 50 лет")
        if gender not in ["male", "female", "other"]:
            raise HTTPException(status_code=400, detail="Неверное значение пола")
        if not city or not city.strip():
            raise HTTPException(status_code=400, detail="Город обязателен")
        if not university or not university.strip():
            raise HTTPException(status_code=400, detail="Университет обязателен")
        
        # Валидация bio длины
        if bio and len(bio) > 300:
            raise HTTPException(status_code=400, detail="Описание не должно превышать 300 символов")
        
        # Валидация и парсинг interests и goals
        try:
            if not interests or not interests.strip():
                raise HTTPException(status_code=400, detail="Интересы обязательны")
            parsed_interests = json.loads(interests) if isinstance(interests, str) else interests
            if not isinstance(parsed_interests, list):
                raise HTTPException(status_code=400, detail="Интересы должны быть массивом")
            if len(parsed_interests) == 0:
                raise HTTPException(status_code=400, detail="Выберите хотя бы один интерес")
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Неверный формат интересов (ожидается JSON массив): {str(e)}")
        
        try:
            if not goals or not goals.strip():
                raise HTTPException(status_code=400, detail="Цели обязательны")
            parsed_goals = json.loads(goals) if isinstance(goals, str) else goals
            if not isinstance(parsed_goals, list):
                raise HTTPException(status_code=400, detail="Цели должны быть массивом")
            if len(parsed_goals) == 0:
                raise HTTPException(status_code=400, detail="Выберите хотя бы одну цель")
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Неверный формат целей (ожидается JSON массив): {str(e)}")
        
        # Создаем ProfileCreate с валидированными данными
        try:
            profile_data = ProfileCreate(
                user_id=user_id,
                name=name.strip(),
                gender=gender,
                age=age,
                city=city.strip(),
                university=university.strip(),
                interests=interests,  # Оставляем как строку для схемы
                goals=goals,  # Оставляем как строку для схемы
                bio=bio.strip() if bio else None,
                username=username.strip() if username else None,
                first_name=first_name.strip() if first_name else None,
                last_name=last_name.strip() if last_name else None
            )
        except ValidationError as e:
            error_messages = []
            for error in e.errors():
                field = '.'.join(str(x) for x in error['loc'])
                error_messages.append(f"{field}: {error['msg']}")
            raise HTTPException(status_code=400, detail=f"Ошибка валидации: {', '.join(error_messages)}")
        
        # Создаем или обновляем профиль
        try:
            profile = profile_service.create_or_update_profile(
                db=db,
                user_id=user_id,
                profile_data=profile_data,
                photo=photo
            )
            return profile
        except IntegrityError as e:
            db.rollback()
            error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
            if 'unique constraint' in error_msg.lower() or 'duplicate' in error_msg.lower():
                raise HTTPException(status_code=400, detail="Профиль с таким user_id уже существует")
            raise HTTPException(status_code=400, detail=f"Ошибка базы данных: {error_msg}")
        except Exception as db_error:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Ошибка при сохранении профиля: {str(db_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании профиля: {str(e)}")

# POST /api/profiles - создание/обновление профиля (без слэша)
@router.post("", response_model=ProfileResponse, include_in_schema=True)
def create_profile(
    user_id: int = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    age: int = Form(...),
    city: str = Form(...),
    university: str = Form(...),
    interests: str = Form(...),
    goals: str = Form(...),
    bio: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    return _create_profile_impl(
        user_id, name, gender, age, city, university, interests, goals,
        bio, username, first_name, last_name, photo, db
    )

# POST /api/profiles/ - создание/обновление профиля (со слэшем)
# Этот роут обрабатывается fallback роутом в main.py, но оставляем для совместимости
@router.post("/", response_model=ProfileResponse, include_in_schema=True)
def create_profile_with_slash(
    user_id: int = Form(...),
    name: str = Form(...),
    gender: str = Form(...),
    age: int = Form(...),
    city: str = Form(...),
    university: str = Form(...),
    interests: str = Form(...),
    goals: str = Form(...),
    bio: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    return _create_profile_impl(
        user_id, name, gender, age, city, university, interests, goals,
        bio, username, first_name, last_name, photo, db
    )

# Важно: более специфичные роуты должны быть ПЕРЕД общим роутом /{profile_id}
@router.get("/check/{user_id}")
def check_profile_exists(user_id: int, db: Session = Depends(get_db)):
    """Проверяет наличие профиля у пользователя"""
    profile = profile_service.get_profile_by_user_id(db, user_id)
    return {"exists": profile is not None}

@router.get("/incoming-likes", response_model=PageResponse)
def get_incoming_likes(
    user_id: Optional[int] = None,
    page: int = 0,
    size: int = 20,
    db: Session = Depends(get_db)
):
    """Получает профили людей, которые лайкнули текущего пользователя"""
    if user_id is None:
        raise HTTPException(status_code=400, detail="Параметр user_id обязателен")
    
    try:
        result = profile_service.get_incoming_likes(
            db=db,
            user_id=user_id,
            page=page,
            size=size
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in get_incoming_likes: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ошибка при получении входящих лайков: {str(e)}")

@router.get("/user/{user_id}", response_model=ProfileResponse)
def get_profile_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Получает профиль пользователя по user_id"""
    profile = profile_service.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

# GET /api/profiles - получение списка профилей (должен быть ПОСЛЕ специфичных роутов)
@router.get("", response_model=PageResponse, include_in_schema=True)
def get_profiles(
    user_id: Optional[int] = None,
    city: Optional[str] = None,
    university: Optional[str] = None,
    interests: Optional[str] = None,  # Добавляем параметр, но пока не используем
    page: int = 0,
    size: int = 20,
    db: Session = Depends(get_db)
):
    print(f"[get_profiles] Request: user_id={user_id}, city={city}, university={university}, interests={interests}, page={page}, size={size}")
    if user_id is None:
        raise HTTPException(status_code=400, detail="Параметр userId обязателен")
    
    try:
        result = profile_service.get_available_profiles(
            db=db,
            user_id=user_id,
            city=city,
            university=university,
            interests=interests,
            page=page,
            size=size
        )
        print(f"[get_profiles] Returning {len(result.get('content', []))} profiles, total={result.get('total_elements', 0)}")
        return result
    except Exception as e:
        print(f"[get_profiles] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при получении профилей: {str(e)}")

# GET /api/profiles/ - получение списка профилей СО СЛЭШЕМ (для совместимости)
@router.get("/", response_model=PageResponse, include_in_schema=True)
def get_profiles_with_slash(
    user_id: Optional[int] = None,
    city: Optional[str] = None,
    university: Optional[str] = None,
    interests: Optional[str] = None,
    page: int = 0,
    size: int = 20,
    db: Session = Depends(get_db)
):
    """Тот же endpoint, но со слэшем - вызывает ту же функцию"""
    return get_profiles(user_id, city, university, interests, page, size, db)

@router.get("/debug/all", response_model=PageResponse, include_in_schema=False)
def get_all_profiles_debug(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Отладочный endpoint - возвращает ВСЕ профили кроме текущего пользователя"""
    if user_id is None:
        raise HTTPException(status_code=400, detail="Параметр user_id обязателен")
    
    # Простой запрос - все профили кроме текущего пользователя
    profiles = db.query(Profile).filter(Profile.user_id != user_id).all()
    
    # Проверяем Swipe записи
    from app.models import Swipe
    swipes = db.query(Swipe).filter(Swipe.user_id == user_id).all()
    
    print(f"[DEBUG] All profiles for user {user_id}:")
    for p in profiles:
        print(f"  - id={p.id}, user_id={p.user_id}, name={p.name}, city={p.city}, university={p.university}, interests={p.interests}")
    
    print(f"[DEBUG] Swipes made by user {user_id}:")
    for s in swipes:
        print(f"  - Swipe: user_id={s.user_id}, target_profile_id={s.target_profile_id}, action={s.action}")
    
    return {
        "content": profiles,
        "total_elements": len(profiles),
        "total_pages": 1,
        "size": len(profiles),
        "number": 0
    }

@router.get("/debug/simple", include_in_schema=False)
def get_profiles_simple(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """УПРОЩЕННЫЙ endpoint БЕЗ фильтров - возвращает ВСЕ профили кроме текущего"""
    if user_id is None:
        return {"error": "user_id required", "profiles": []}
    
    # ВСЕ профили кроме текущего пользователя, БЕЗ фильтров
    profiles = db.query(Profile).filter(Profile.user_id != user_id).all()
    
    # Простая сериализация
    result = []
    for p in profiles:
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "name": p.name,
            "gender": p.gender,
            "age": p.age,
            "city": p.city,
            "university": p.university,
            "interests": p.interests,
            "goals": p.goals,
            "bio": p.bio,
            "photo_url": p.photo_url
        })
    
    print(f"[DEBUG SIMPLE] Returning {len(result)} profiles for user {user_id}")
    return {"content": result, "total": len(result)}

@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    """Получает профиль по ID"""
    profile = profile_service.get_profile_by_id(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    return profile

