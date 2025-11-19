import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

# Загружаем переменные из .env файла
load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads/photos")
MAX_SIZE = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

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
    
    # Создание директории если не существует
    upload_path = Path(UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Генерация уникального имени файла
    extension = ""
    if file.filename and "." in file.filename:
        extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    
    # Сохранение файла
    file_path = upload_path / filename
    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)
    
    # Возвращаем относительный путь или URL
    return f"/uploads/photos/{filename}"

