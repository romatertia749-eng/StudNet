import { motion, AnimatePresence } from 'framer-motion';
import { useMatches } from '../contexts/MatchContext';
import { getConnectTitle } from '../utils/connectTitles';

const HeaderConnectsBadge = () => {
  const { connectsCount } = useMatches();
  const title = getConnectTitle(connectsCount);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={connectsCount}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
      >
        <span className="font-semibold text-gray-800 whitespace-nowrap">
          Коннекты: {connectsCount}
        </span>
        <span className="opacity-70 text-gray-700">·</span>
        <span className="opacity-80 text-gray-700 whitespace-nowrap">
          {title}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default HeaderConnectsBadge;

