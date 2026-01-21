
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { ImageFile, GenerationModel, GenerationSession } from '../types';
import { ImageIcon } from './icons/ImageIcon';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './icons/Spinner';
import { PencilIcon } from './icons/PencilIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { XIcon } from './icons/XIcon';
import { FilterIcon } from './icons/FilterIcon';

const ExpandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 14H4v6h6v-3" />
    <path d="M10 4H4v6h3" />
    <path d="M17 10h3V4h-6v3" />
    <path d="M14 17h6v-6h-3" />
  </svg>
);

const RotateCcwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
);

const InfoIcon: React.FC<{ tooltip: string } & React.SVGProps<SVGSVGElement>> = ({ tooltip, ...props }) => (
    <div className="relative group">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
        {tooltip}
      </div>
    </div>
);

const SkeletonLoader: React.FC = () => (
    <div className="w-full aspect-[1/1] bg-slate-600 rounded-lg animate-pulse"></div>
);

interface GenerationAccordionItemProps {
    session: GenerationSession;
    isCurrent: boolean;
    isGenerating: boolean;
    generatingCount: number;
    defaultOpen?: boolean;
    onOpenFullscreen: (index: number) => void;
    onEditImage: (src: string) => void;
    onAddToAssets: (src: string) => void;
    onRestoreSession: (session: GenerationSession) => void;
    addedToAssets: Set<string>;
}

