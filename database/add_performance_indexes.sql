-- Скрипт для добавления составных индексов для оптимизации производительности
-- Выполнить на существующей БД для ускорения запросов

-- Составные индексы для таблицы swipes
CREATE INDEX IF NOT EXISTS idx_swipes_user_target ON swipes(user_id, target_profile_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target_action ON swipes(target_profile_id, action) WHERE action = 'like';

-- Составной индекс для таблицы matches
CREATE INDEX IF NOT EXISTS idx_matches_user1_user2 ON matches(user1_id, user2_id);

-- Проверка индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('swipes', 'matches')
ORDER BY tablename, indexname;

