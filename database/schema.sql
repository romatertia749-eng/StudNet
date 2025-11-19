-- Создание базы данных (выполнить от имени postgres)
-- CREATE DATABASE networking_app;

-- Подключиться к базе данных
-- \c networking_app;

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    age INTEGER NOT NULL CHECK (age >= 15 AND age <= 50),
    city VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
    interests TEXT, -- JSON массив: ["IT", "Дизайн", ...]
    goals TEXT, -- JSON массив: ["Совместная учёба", "Хакатон", ...]
    bio TEXT CHECK (LENGTH(bio) <= 200),
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для таблицы profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_university ON profiles(university);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_age ON profiles(age);

-- Таблица свайпов (лайки и дизлайки)
CREATE TABLE IF NOT EXISTS swipes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_profile_id BIGINT NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_profile_id),
    FOREIGN KEY (target_profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Индексы для таблицы swipes
CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_profile_id ON swipes(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes(action);
CREATE INDEX IF NOT EXISTS idx_swipes_created_at ON swipes(created_at);

-- Таблица мэтчей (взаимные лайки)
CREATE TABLE IF NOT EXISTS matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id BIGINT NOT NULL,
    user2_id BIGINT NOT NULL,
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id), -- Гарантируем порядок для уникальности
    FOREIGN KEY (user1_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- Индексы для таблицы matches
CREATE INDEX IF NOT EXISTS idx_matches_user1_id ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2_id ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Представление для статистики
CREATE OR REPLACE VIEW profile_stats AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    COUNT(DISTINCT s1.id) as likes_received,
    COUNT(DISTINCT s2.id) as likes_sent,
    COUNT(DISTINCT m.id) as matches_count
FROM profiles p
LEFT JOIN swipes s1 ON s1.target_profile_id = p.id AND s1.action = 'like'
LEFT JOIN swipes s2 ON s2.user_id = p.user_id AND s2.action = 'like'
LEFT JOIN matches m ON (m.user1_id = p.user_id OR m.user2_id = p.user_id)
GROUP BY p.id, p.user_id, p.name;

-- Комментарии к таблицам
COMMENT ON TABLE profiles IS 'Профили пользователей';
COMMENT ON TABLE swipes IS 'История свайпов (лайки и дизлайки)';
COMMENT ON TABLE matches IS 'Мэтчи между пользователями (взаимные лайки)';

COMMENT ON COLUMN profiles.interests IS 'JSON массив интересов: ["IT", "Дизайн"]';
COMMENT ON COLUMN profiles.goals IS 'JSON массив целей: ["Совместная учёба", "Хакатон"]';
COMMENT ON COLUMN profiles.photo_url IS 'URL фотографии профиля';
COMMENT ON COLUMN swipes.action IS 'Действие: like (лайк) или pass (пропуск)';
COMMENT ON COLUMN matches.user1_id IS 'ID первого пользователя (всегда меньше user2_id)';
COMMENT ON COLUMN matches.user2_id IS 'ID второго пользователя (всегда больше user1_id)';