const GenerationAccordionItem: React.FC<GenerationAccordionItemProps> = ({
    session,
    isCurrent,
    isGenerating,
    generatingCount,
    defaultOpen = false,
    onOpenFullscreen,
    onEditImage,
    onAddToAssets,
    onRestoreSession,
    addedToAssets,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [gridColumns, setGridColumns] = useState(3);
    const isFlashModel = session.model === 'gemini-2.5-flash-image';
    const images = session.images;

    useEffect(() => {
      setIsOpen(defaultOpen);
    }, [defaultOpen]);
  
    useEffect(() => {
      const numImages = images.length + (isGenerating ? generatingCount : 0);
      if (numImages <= 0) {
        setGridColumns(3); // Reset for empty state
        return;
      }
      const idealCols = Math.min(3, numImages);
      const maxCols = Math.min(4, numImages);

      if (gridColumns > maxCols) {
        setGridColumns(maxCols); // Cap it if it's too high.
      } else if (gridColumns < idealCols) {
        setGridColumns(idealCols); // Increase it if it's too low to meet the default.
      }
    }, [images, isGenerating, generatingCount, gridColumns]);
  
    const gridClasses: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };
  
    const hasImages = images.length > 0;
  
    return (
      <div className="bg-slate-700 rounded-lg border border-slate-600">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 font-medium text-sm text-slate-200 flex items-center justify-between hover:bg-slate-600 transition-colors text-left"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 overflow-hidden pr-4">
              <span className="truncate">{isCurrent ? "Current Generation" : session.prompt}</span>
              {!isCurrent && <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
          </div>
          <ChevronDownIcon
            className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isOpen && (
          <div className="p-3 border-t border-slate-600 relative">
            {hasImages && (
              <div className="flex items-center justify-between mb-3">
                  <div className="bg-slate-800/80 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-3 text-sm shadow-sm border border-slate-600">
                    <label htmlFor={`grid-slider-${session.id}`} className="font-medium text-slate-300">View</label>
                    <input
                    id={`grid-slider-${session.id}`}
                    type="range"
                    min="1"
                    max={Math.min(4, images.length)}
                    step="1"
                    value={gridColumns}
                    onChange={(e) => setGridColumns(Number(e.target.value))}
                    className="w-24 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#B61032]"
                    aria-label="Adjust grid columns"
                    />
                    <span className="text-slate-300 font-semibold w-4 text-center" aria-live="polite">{gridColumns}</span>
                </div>
                {!isCurrent && (
                     <button 
                        onClick={() => onRestoreSession(session)}
                        className="text-xs font-semibold text-[#B61032] hover:bg-red-900/20 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors border border-[#B61032]/20"
                        title="Restore all settings used for this generation"
                     >
                        <RotateCcwIcon className="w-3 h-3" />
                        Restore Settings
                     </button>
                )}
              </div>
            )}
            <div className={`w-full grid ${gridClasses[gridColumns]} gap-4 items-start pt-2`}>
              {images.map((imgSrc, imgIndex) => {
                  const isAdded = addedToAssets.has(imgSrc);
                  return (
                      <div key={imgIndex} className="relative group">
                          <img src={imgSrc} alt={`Generated art for "${session.prompt}"`} className="w-full h-auto object-cover rounded-lg cursor-pointer" onClick={() => onOpenFullscreen(imgIndex)} />
                          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                  onClick={() => onAddToAssets(imgSrc)}
                                  className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors disabled:opacity-50"
                                  title={isAdded ? "Added to Style Assets" : "Add to Style Assets"}
                                  aria-label={isAdded ? "Added to Style Assets" : "Add to Style Assets"}
                                  disabled={isAdded}
                              >
                                  {isAdded ? <PlusCircleIcon className="w-4 h-4 text-[#B61032]" /> : <PlusIcon className="w-4 h-4" />}
                              </button>
                              <button
                                  onClick={() => onOpenFullscreen(imgIndex)}
                                  className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                                  title="View Fullscreen"
                                  aria-label="View Fullscreen"
                              >
                                  <ExpandIcon className="w-4 h-4" />
                              </button>
                              {isFlashModel && (
                                <button
                                    onClick={() => onEditImage(imgSrc)}
                                    className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
                                    title="Edit Image"
                                    aria-label="Edit Image"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                      </div>
                  )
              })}
              {isGenerating && Array.from({ length: generatingCount }).map((_, i) => (
                  <SkeletonLoader key={`skeleton-${i}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
};


interface GenerationViewProps {
  subjectPrompt: string;
  onSubjectPromptChange: (value: string) => void;
  onGenerateImage: () => void;
  generatedImages: string[] | null;
  isGeneratingImage: boolean;
  isProcessingStyle: boolean;
  generatingCount: number;
  error: string | null;
  isReadyToGenerate: boolean;
  onEditImageFromSrc: (src: string) => void;
  onAddToAssets: (src: string) => void;
  addedToAssets: Set<string>;
  onOpenFullscreen: (sourceType: 'generated' | 'history', index: number, prompt: string, model: GenerationModel) => void;
  generationHistory: GenerationSession[];
  onRestoreSession: (session: GenerationSession) => void;
  aspectRatio: string;
  onAspectRatioChange: (value: string) => void;
  removeBackground: boolean;
  onRemoveBackgroundChange: (value: boolean) => void;
  compositionReferenceImage: ImageFile | null;
  compositionView: string | null;
  onOpenCompositionReferenceModal: () => void;
  onRemoveCompositionReference: () => void;
  subjectReferenceImages: ImageFile[];
  onRemoveSubjectReferenceImage: (index: number) => void;
  onOpenSubjectReferenceModal: () => void;
  generationModel: GenerationModel;
  onGenerationModelChange: (model: GenerationModel) => void;
}

const CompositionReference: React.FC<{
  image: ImageFile | null;
  view: string | null;
  onOpenModal: () => void;
  onRemove: () => void;
  disabled: boolean;
}> = ({ image, view, onOpenModal, onRemove, disabled }) => {
    if (image) {
        return (
            <div className="flex items-center gap-2">
                <div className="relative group w-12 h-12 shrink-0">
                    <img 
                        src={`data:${image.type};base64,${image.base64}`} 
                        alt="Composition Reference" 
                        className="w-full h-full object-cover rounded-md border-2 border-slate-600 cursor-pointer"
                        onClick={onOpenModal}
                    />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600"
                        aria-label="Remove composition reference"
                    >
                        <XIcon className="w-3 h-3" />
                    </button>
                </div>
                <span className="text-sm text-slate-400 font-medium hidden sm:inline">Composition ref</span>
            </div>
        );
    }

    if (view) {
        return (
            <div className="flex items-center gap-2">
                <div className="relative group p-2 shrink-0 bg-slate-800 border-2 border-slate-600 rounded-md cursor-pointer" onClick={onOpenModal}>
                    <ImageIcon className="w-8 h-8 text-slate-500" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute -top-1.5 -right-1.5 p-0.5 bg-slate-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-600"
                        aria-label="Remove composition reference"
                    >
                        <XIcon className="w-3 h-3" />
                    </button>
                </div>
                <div className="text-sm text-slate-400 font-medium hidden sm:inline">
                    <span className="block">Composition:</span>
                    <span className="text-slate-200 font-semibold">{view}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            <button
                onClick={() => !disabled && onOpenModal()}
                disabled={disabled}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-200 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap"
                title="Add composition reference"
            >
                <ImageIcon className="w-5 h-5" />
                <span>Composition ref</span>
            </button>
            {disabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
                    Not available for Imagen model.
                </div>
            )}
        </div>
    );
};


const GenerationView: React.FC<GenerationViewProps> = ({
  subjectPrompt,
  onSubjectPromptChange,
  onGenerateImage,
  generatedImages,
  isGeneratingImage,
  isProcessingStyle,
  generatingCount,
  error,
  isReadyToGenerate,
  onEditImageFromSrc,
  onAddToAssets,
  addedToAssets,
  onOpenFullscreen,
  generationHistory,
  onRestoreSession,
  aspectRatio,
  onAspectRatioChange,
  removeBackground,
  onRemoveBackgroundChange,
  compositionReferenceImage,
  compositionView,
  onOpenCompositionReferenceModal,
  onRemoveCompositionReference,
  subjectReferenceImages,
  onRemoveSubjectReferenceImage,
  onOpenSubjectReferenceModal,
  generationModel,
  onGenerationModelChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const isImagenModel = generationModel === 'imagen-4.0-generate-001';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
            setIsFilterMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayableGenerations = useMemo(() => {
      // History is prepended, so newest is at index 0. Reverse for chronological order if we want bottom-up, but accordion list usually top-down?
      // Actually, let's keep history order (newest first) in the list, but display current at top.
      const historyItems = generationHistory.map(item => ({ session: item, isCurrent: false }));

      const all = [];
      // Add the current generation session if it exists or is in progress
      if (generatedImages || (isGeneratingImage && (subjectPrompt || (compositionReferenceImage && !isImagenModel)))) {
          const currentSessionPlaceholder: GenerationSession = {
              id: 'current',
              timestamp: Date.now(),
              prompt: subjectPrompt || "Current Workspace",
              images: generatedImages || [],
              model: generationModel,
              state: {} as any // Placeholder state, not really used for display
          };
          all.push({
              session: currentSessionPlaceholder,
              isCurrent: true,
          });
      }
      
      return [...all, ...historyItems];
  }, [generationHistory, generatedImages, subjectPrompt, isGeneratingImage, compositionReferenceImage, generationModel, isImagenModel]);

  const totalImageCount = useMemo(() => 
      displayableGenerations.reduce((acc, curr) => acc + curr.session.images.length, 0),
      [displayableGenerations]
  );
  
  useEffect(() => {
      // Scroll to top when new generation happens? Or bottom?
      // Given it's a vertical list where new items might appear at top...
      if (scrollContainerRef.current && isGeneratingImage) {
           scrollContainerRef.current.scrollTo({
              top: 0,
              behavior: 'smooth'
          });
      }
  }, [totalImageCount, isGeneratingImage]);

  const hasContent = displayableGenerations.length > 0;

  return (
    <div className="bg-slate-800 rounded-lg p-6 h-full flex flex-col gap-6 shadow-md border border-slate-700 text-slate-200">
      <div className="shrink-0">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">4. Add Prompt to generate image</h2>
        
        <div className="w-full bg-slate-900 border border-slate-600 rounded-md focus-within:ring-1 focus-within:ring-[#B61032] focus-within:border-[#B61032] transition flex flex-col">
            <div className="flex flex-row items-start p-1 gap-1">
                <textarea
                  id="subject-prompt"
                  rows={2}
                  className="w-full flex-grow bg-transparent border-0 p-2 text-slate-200 placeholder-slate-500 focus:ring-0 transition disabled:opacity-50 disabled:bg-slate-800 resize-none"
                  placeholder="e.g., A solo traveler looking at a sunset"
                  value={subjectPrompt}
                  onChange={(e) => onSubjectPromptChange(e.target.value)}
                  disabled={!isReadyToGenerate}
                  autoFocus
                />

                <div className="flex flex-row gap-2 items-center pr-1">
                    <div className="relative" ref={filterMenuRef}>
                      <button
                          onClick={() => setIsFilterMenuOpen(prev => !prev)}
                          disabled={!isReadyToGenerate}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-200 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                          aria-haspopup="true"
                          aria-expanded={isFilterMenuOpen}
                      >
                          <FilterIcon className="w-5 h-5" />
                          <span>Options</span>
                      </button>
                      {isFilterMenuOpen && (
                          <div className="absolute top-12 right-0 w-80 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-20 p-4 text-slate-200">
                              <div className="space-y-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-2">
                                          <h4 className="text-sm font-semibold text-slate-200">Model</h4>
                                          <InfoIcon tooltip="Imagen offers high-quality text-to-image generation. Nano Banana (Flash) is best for transferring style from reference images and editing." className="text-slate-400" />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          <button onClick={() => onGenerationModelChange('imagen-4.0-generate-001')} className={`p-2 text-sm text-center font-semibold rounded-md transition-colors ${isImagenModel ? 'bg-[#B61032] text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>
                                              Imagen <span className="font-normal block text-xs opacity-80">(High Quality)</span>
                                          </button>
                                          <button onClick={() => onGenerationModelChange('gemini-2.5-flash-image')} className={`p-2 text-sm text-center font-semibold rounded-md transition-colors ${!isImagenModel ? 'bg-[#B61032] text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}>
                                              Nano Banana <span className="font-normal block text-xs opacity-80">(Edit & Mix)</span>
                                          </button>
                                      </div>
                                  </div>
                                  <div className="border-t border-slate-700 -mx-4" />
                                  <div>
                                      <h4 className="text-sm font-semibold text-slate-200 mb-2">Aspect Ratio</h4>
                                      <div className="grid grid-cols-3 gap-2 text-center">
                                          {[
                                              { ratio: '1:1', label: 'Square' },
                                              { ratio: '16:9', label: 'Landscape' },
                                              { ratio: '9:16', label: 'Portrait' },
                                              { ratio: '4:3', label: 'Landscape' },
                                              { ratio: '3:4', label: 'Portrait' },
                                          ].map(({ratio, label}) => (
                                              <button
                                                  key={ratio}
                                                  onClick={() => onAspectRatioChange(ratio)}
                                                  className={`p-2 text-xs font-semibold rounded-md transition-colors ${
                                                      aspectRatio === ratio
                                                          ? 'bg-[#B61032] text-white'
                                                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                  }`}
                                              >
                                                  <div>{ratio}</div>
                                                  <div className={`font-normal ${aspectRatio === ratio ? 'text-red-100' : 'text-slate-400'}`}>{label}</div>
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="border-t border-slate-700 -mx-4" />
                                  <div>
                                      <h4 className="text-sm font-semibold text-slate-200 mb-3">Options</h4>
                                      <div className="space-y-3">
                                          <label className="flex items-center justify-between cursor-pointer">
                                              <span className="text-sm text-slate-300">Remove Background</span>
                                              <div className="relative">
                                                  <input type="checkbox" className="sr-only peer" checked={removeBackground} onChange={(e) => onRemoveBackgroundChange(e.target.checked)} />
                                                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B61032]"></div>
                                              </div>
                                          </label>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                    </div>
                    <CompositionReference 
                        image={compositionReferenceImage}
                        view={compositionView}
                        onOpenModal={onOpenCompositionReferenceModal}
                        onRemove={onRemoveCompositionReference}
                        disabled={isImagenModel}
                    />
                    <button
                        onClick={onOpenSubjectReferenceModal}
                        disabled={isImagenModel}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-slate-200 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed whitespace-nowrap group relative"
                        title="Add subject reference"
                    >
                        <UserIcon className="w-5 h-5" />
                        <span>Subject ref</span>
                         {isImagenModel && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
                                Not available for Imagen model.
                            </div>
                        )}
                    </button>
                    <button
                      onClick={onGenerateImage}
                      disabled={isGeneratingImage || isProcessingStyle || !isReadyToGenerate}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-600"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Spinner />
                          <span>Generating...</span>
                        </>
                      ) : isProcessingStyle ? (
                          <>
                              <Spinner />
                              <span>Analyzing...</span>
                          </>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                </div>
            </div>
            {subjectReferenceImages.length > 0 && (
              <div className="px-3 pb-2 flex flex-wrap gap-3 border-t border-slate-600 mt-2 pt-2">
                {subjectReferenceImages.map((image, index) => (
                  <div key={index} className="relative w-12 h-12 group flex-shrink-0">
                    <img
                      src={`data:${image.type};base64,${image.base64}`}
                      alt={image.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      onClick={() => onRemoveSubjectReferenceImage(index)}
                      className="absolute -top-1 -right-1 p-0.5 bg-black bg-opacity-60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
                      aria-label={`Remove ${image.name}`}
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
      
      <div className="flex-grow bg-slate-900 rounded-lg flex flex-col border border-slate-700 overflow-hidden min-h-0">
        {!hasContent ? (
          <div className="w-full h-full flex items-center justify-center text-center text-slate-500 p-8">
            <div>
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-slate-300">Your artwork will appear here</h3>
              <p className="text-sm">Enter a prompt and click 'Generate'.</p>
            </div>
          </div>
        ) : (
            <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto p-4 space-y-3">
                {displayableGenerations.map((item) => (
                    <GenerationAccordionItem
                        key={item.session.id}
                        session={item.session}
                        isCurrent={item.isCurrent}
                        defaultOpen={item.isCurrent}
                        onOpenFullscreen={(imgIndex) => onOpenFullscreen(item.isCurrent ? 'generated' : 'history', imgIndex, item.session.prompt, item.session.model)}
                        onEditImage={onEditImageFromSrc}
                        onAddToAssets={onAddToAssets}
                        onRestoreSession={onRestoreSession}
                        addedToAssets={addedToAssets}
                        isGenerating={item.isCurrent && isGeneratingImage}
                        generatingCount={item.isCurrent ? generatingCount : 0}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default GenerationView;