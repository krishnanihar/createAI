
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageFile } from '../types';
import { toBase64 } from '../utils/fileUtils';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';

interface CompositionReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (reference: { image: ImageFile | null; view: string | null }) => void;
  initialImage: ImageFile | null;
  initialView: string | null;
}

const COMPOSITION_VIEWS = [
    'Isometric', 'Top-down view', 'First-person view', 'Low-angle shot', 
    'High-angle shot', 'Wide-angle shot', 'Dutch angle', 'Portrait', 'Landscape'
];

const CompositionReferenceModal: React.FC<CompositionReferenceModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialImage,
  initialView
}) => {
  const [image, setImage] = useState<ImageFile | null>(initialImage);
  const [view, setView] = useState<string | null>(initialView);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImage(initialImage);
    setView(initialView);
  }, [initialImage, initialView, isOpen]);

  const processFile = async (file: File) => {
    if (!file) return;
    try {
      const b64 = await toBase64(file);
      const newImageFile: ImageFile = {
        name: file.name || `composition_ref_${Date.now()}.png`,
        base64: b64.split(',')[1],
        type: file.type,
      };
      setImage(newImageFile);
      setView(null); // Deselect view when image is chosen
    } catch (err) {
      console.error("Error processing file for composition reference", err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (!event.clipboardData?.items) return;
    
    const imageFile = Array.from(event.clipboardData.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .find((file): file is File => file !== null);
    
    if (imageFile) {
      event.preventDefault();
      await processFile(imageFile);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('paste', handlePaste);
    }
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, handlePaste]);

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handleSelectView = (selectedView: string) => {
    setView(selectedView);
    setImage(null); // Deselect image when view is chosen
  }
  
  const handleApply = () => {
    onApply({ image, view });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="composition-ref-modal-title"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="composition-ref-modal-title" className="text-xl font-bold text-slate-100">Composition Reference</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Use an Image</h3>
            <p className="text-sm text-slate-400 mb-3">Upload an image to guide the composition, layout, and subject placement.</p>
            {image ? (
                <div className="mt-4 relative w-24 h-24 group flex-shrink-0">
                    <img
                        src={`data:${image.type};base64,${image.base64}`}
                        alt={image.name}
                        className="w-full h-full object-cover rounded-md"
                    />
                    <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-black bg-opacity-60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
                        aria-label={`Remove ${image.name}`}
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div 
                    className="relative border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#B61032] hover:bg-slate-700 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    />
                    <UploadIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Click to upload, drag & drop, or paste</p>
                </div>
            )}
          </div>
          
          <div className="relative flex items-center my-4">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold">OR</span>
              <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Use a Preset View</h3>
            <p className="text-sm text-slate-400 mb-3">Select a common camera view to guide the composition.</p>
            <div className="flex flex-wrap gap-2">
                {COMPOSITION_VIEWS.map(v => (
                    <button
                        key={v}
                        onClick={() => handleSelectView(v)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                            view === v 
                            ? 'bg-[#B61032] text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
          </div>
        </main>
        <footer className="flex justify-end items-center gap-4 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors"
          >
            Apply
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CompositionReferenceModal;