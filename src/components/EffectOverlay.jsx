import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

/**
 * EffectOverlay - компонент для отображения анимационных эффектов при свайпе карточек
 * 
 * @param {Object} props
 * @param {"left" | "right"} props.direction - направление свайпа (left = pass, right = like)
 * @param {Function} props.onComplete - коллбэк, вызываемый после завершения эффекта
 * 
 * Архитектура:
 * - Для "right" (лайк): конфетти-салют через canvas-confetti
 * - Для "left" (пасс): fade/disperse эффект нейтральных частиц через SVG и Framer Motion
 * - Эффект отображается поверх карточки (z-index: 50)
 * - После завершения вызывается onComplete для показа следующей карточки
 */
const EffectOverlay = ({ direction, onComplete }) => {
  // Используем state для particles, чтобы компоненты перерендерились
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Длительность эффекта в миллисекундах
    const EFFECT_DURATION = direction === 'right' ? 2000 : 1500;

    if (direction === 'right') {
      // КОНФЕТТИ-САЛЮТ для свайпа вправо (лайк)
      // Используем canvas-confetti для создания праздничного эффекта
      
      const count = 200; // Количество конфетти
      const defaults = {
        origin: { y: 0.7 }, // Позиция запуска (70% от верха экрана)
        colors: ['#4FBB6E', '#3D9DEB', '#F7E001', '#CE6AE8', '#FFB6C1', '#FFD700', '#87CEEB'],
        shapes: ['circle', 'square'],
        ticks: 200,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
      };

      // Запускаем несколько залпов конфетти для более насыщенного эффекта
      const interval = setInterval(() => {
        confetti({
          ...defaults,
          particleCount: count,
          angle: 60,
          spread: 55,
          startVelocity: 25,
        });
        
        confetti({
          ...defaults,
          particleCount: count,
          angle: 120,
          spread: 55,
          startVelocity: 25,
        });
      }, 250);

      // Останавливаем через 1.5 секунды
      setTimeout(() => {
        clearInterval(interval);
      }, 1500);

    } else {
      // FADE/DISPERSE ЭФФЕКТ для свайпа влево (пасс)
      // Создаем нейтральные частицы, которые разлетаются и исчезают
      
      const particleCount = 30;
      const colors = ['#A3B8CC', '#E2E6EA', '#CCD8E8'];
      
      // Генерируем частицы со случайными параметрами
      const generatedParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Процент от ширины
        y: Math.random() * 100, // Процент от высоты
        size: Math.random() * 8 + 4, // Размер от 4 до 12px
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2, // Направление разлета
        distance: Math.random() * 150 + 100, // Дистанция разлета
        delay: Math.random() * 200, // Задержка начала анимации
      }));
      
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
      // Очищаем конфетти при размонтировании
      if (direction === 'right') {
        confetti.reset();
      }
    };
  }, [direction, onComplete]);

  if (direction === 'right') {
    // Для конфетти используем canvas-confetti (он сам создает canvas)
    // Просто возвращаем пустой div для позиционирования
    return (
      <div 
        className="fixed inset-0 pointer-events-none z-50"
        style={{ zIndex: 50 }}
      />
    );
  }

  // FADE/DISPERSE эффект для левого свайпа
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
          }}
          initial={{
            opacity: 0.8,
            scale: 1,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: 0,
            scale: 0,
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
          }}
          transition={{
            duration: 1.2,
            delay: particle.delay / 1000,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

export default EffectOverlay;

