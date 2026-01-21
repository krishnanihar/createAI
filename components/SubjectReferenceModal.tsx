
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ImageFile } from '../types';
import { toBase64 } from '../utils/fileUtils';
import { XIcon } from './icons/XIcon';
import { UploadIcon } from './icons/UploadIcon';

interface SubjectReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (images: ImageFile[]) => void;
  initialImages: ImageFile[];
}

const SubjectReferenceModal: React.FC<SubjectReferenceModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialImages,
}) => {
  const [images, setImages] = useState<ImageFile[]>(initialImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages, isOpen]);

  const processFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    try {
      const filePromises = files.map(file => toBase64(file).then(b64 => ({ file, b64 })));
      const results = await Promise.all(filePromises);
      
      const newImageFiles = results.map(({ file, b64 }) => ({
        name: file.name || `pasted_image_${Date.now()}.png`,
        base64: b64.split(',')[1],
        type: file.type,
      }));
      
      setImages(prev => [...prev, ...newImageFiles]);
    } catch (err) {
      console.error("Error processing files for subject reference", err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(Array.from(event.target.files));
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFiles(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (!event.clipboardData?.items) return;
    
    const imageFiles = Array.from(event.clipboardData.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);
    
    if (imageFiles.length > 0) {
      event.preventDefault();
      await processFiles(imageFiles);
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

  const handleRemove = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleApply = () => {
    onApply(images);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-ref-modal-title"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="subject-ref-modal-title" className="text-xl font-bold text-slate-100">Subject Reference</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto space-y-6">
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
              multiple
              onChange={handleFileChange}
            />
            <UploadIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-300">Click to upload, drag & drop, or paste</p>
            <p className="text-xs text-slate-500">Add one or more images to define the subject</p>
          </div>

          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative w-24 h-24 group flex-shrink-0">
                  <img
                    src={`data:${image.type};base64,${image.base64}`}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute -top-2 -right-2 p-1 bg-black bg-opacity-60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
                    aria-label={`Remove ${image.name}`}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SubjectReferenceModal;