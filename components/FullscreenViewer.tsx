
import React, { useEffect } from 'react';
import type { GenerationModel } from '../types';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface FullscreenViewerProps {
  images: string[];
  currentIndex: number;
  isAsset: boolean;
  model?: GenerationModel;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  onEdit: (src: string) => void;
  onAddToAssets: (src: string) => void;
  isAddedToAssets: Set<string>;
}

const ActionButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}> = ({ onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-3 w-full text-left p-3 rounded-md text-slate-200 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
    aria-label={label}
  >
    {icon}
    <span className="font-semibold">{label}</span>
  </button>
);

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({ 
    images,
    currentIndex,
    isAsset,
    model,
    onClose, 
    onNavigate,
    onEdit,
    onAddToAssets,
    isAddedToAssets,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        onNavigate('next');
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, onClose]);

  const currentSrc = images[currentIndex];
  if (!currentSrc) return null;

  const isAdded = isAddedToAssets.has(currentSrc);
  const supportsEditing = model === 'gemini-2.5-flash-image';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image view"
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors z-20" 
        aria-label="Close fullscreen view"
      >
        <XIcon className="w-8 h-8" />
      </button>
      
      <div className="flex w-full h-full items-center justify-center p-8 flex-grow">
        <div className="flex-grow flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
            <img 
                src={currentSrc} 
                alt="Fullscreen view" 
                className="max-w-full max-h-full object-contain" 
            />
        </div>
        <aside className="w-64 h-full flex-shrink-0 flex flex-col justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/10 rounded-lg p-2 space-y-1">
                {supportsEditing && onEdit && (
                    <ActionButton 
                        onClick={() => { onEdit(currentSrc); onClose(); }} 
                        icon={<PencilIcon className="w-5 h-5" />}
                        label="Edit Image"
                    />
                )}
                {!isAsset && onAddToAssets && (
                    <ActionButton 
                        onClick={() => onAddToAssets(currentSrc)} 
                        icon={isAdded ? <PlusCircleIcon className="w-5 h-5 text-[#DAB88B]" /> : <PlusIcon className="w-5 h-5" />}
                        label={isAdded ? "Added to Assets" : "Add to Style Assets"}
                        disabled={isAdded}
                    />
                )}
            </div>
        </aside>
      </div>

      {images.length > 1 && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className="p-3 bg-black/30 rounded-full text-white backdrop-blur-sm hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <p className="text-white font-mono text-lg tabular-nums">
            {currentIndex + 1} / {images.length}
          </p>

          <button
            onClick={() => onNavigate('next')}
            disabled={currentIndex === images.length - 1}
            className="p-3 bg-black/30 rounded-full text-white backdrop-blur-sm hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FullscreenViewer;
