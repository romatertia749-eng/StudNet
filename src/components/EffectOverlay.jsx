import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * EffectOverlay - компонент для отображения анимационных эффектов при свайпе карточек
 * 
 * @param {Object} props
 * @param {"left" | "right"} props.direction - направление свайпа (left = pass, right = like)
 * @param {Function} props.onComplete - коллбэк, вызываемый после завершения эффекта
 * 
 * Архитектура:
 * - Для "right" (лайк): неоновый светящийся хвост (glow trail) через SVG path с градиентом
 * - Для "left" (пасс): fade/disperse эффект нейтральных частиц через Framer Motion
 * - Эффект отображается поверх карточки (z-index: 50)
 * - После завершения вызывается onComplete для показа следующей карточки
 * 
 * БЛОКИРОВКА СВАЙПА:
 * - Во время проигрывания эффекта (400-700ms) свайпы заблокированы через isEffectActive
 * - onComplete разблокирует свайп и инициирует появление новой карточки с glow-анимацией
 */
const EffectOverlay = ({ direction, onComplete }) => {
  // Используем state для particles, чтобы компоненты перерендерились
  const [particles, setParticles] = useState([]);
  const [trailVisible, setTrailVisible] = useState(false);

  useEffect(() => {
    // Длительность эффекта в миллисекундах
    // Неоновый хвост: 500ms (400-500ms fade out + небольшая задержка)
    // Fade/disperse: 600ms
    const EFFECT_DURATION = direction === 'right' ? 500 : 600;

    if (direction === 'right') {
      // НЕОНОВЫЙ СВЕТЯЩИЙСЯ ХВОСТ для свайпа вправо (лайк)
      // Реализация через SVG path с градиентом и blur эффектом
      // Хвост следует за траекторией уходящей карточки (вправо)
      
      setTrailVisible(true);
      
      // Хвост затухает за 400-500ms
      // После этого вызываем onComplete для показа новой карточки
      
    } else {
      /**
       * ЭФФЕКТ РАСПАДА КАРТОЧКИ НА ЧАСТИЦЫ для свайпа влево (пасс)
       * 
       * РЕАЛИЗАЦИЯ:
       * - Создаем множество частиц, которые визуально "вылетают" из карточки
       * - Частицы появляются из разных точек карточки (центр, края, углы)
       * - Разлетаются в разные стороны с разной скоростью и задержкой
       * - Создается эффект, будто карточка распадается на части
       * 
       * ВИЗУАЛЬНЫЙ ЭФФЕКТ:
       * - Больше частиц (60-80) для более насыщенного эффекта
       * - Разные размеры частиц (от 3 до 15px) для реалистичности
       * - Частицы разлетаются преимущественно влево и вниз (направление свайпа)
       * - Разные цвета для глубины эффекта
       */
      
      const particleCount = 70; // Больше частиц для более живописного эффекта
      const colors = ['#A3B8CC', '#E2E6EA', '#CCD8E8', '#B8C8D8', '#D4E0ED'];
      
      // Генерируем частицы, которые появляются из разных точек карточки
      const generatedParticles = Array.from({ length: particleCount }, (_, i) => {
        // Позиция частицы относительно карточки (центр экрана)
        // Частицы появляются из разных зон карточки
        const zone = Math.random();
        let startX, startY;
        
        if (zone < 0.3) {
          // Центр карточки
          startX = 50 + (Math.random() - 0.5) * 20;
          startY = 50 + (Math.random() - 0.5) * 20;
        } else if (zone < 0.6) {
          // Края карточки
          const edge = Math.random();
          if (edge < 0.25) {
            startX = 30 + Math.random() * 40; // Верхний край
            startY = 30;
          } else if (edge < 0.5) {
            startX = 30 + Math.random() * 40; // Нижний край
            startY = 70;
          } else if (edge < 0.75) {
            startX = 30; // Левый край
            startY = 30 + Math.random() * 40;
          } else {
            startX = 70; // Правый край
            startY = 30 + Math.random() * 40;
          }
        } else {
          // Углы карточки
          const corner = Math.floor(Math.random() * 4);
          if (corner === 0) {
            startX = 30; startY = 30; // Верхний левый
          } else if (corner === 1) {
            startX = 70; startY = 30; // Верхний правый
          } else if (corner === 2) {
            startX = 30; startY = 70; // Нижний левый
          } else {
            startX = 70; startY = 70; // Нижний правый
          }
        }
        
        // Направление разлета - преимущественно влево и вниз (направление свайпа)
        // Угол от 180° до 270° (влево-вниз) с небольшим разбросом
        const baseAngle = Math.PI + Math.PI / 4; // 225° (влево-вниз)
        const angleVariation = (Math.random() - 0.5) * Math.PI / 2; // ±45°
        const angle = baseAngle + angleVariation;
        
        // Дистанция разлета - разные частицы летят на разное расстояние
        const distance = Math.random() * 200 + 150; // От 150 до 350px
        
        // Размер частицы - разные размеры для реалистичности
        const size = Math.random() * 12 + 3; // От 3 до 15px
        
        return {
          id: i,
          x: startX,
          y: startY,
          size: size,
          color: colors[Math.floor(Math.random() * colors.length)],
          angle: angle,
          distance: distance,
          delay: Math.random() * 150, // Задержка от 0 до 150ms для каскадного эффекта
          rotation: Math.random() * 360, // Вращение частицы при разлете
        };
      });
      
      // Устанавливаем частицы в state для рендера
      setParticles(generatedParticles);
    }

    // Вызываем onComplete после завершения эффекта
    // Это разблокирует свайп и покажет следующую карточку
    const timer = setTimeout(() => {
      onComplete();
    }, EFFECT_DURATION);

    return () => {
      clearTimeout(timer);
      setTrailVisible(false);
    };
  }, [direction, onComplete]);

  if (direction === 'right') {
    /**
     * НЕОНОВЫЙ СВЕТЯЩИЙСЯ ХВОСТ для свайпа вправо (лайк)
     * 
     * РЕАЛИЗАЦИЯ:
     * - SVG path с градиентом от яркого неона (#00FFFF, #36CFFF) к прозрачному
     * - Траектория: из центра экрана вправо с плавной кривой
     * - Blur эффект (feGaussianBlur) создает свечение (glow)
     * - Многослойная структура: основной хвост + яркий слой + белый центр
     * - Анимация: pathLength от 0 до 1 (появление хвоста) + fade out (затухание)
     * 
     * СИНХРОНИЗАЦИЯ:
     * - Хвост появляется сразу при свайпе (trailVisible = true)
     * - Затухает за 400-500ms
     * - После завершения вызывается onComplete для показа новой карточки с glow
     */
    
    // Вычисляем размеры экрана для правильного позиционирования
    // Используем относительные единицы для адаптивности
    const viewBoxWidth = 400;
    const viewBoxHeight = 600;
    const startX = viewBoxWidth * 0.5; // Начало в центре по X
    const startY = viewBoxHeight * 0.5; // Начало в центре по Y
    const endX = viewBoxWidth * 1.3; // Конец справа за экраном
    const endY = startY; // Горизонтальная траектория
    
    // Создаем плавную кривую (bezier) для более естественного хвоста
    // Небольшой изгиб делает хвост более динамичным
    const controlX1 = startX + (endX - startX) * 0.25;
    const controlY1 = startY - 20; // Небольшой изгиб вверх
    const controlX2 = startX + (endX - startX) * 0.75;
    const controlY2 = startY + 20; // Небольшой изгиб вниз
    
    // SVG path для хвоста (кубическая кривая Безье)
    const trailPath = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        style={{ zIndex: 50 }}
      >
        {trailVisible && (
          <motion.svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Определение градиента и фильтров для неонового хвоста */}
            <defs>
              {/* Линейный градиент от яркого неона к прозрачному */}
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#36CFFF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#00FFFF" stopOpacity="0.7" />
                <stop offset="75%" stopColor="#36CFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
              </linearGradient>
              
              {/* Фильтр blur для создания glow эффекта (основной слой) */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Дополнительный фильтр для более яркого свечения (внешний слой) */}
              <filter id="strongGlow">
                <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Внешний слой хвоста - самое яркое свечение */}
            <motion.path
              d={trailPath}
              stroke="url(#neonGradient)"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              filter="url(#strongGlow)"
              initial={{ pathLength: 0, opacity: 0.6 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ 
                pathLength: { duration: 0.25, ease: 'easeOut' },
                opacity: { duration: 0.5, delay: 0.15, ease: 'easeOut' }
              }}
            />
            
            {/* Основной хвост - толстая линия с градиентом */}
            <motion.path
              d={trailPath}
              stroke="url(#neonGradient)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ 
                pathLength: { duration: 0.3, ease: 'easeOut' },
                opacity: { duration: 0.5, delay: 0.2, ease: 'easeOut' }
              }}
            />
            
            {/* Белый центр для максимальной яркости и четкости */}
            <motion.path
              d={trailPath}
              stroke="#FFFFFF"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ 
                pathLength: { duration: 0.3, ease: 'easeOut' },
                opacity: { duration: 0.4, delay: 0.1, ease: 'easeOut' }
              }}
            />
          </motion.svg>
        )}
      </div>
    );
  }

  /**
   * ЭФФЕКТ РАСПАДА КАРТОЧКИ НА ЧАСТИЦЫ для левого свайпа
   * 
   * ВИЗУАЛЬНАЯ РЕАЛИЗАЦИЯ:
   * - Частицы появляются из разных точек карточки (центр, края, углы)
   * - Разлетаются влево и вниз с разной скоростью
   * - Вращаются при полете для более живого эффекта
   * - Разные размеры и цвета создают глубину
   * - Каскадный эффект - частицы появляются с небольшой задержкой
   */
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ zIndex: 50 }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            // Добавляем тень для глубины
            boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2)`,
          }}
          initial={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotate: 0,
          }}
          animate={{
            opacity: 0,
            scale: 0.3, // Частицы уменьшаются при разлете
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            rotate: particle.rotation + 360, // Вращение при полете
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.4, // Длительность от 0.8 до 1.2 секунды
            delay: particle.delay / 1000, // Каскадный эффект
            ease: [0.25, 0.46, 0.45, 0.94], // Плавное ускорение и замедление
          }}
        />
      ))}
    </div>
  );
};

export default EffectOverlay;

