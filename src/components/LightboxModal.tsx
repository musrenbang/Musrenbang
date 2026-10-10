import React from 'react';
import { X } from 'lucide-react';

interface Props {
  src: string | null;
  onClose: () => void;
}

export const LightboxModal: React.FC<Props> = ({ src, onClose }) => {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
        <img src={src} alt="Foto Pratinjau Layar Penuh" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
      </div>
    </div>
  );
};
