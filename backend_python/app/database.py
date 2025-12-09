from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Загружаем переменные из .env файла (только для локальной разработки)
# В production (Koyeb) переменные окружения устанавливаются через панель управления
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Настройки для Neon PostgreSQL
# Neon требует SSL соединения и поддерживает connection pooling
connect_args = {}
if "neon.tech" in DATABASE_URL or "sslmode=require" in DATABASE_URL:
    # Для Neon используем SSL и connection pooling
    connect_args = {
        "sslmode": "require",
        "connect_timeout": 10,
    }
    # Если используется pooler URL (содержит -pooler), используем его
    if "-pooler" in DATABASE_URL:
        # Pooler уже настроен в connection string
        pass

# Создаем engine с connection pooling для Neon
# pool_size и max_overflow оптимизированы для serverless окружения
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Проверяем соединения перед использованием
    pool_recycle=3600,  # Пересоздаем соединения каждый час
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

