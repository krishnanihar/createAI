
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon } from './icons/XIcon';
import { Spinner } from './icons/Spinner';
import type { ImageFile } from '../types';
import { dataUrlToImageFile } from '../utils/fileUtils';

type EditService = (prompt: string, image: ImageFile, mask: ImageFile) => Promise<string>;

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (index: number, newImageBase64: string) => Promise<void>;
  image: { index: number; src: string } | null;
  editService: EditService;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, onApply, image, editService }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDrawing = useRef(false);
  
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(40);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setPrompt('');
      setError(null);
      clearCanvas();
    }
  }, [isOpen, clearCanvas]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const imageEl = imageRef.current;
    if (canvas && imageEl) {
      canvas.width = imageEl.clientWidth;
      canvas.height = imageEl.clientHeight;
    }
  }, []);

  // Handle window resizing to keep canvas and image dimensions in sync
  useEffect(() => {
    if (!isOpen) return;
    
    // The 'onLoad' on the image handles the initial sizing.
    // This effect handles resizing of the browser window.
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen, resizeCanvas]);
  
  const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    
    // The canvas element is styled to fill its container (rect.width, rect.height).
    // The actual drawing surface (canvas.width, canvas.height) is set to match the displayed image size.
    // The image is centered within the container. We must calculate the offset (letterboxing)
    // to translate mouse coordinates from the element's top-left to the drawing surface's top-left.
    const offsetX = (rect.width - canvas.width) / 2;
    const offsetY = (rect.height - canvas.height) / 2;

    return {
      x: evt.clientX - rect.left - offsetX,
      y: evt.clientY - rect.top - offsetY,
    };
  };
  
  const startDrawing = (e: React.MouseEvent) => {
    isDrawing.current = true;
    draw(e);
  };
  
  const stopDrawing = () => {
    isDrawing.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
  };
  
  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getMousePos(canvas, e);
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleApply = async () => {
    if (!prompt || !image || !canvasRef.current) {
        setError("Please provide a prompt and ensure an image is selected.");
        return;
    }
    
    setIsEditing(true);
    setError(null);
    
    try {
        const maskCanvas = document.createElement('canvas');
        const originalImage = imageRef.current;
        if (!originalImage) throw new Error("Original image element not found");

        maskCanvas.width = originalImage.naturalWidth;
        maskCanvas.height = originalImage.naturalHeight;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error("Could not create mask context");

        maskCtx.drawImage(canvasRef.current, 0, 0, originalImage.naturalWidth, originalImage.naturalHeight);
        
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        const maskFile = dataUrlToImageFile(maskDataUrl, 'mask.png');
        const imageFile = dataUrlToImageFile(image.src, 'source.jpeg');

        const resultBase64 = await editService(prompt, imageFile, maskFile);
        await onApply(image.index, resultBase64);
        
    } catch (err) {
        console.error("Failed to apply edit:", err);
        setError("Failed to edit the image. Please try again.");
    } finally {
        setIsEditing(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-modal-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="editor-modal-title" className="text-xl font-bold text-slate-100">Edit Image</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 relative w-full h-full min-h-[400px] bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
                {image && (
                    <>
                        <img 
                            ref={imageRef}
                            src={image.src} 
                            alt="Image to edit" 
                            className="max-w-full max-h-full object-contain"
                            onLoad={resizeCanvas}
                        />
                        <canvas 
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseUp={stopDrawing}
                            onMouseOut={stopDrawing}
                            onMouseMove={draw}
                        />
                    </>
                )}
                 {isEditing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg">
                        <Spinner className="w-10 h-10 mb-4 text-white" />
                        <p className="font-semibold text-white">Applying your edits...</p>
                    </div>
                )}
            </div>

            <aside className="flex flex-col gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">1. Mask Area to Change</h3>
                    <p className="text-sm text-slate-400 mb-4">Draw over the part of the image you want to modify.</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <label htmlFor="brush-size" className="text-sm font-medium text-slate-400">Brush Size</label>
                            <input 
                                id="brush-size"
                                type="range"
                                min="5"
                                max="100"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#B61032]"
                            />
                        </div>
                        <button
                            onClick={clearCanvas}
                            className="w-full px-4 py-2 text-sm bg-slate-700 text-slate-200 font-semibold rounded-md border border-slate-600 hover:bg-slate-600 transition-colors"
                        >
                            Clear Mask
                        </button>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-2">2. Describe Your Edit</h3>
                     <textarea
                        id="edit-prompt"
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032] transition"
                        placeholder="e.g., Add a golden crown, change the sky to a sunset"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                 {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </aside>
        </main>
        
        <footer className="flex justify-end items-center gap-4 p-4 border-t border-slate-700 bg-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors"
            disabled={isEditing}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            disabled={isEditing || !prompt}
          >
            {isEditing ? <Spinner /> : 'Apply Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ImageEditorModal;