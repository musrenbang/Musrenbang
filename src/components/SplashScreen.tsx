import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onDismiss }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDismiss, 600);
    }, 2400);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
    setShow(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handleDismiss}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white p-6 cursor-pointer select-none"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="relative mb-5 p-3 bg-white rounded-3xl shadow-2xl shadow-blue-900/40">
              <img
                src="/img/logo.png"
                alt="Logo Musrenbang 2027"
                className="w-28 h-28 object-contain"
                onError={(e) => {
                  // Fallback if image load fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white drop-shadow-md">
              MUSRENBANG APPS 2027
            </h1>
            <p className="mt-2 text-sm text-blue-100 font-medium leading-relaxed">
              Survey Musyawarah Perencanaan Pembangunan<br />
              Provinsi Sumatera Selatan
            </p>

            <span className="mt-4 px-4 py-1 text-xs font-bold tracking-widest text-white bg-white/20 border border-white/40 rounded-full backdrop-blur-sm">
              Vers.1.1.2
            </span>

            {/* Animated Loading Bar */}
            <div className="w-48 h-1.5 bg-white/25 rounded-full mt-6 overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="w-20 h-full bg-white rounded-full"
              />
            </div>
          </motion.div>

          <div className="absolute bottom-6 left-0 right-0 text-center px-4 text-xs text-blue-200">
            Developer Apps :{' '}
            <strong className="text-white font-semibold">
              M.Afifi Eka Putra, S.E — CV. Kayu Awet Sejahtera
            </strong>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
