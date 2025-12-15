import React from 'react';
import { ZoomIn } from 'lucide-react';

interface ClickableImageProps {
  src: string;
  alt: string;
  onClick: () => void;
  className?: string;
}

export const ClickableImage: React.FC<ClickableImageProps> = ({
  src,
  alt,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`relative group cursor-pointer overflow-hidden rounded-xl ${className}`}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-slate-800/90 rounded-full p-3 shadow-xl">
          <ZoomIn className="h-6 w-6 text-primary" />
        </div>
      </div>
      {/* Subtle indicator */}
      <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-0 transition-opacity">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <ZoomIn className="h-3 w-3 text-white" />
          <span className="text-xs text-white">Clique para ampliar</span>
        </div>
      </div>
    </div>
  );
};
