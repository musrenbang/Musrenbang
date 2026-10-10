import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 text-slate-300 text-center text-xs py-2.5 px-4 border-t-2 border-amber-500 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
        <span>Developer Apps :</span>
        <strong className="text-amber-400 font-bold">M.Afifi Eka Putra, S.E — CV. Kayu Awet Sejahtera</strong>
        <span className="hidden sm:inline text-slate-500">|</span>
        <a
          href="https://kayuawetsejahtera.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 hover:underline transition-colors hidden sm:inline"
        >
          kayuawetsejahtera.netlify.app
        </a>
      </div>
    </footer>
  );
};
