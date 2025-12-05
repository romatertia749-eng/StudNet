import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv
from PIL import Image
import io

# Загружаем переменные из .env файла
load_dotenv()

MAX_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

# Настройка директории для загрузки файлов
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads/photos")
UPLOAD_PATH = Path(UPLOAD_DIR)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

def store_file(file: UploadFile) -> str:
    """
    Сохраняет загруженный файл локально и возвращает относительный путь к файлу.
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
            # Конвертируем в RGB если нужно (для PNG с прозрачностью)
            if image.mode in ("RGBA", "LA", "P"):
                image = image.convert("RGB")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Некорректное изображение: {str(e)}"
            )
        
        # Генерируем уникальное имя файла
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        if file_extension.lower() not in ["jpg", "jpeg", "png", "webp"]:
            file_extension = "jpg"
        
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_PATH / unique_filename
        
        # Оптимизируем и сохраняем изображение
        # Максимальный размер 800x800
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Сохраняем файл
        image.save(file_path, "JPEG", quality=85, optimize=True)
        
        # Возвращаем относительный путь для URL
        return f"/uploads/photos/{unique_filename}"
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при сохранении файла: {error_msg}"
        )
