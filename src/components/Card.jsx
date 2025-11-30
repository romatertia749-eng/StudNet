const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 ${className}`}
      style={{
        // Оптимизация: включаем GPU ускорение для карточек, которые могут прокручиваться
        willChange: 'auto',
        // Оптимизация: используем transform для лучшей производительности
        transform: 'translateZ(0)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

