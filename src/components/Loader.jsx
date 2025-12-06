const Loader = ({ message = "Загрузка..." }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-lg font-medium mb-2">{message}</div>
        <div className="text-white/70 text-sm">Пожалуйста, подождите...</div>
      </div>
    </div>
  );
};

export default Loader;

