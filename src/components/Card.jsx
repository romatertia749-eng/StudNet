const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

