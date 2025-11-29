/**
 * Определяет звание пользователя на основе количества коннектов (взаимных мэтчей)
 * @param {number} connectsCount - Количество взаимных мэтчей
 * @returns {string} - Звание пользователя
 */
export function getConnectTitle(connectsCount) {
  if (connectsCount >= 100) return 'Легенда коннектов';
  if (connectsCount >= 50) return 'Нетворк-архитектор';
  if (connectsCount >= 25) return 'Лидер комьюнити';
  if (connectsCount >= 15) return 'Центр компании';
  if (connectsCount >= 10) return 'Создатель круга';
  if (connectsCount >= 5) return 'Активный нетворкер';
  if (connectsCount >= 3) return 'Ловец знакомств';
  if (connectsCount >= 1) return 'Первый контакт';
  return 'Один в поле';
}

