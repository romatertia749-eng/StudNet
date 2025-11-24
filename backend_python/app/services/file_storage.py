import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

# Загружаем переменные из .env файла
load_dotenv()

MAX_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

# Настройка Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "")
)

def store_file(file: UploadFile) -> str:
    if not file or file.size == 0:
        return None
    
    # Проверка размера
    if file.size and file.size > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Файл слишком большой. Максимум: {MAX_SIZE / 1024 / 1024}MB"
        )
    
    # Проверка типа
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Недопустимый тип файла. Разрешены: JPEG, PNG, WebP"
        )
    
    # Если Cloudinary не настроен, используем fallback (сохранение в БД как base64)
    if not os.getenv("CLOUDINARY_CLOUD_NAME"):
        # Fallback: возвращаем None, фото не сохраняется
        # В будущем можно сохранять как base64 в БД
        raise HTTPException(
            status_code=500,
            detail="Cloudinary не настроен. Пожалуйста, настройте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY и CLOUDINARY_API_SECRET"
        )
    
    try:
        # Проверяем, что Cloudinary настроен правильно
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
        if not cloud_name:
            raise HTTPException(
                status_code=500,
                detail="CLOUDINARY_CLOUD_NAME не задан. Проверьте переменные окружения в Koyeb."
            )
        
        # Читаем содержимое файла
        content = file.file.read()
        file.file.seek(0)  # Возвращаем указатель в начало
        
        # Загружаем в Cloudinary
        upload_result = cloudinary.uploader.upload(
            content,
            folder="networking_app/profiles",
            resource_type="image",
            transformation=[
                {"width": 800, "height": 800, "crop": "limit"},
                {"quality": "auto"}
            ]
        )
        
        # Возвращаем URL загруженного изображения
        return upload_result.get("secure_url") or upload_result.get("url")
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Более понятное сообщение об ошибке
        if "invalid cloud name" in error_msg.lower():
            raise HTTPException(
                status_code=500,
                detail=f"Неверный Cloud name. Проверьте, что CLOUDINARY_CLOUD_NAME в Koyeb равен вашему Cloud name из Cloudinary Dashboard (сейчас: '{cloud_name}'). Cloud name должен быть без пробелов и специальных символов."
            )
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при загрузке файла в Cloudinary: {error_msg}"
        )

