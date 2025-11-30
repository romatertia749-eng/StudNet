"""
Скрипт для добавления моковых данных:
- Профиль для пользователя ZloiMyxZzz
- 10 других профилей
- Мэтчи между ZloiMyxZzz и 10 профилями
- Один входящий лайк от одного из профилей к ZloiMyxZzz
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Profile, Swipe, Match, Base
import json

# Создаем таблицы если их нет
Base.metadata.create_all(bind=engine)

def add_mock_data():
    db: Session = SessionLocal()
    
    try:
        # 1. Находим или создаем профиль для ZloiMyxZzz
        # Сначала ищем по username (может быть с @ или без)
        from sqlalchemy import or_
        zloi_profile = db.query(Profile).filter(
            or_(Profile.username == "ZloiMyxZzz", Profile.username == "@ZloiMyxZzz")
        ).first()
        
        if zloi_profile:
            zloi_user_id = zloi_profile.user_id
            print(f"✓ Найден существующий профиль ZloiMyxZzz (user_id: {zloi_user_id}, profile_id: {zloi_profile.id})")
        else:
            # Если не найден, создаем новый с user_id
            # Сначала проверяем, нет ли уже профиля с таким user_id
            zloi_user_id = 999999999  # Используем специальный user_id для теста
            existing_by_user_id = db.query(Profile).filter(Profile.user_id == zloi_user_id).first()
            if existing_by_user_id:
                zloi_profile = existing_by_user_id
                zloi_user_id = existing_by_user_id.user_id
                print(f"✓ Найден профиль по user_id (user_id: {zloi_user_id}, profile_id: {zloi_profile.id})")
            else:
                zloi_profile = Profile(
                    user_id=zloi_user_id,
                    username="ZloiMyxZzz",
                    first_name="Zloi",
                    last_name="MyxZzz",
                    name="Zloi MyxZzz",
                    gender="male",
                    age=22,
                    city="Москва",
                    university="МГУ",
                    interests=json.dumps(["IT", "Программирование", "Хакатоны"]),
                    goals=json.dumps(["Совместная учёба", "Хакатон", "Проекты"]),
                    bio="Разработчик, ищу единомышленников для проектов и хакатонов"
                )
                db.add(zloi_profile)
                db.commit()
                db.refresh(zloi_profile)
                print(f"✓ Создан профиль для ZloiMyxZzz (user_id: {zloi_user_id}, profile_id: {zloi_profile.id})")
        
        # 2. Создаем 10 других профилей
        mock_profiles_data = [
            {
                "user_id": 1000000001,
                "username": "alice_dev",
                "name": "Алиса Иванова",
                "gender": "female",
                "age": 20,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["IT", "Дизайн", "UI/UX"],
                "goals": ["Совместная учёба", "Проекты"],
                "bio": "Дизайнер интерфейсов, люблю создавать красивые продукты"
            },
            {
                "user_id": 1000000002,
                "username": "max_coder",
                "name": "Максим Петров",
                "gender": "male",
                "age": 23,
                "city": "Санкт-Петербург",
                "university": "СПбГУ",
                "interests": ["Программирование", "Backend", "Python"],
                "goals": ["Хакатон", "Проекты"],
                "bio": "Backend разработчик, специализируюсь на Python и FastAPI"
            },
            {
                "user_id": 1000000003,
                "username": "sophia_tech",
                "name": "София Смирнова",
                "gender": "female",
                "age": 21,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["Frontend", "React", "JavaScript"],
                "goals": ["Совместная учёба", "Хакатон"],
                "bio": "Frontend разработчик, увлекаюсь React и современными фреймворками"
            },
            {
                "user_id": 1000000004,
                "username": "dmitry_ai",
                "name": "Дмитрий Козлов",
                "gender": "male",
                "age": 24,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["AI", "Машинное обучение", "Python"],
                "goals": ["Проекты", "Хакатон"],
                "bio": "Исследую возможности машинного обучения и AI"
            },
            {
                "user_id": 1000000005,
                "username": "anna_design",
                "name": "Анна Волкова",
                "gender": "female",
                "age": 22,
                "city": "Санкт-Петербург",
                "university": "СПбГУ",
                "interests": ["Дизайн", "UI/UX", "Figma"],
                "goals": ["Совместная учёба", "Проекты"],
                "bio": "UI/UX дизайнер, создаю интуитивные интерфейсы"
            },
            {
                "user_id": 1000000006,
                "username": "ivan_mobile",
                "name": "Иван Соколов",
                "gender": "male",
                "age": 23,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["Mobile", "React Native", "iOS"],
                "goals": ["Хакатон", "Проекты"],
                "bio": "Мобильный разработчик, создаю приложения для iOS и Android"
            },
            {
                "user_id": 1000000007,
                "username": "maria_data",
                "name": "Мария Лебедева",
                "gender": "female",
                "age": 21,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["Data Science", "Python", "Аналитика"],
                "goals": ["Совместная учёба", "Проекты"],
                "bio": "Data Scientist, работаю с большими данными и аналитикой"
            },
            {
                "user_id": 1000000008,
                "username": "alex_cyber",
                "name": "Александр Новиков",
                "gender": "male",
                "age": 25,
                "city": "Санкт-Петербург",
                "university": "СПбГУ",
                "interests": ["Кибербезопасность", "Ethical Hacking", "Linux"],
                "goals": ["Хакатон", "Проекты"],
                "bio": "Специалист по кибербезопасности, изучаю защиту систем"
            },
            {
                "user_id": 1000000009,
                "username": "elena_web",
                "name": "Елена Морозова",
                "gender": "female",
                "age": 20,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["Web Development", "Vue.js", "TypeScript"],
                "goals": ["Совместная учёба", "Хакатон"],
                "bio": "Веб-разработчик, использую Vue.js и TypeScript для создания приложений"
            },
            {
                "user_id": 1000000010,
                "username": "pavel_blockchain",
                "name": "Павел Федоров",
                "gender": "male",
                "age": 24,
                "city": "Москва",
                "university": "МГУ",
                "interests": ["Blockchain", "Solidity", "Web3"],
                "goals": ["Проекты", "Хакатон"],
                "bio": "Blockchain разработчик, создаю смарт-контракты и децентрализованные приложения"
            }
        ]
        
        created_profiles = []
        for profile_data in mock_profiles_data:
            existing = db.query(Profile).filter(Profile.user_id == profile_data["user_id"]).first()
            if not existing:
                profile = Profile(
                    user_id=profile_data["user_id"],
                    username=profile_data["username"],
                    name=profile_data["name"],
                    gender=profile_data["gender"],
                    age=profile_data["age"],
                    city=profile_data["city"],
                    university=profile_data["university"],
                    interests=json.dumps(profile_data["interests"]),
                    goals=json.dumps(profile_data["goals"]),
                    bio=profile_data["bio"]
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
                created_profiles.append(profile)
                print(f"✓ Создан профиль: {profile_data['name']} (user_id: {profile_data['user_id']}, profile_id: {profile.id})")
            else:
                created_profiles.append(existing)
                print(f"✓ Профиль {profile_data['name']} уже существует (profile_id: {existing.id})")
        
        # 3. Создаем мэтчи между ZloiMyxZzz и 10 профилями
        # Для мэтча нужны взаимные лайки, поэтому создаем их
        zloi_profile_id = zloi_profile.id
        
        for other_profile in created_profiles:
            other_profile_id = other_profile.id
            other_user_id = other_profile.user_id
            
            # Проверяем, существует ли уже мэтч
            user1_id = min(zloi_user_id, other_user_id)
            user2_id = max(zloi_user_id, other_user_id)
            
            existing_match = db.query(Match).filter(
                Match.user1_id == user1_id,
                Match.user2_id == user2_id
            ).first()
            
            if not existing_match:
                # Создаем лайк от ZloiMyxZzz к другому профилю
                swipe1 = Swipe(
                    user_id=zloi_user_id,
                    target_profile_id=other_profile_id,
                    action="like"
                )
                db.add(swipe1)
                
                # Создаем лайк от другого профиля к ZloiMyxZzz
                swipe2 = Swipe(
                    user_id=other_user_id,
                    target_profile_id=zloi_profile_id,
                    action="like"
                )
                db.add(swipe2)
                
                # Создаем мэтч
                match = Match(
                    user1_id=user1_id,
                    user2_id=user2_id
                )
                db.add(match)
                db.commit()
                print(f"✓ Создан мэтч между ZloiMyxZzz и {other_profile.name}")
            else:
                print(f"✓ Мэтч между ZloiMyxZzz и {other_profile.name} уже существует")
        
        # 4. Создаем один входящий лайк (от одного из профилей к ZloiMyxZzz, но БЕЗ мэтча)
        # Используем профиль, который еще не лайкнул ZloiMyxZzz
        # Создадим дополнительный профиль для входящего лайка
        incoming_like_user_id = 1000000011
        incoming_profile = db.query(Profile).filter(Profile.user_id == incoming_like_user_id).first()
        
        if not incoming_profile:
            incoming_profile = Profile(
                user_id=incoming_like_user_id,
                username="incoming_liker",
                name="Екатерина Степанова",
                gender="female",
                age=21,
                city="Москва",
                university="МГУ",
                interests=json.dumps(["IT", "Frontend", "React"]),
                goals=json.dumps(["Совместная учёба", "Хакатон"]),
                bio="Frontend разработчик, ищу команду для проектов"
            )
            db.add(incoming_profile)
            db.commit()
            db.refresh(incoming_profile)
            print(f"✓ Создан профиль для входящего лайка: {incoming_profile.name} (profile_id: {incoming_profile.id})")
        
        # Проверяем, есть ли уже лайк от этого профиля
        existing_incoming_swipe = db.query(Swipe).filter(
            Swipe.user_id == incoming_like_user_id,
            Swipe.target_profile_id == zloi_profile_id
        ).first()
        
        if not existing_incoming_swipe:
            # Создаем входящий лайк (но НЕ создаем лайк от ZloiMyxZzz обратно, чтобы не было мэтча)
            incoming_swipe = Swipe(
                user_id=incoming_like_user_id,
                target_profile_id=zloi_profile_id,
                action="like"
            )
            db.add(incoming_swipe)
            db.commit()
            print(f"✓ Создан входящий лайк от {incoming_profile.name} к ZloiMyxZzz")
        else:
            print(f"✓ Входящий лайк от {incoming_profile.name} уже существует")
        
        print("\n✅ Все моковые данные успешно добавлены!")
        print(f"\nИтого:")
        print(f"- Профиль ZloiMyxZzz: user_id={zloi_user_id}, profile_id={zloi_profile.id}")
        print(f"- Создано/найдено профилей: {len(created_profiles) + 1}")
        print(f"- Мэтчей: 10")
        print(f"- Входящих лайков: 1")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_mock_data()

