import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv
from PIL import Image, ImageOps
import io

# Загружаем переменные из .env файла
load_dotenv()

MAX_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

# Путь для сохранения загруженных фотографий
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads" / "photos"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def store_file(file: UploadFile) -> str:
    """
    Сохраняет файл локально и возвращает относительный путь к файлу.
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
    
    try:
        # Читаем содержимое файла
        content = file.file.read()
        file.file.seek(0)  # Возвращаем указатель в начало
        
        # Проверяем, что это действительно изображение
        try:
            image = Image.open(io.BytesIO(content))
            
            # ИСПРАВЛЕНИЕ ОРИЕНТАЦИИ: учитываем EXIF данные
            # Многие камеры/телефоны сохраняют ориентацию в EXIF, а не поворачивают само изображение
            try:
                # ImageOps.exif_transpose автоматически поворачивает изображение согласно EXIF
                image = ImageOps.exif_transpose(image)
            except Exception as exif_error:
                # Если EXIF данные отсутствуют или повреждены, продолжаем без поворота
                print(f"Note: Could not apply EXIF orientation: {exif_error}")
            
            # Конвертируем в RGB если нужно (для PNG с прозрачностью)
            if image.mode in ("RGBA", "LA", "P"):
                image = image.convert("RGB")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Некорректное изображение: {str(e)}"
            )
        
        # Оптимизируем изображение перед сохранением
        # Максимальный размер 800x800
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Генерируем уникальное имя файла
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        if file_extension.lower() not in ["jpg", "jpeg", "png", "webp"]:
            file_extension = "jpg"
        
        unique_filename = f"profile_{uuid.uuid4()}.{file_extension}"
        file_path = UPLOADS_DIR / unique_filename
        
        # Сохраняем оптимизированное изображение
        image.save(file_path, format="JPEG", quality=85, optimize=True)
        
        # Возвращаем относительный путь для использования в URL
        return f"/uploads/photos/{unique_filename}"
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при сохранении файла: {error_msg}"
        )
