const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'w-full min-h-[48px] px-5 py-3 rounded-xl font-medium text-base transition-all duration-200 active:scale-[0.97] active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation select-none';
  
  const variantClasses = {
    primary: 'backdrop-blur-xl text-gray-900 border-2 font-medium',
    secondary: 'bg-gradient-to-r from-cyan-400/30 to-blue-400/30 backdrop-blur-xl text-gray-900 border-2 border-cyan-300/50 shadow-lg shadow-cyan-500/30 hover:from-cyan-400/40 hover:to-blue-400/40 hover:border-cyan-400/70 hover:shadow-xl hover:shadow-cyan-500/40 active:from-cyan-500/50 active:to-blue-500/50 font-medium',
    danger: 'bg-gradient-to-r from-red-400/30 to-orange-400/30 backdrop-blur-xl text-red-800 border-2 border-red-300/50 shadow-lg shadow-red-500/30 hover:from-red-400/40 hover:to-orange-400/40 hover:border-red-400/70 hover:shadow-xl hover:shadow-red-500/40 active:from-red-500/50 active:to-orange-500/50 font-medium',
    outline: 'bg-white/25 backdrop-blur-xl text-gray-800 border-2 border-white/40 hover:bg-white/35 hover:border-white/50 active:bg-white/40 shadow-md font-medium',
  };

  // Стили для primary кнопки с голубым неоном
  const primaryStyle = variant === 'primary' ? {
    background: `linear-gradient(to right, rgba(0, 255, 255, 0.26), rgba(54, 207, 255, 0.32))`,
    borderColor: 'rgba(0, 255, 255, 0.5)',
    boxShadow: '0 10px 25px rgba(0, 255, 255, 0.3), 0 0 20px rgba(54, 207, 255, 0.2)',
  } : {};

  const primaryHoverStyle = variant === 'primary' ? {
    background: `linear-gradient(to right, rgba(0, 255, 255, 0.35), rgba(54, 207, 255, 0.42))`,
    borderColor: 'rgba(0, 255, 255, 0.7)',
    boxShadow: '0 15px 35px rgba(0, 255, 255, 0.4), 0 0 30px rgba(54, 207, 255, 0.3)',
  } : {};

  const primaryActiveStyle = variant === 'primary' ? {
    background: `linear-gradient(to right, rgba(0, 255, 255, 0.45), rgba(54, 207, 255, 0.52))`,
    borderColor: 'rgba(0, 255, 255, 0.8)',
  } : {};

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={primaryStyle}
      onMouseEnter={(e) => {
        if (variant === 'primary' && !disabled) {
          Object.assign(e.target.style, primaryHoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary' && !disabled) {
          Object.assign(e.target.style, primaryStyle);
        }
      }}
      onMouseDown={(e) => {
        if (variant === 'primary' && !disabled) {
          Object.assign(e.target.style, primaryActiveStyle);
        }
      }}
      onMouseUp={(e) => {
        if (variant === 'primary' && !disabled) {
          Object.assign(e.target.style, primaryHoverStyle);
        }
      }}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

