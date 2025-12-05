import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv
from PIL import Image
import io
from imagekitio import ImageKit

# Загружаем переменные из .env файла
load_dotenv()

MAX_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

# Настройка ImageKit
IMAGEKIT_PUBLIC_KEY = os.getenv("IMAGEKIT_PUBLIC_KEY", "")
IMAGEKIT_PRIVATE_KEY = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
IMAGEKIT_URL_ENDPOINT = os.getenv("IMAGEKIT_URL_ENDPOINT", "")

# Инициализация ImageKit
imagekit = None
if IMAGEKIT_PUBLIC_KEY and IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT:
    try:
        imagekit = ImageKit(
            public_key=IMAGEKIT_PUBLIC_KEY,
            private_key=IMAGEKIT_PRIVATE_KEY,
            url_endpoint=IMAGEKIT_URL_ENDPOINT
        )
        print(f"ImageKit initialized successfully with endpoint: {IMAGEKIT_URL_ENDPOINT}")
    except Exception as e:
        print(f"Warning: Failed to initialize ImageKit: {e}")
else:
    missing = []
    if not IMAGEKIT_PUBLIC_KEY:
        missing.append("IMAGEKIT_PUBLIC_KEY")
    if not IMAGEKIT_PRIVATE_KEY:
        missing.append("IMAGEKIT_PRIVATE_KEY")
    if not IMAGEKIT_URL_ENDPOINT:
        missing.append("IMAGEKIT_URL_ENDPOINT")
    print(f"Warning: ImageKit not configured. Missing: {', '.join(missing)}")

def store_file(file: UploadFile) -> str:
    """
    Загружает файл в ImageKit и возвращает URL загруженного изображения.
    """
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
    
    # Проверяем, что ImageKit настроен
    if not imagekit:
        raise HTTPException(
            status_code=500,
            detail="ImageKit не настроен. Настройте IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY и IMAGEKIT_URL_ENDPOINT"
        )
    
    try:
        # Читаем содержимое файла
        content = file.file.read()
        file.file.seek(0)  # Возвращаем указатель в начало
        
        # Проверяем, что это действительно изображение
        try:
            image = Image.open(io.BytesIO(content))
            # Конвертируем в RGB если нужно (для PNG с прозрачностью)
            if image.mode in ("RGBA", "LA", "P"):
                image = image.convert("RGB")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Некорректное изображение: {str(e)}"
            )
        
        # Оптимизируем изображение перед загрузкой
        # Максимальный размер 800x800
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Сохраняем оптимизированное изображение в буфер
        output_buffer = io.BytesIO()
        image.save(output_buffer, format="JPEG", quality=85, optimize=True)
        output_buffer.seek(0)
        
        # Генерируем уникальное имя файла
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        if file_extension.lower() not in ["jpg", "jpeg", "png", "webp"]:
            file_extension = "jpg"
        
        unique_filename = f"profile_{uuid.uuid4()}.{file_extension}"
        
        # Загружаем в ImageKit
        try:
            upload_result = imagekit.upload_file(
                file=output_buffer.getvalue(),
                file_name=unique_filename,
                options={
                    "folder": "/networking_app/profiles/",
                    "use_unique_file_name": False,  # Мы уже используем UUID
                }
            )
        except Exception as upload_error:
            error_msg = str(upload_error)
            print(f"ImageKit upload error: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при загрузке в ImageKit: {error_msg}"
            )
        
        # Возвращаем URL загруженного изображения
        # ImageKit возвращает объект с атрибутом url или словарь
        if upload_result:
            # Проверяем разные варианты структуры ответа
            if hasattr(upload_result, 'url'):
                return upload_result.url
            elif hasattr(upload_result, 'fileUrl'):
                return upload_result.fileUrl
            elif isinstance(upload_result, dict):
                url = upload_result.get('url') or upload_result.get('URL') or upload_result.get('fileUrl')
                if url:
                    return url
            elif hasattr(upload_result, 'response_metadata'):
                # Если это объект с response_metadata
                metadata = upload_result.response_metadata
                if isinstance(metadata, dict):
                    url = metadata.get('url') or metadata.get('URL') or metadata.get('fileUrl')
                    if url:
                        return url
        
        # Если не удалось получить URL, выводим информацию для отладки
        print(f"ImageKit upload_result type: {type(upload_result)}")
        print(f"ImageKit upload_result: {upload_result}")
        raise HTTPException(
            status_code=500,
            detail="Не удалось получить URL загруженного файла из ImageKit"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при загрузке файла в ImageKit: {error_msg}"
        )
