
import React, { useRef } from 'react';
import type { ImageFile } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { Spinner } from './icons/Spinner';
import { XIcon } from './icons/XIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface AssetLibraryProps {
  uploadedImages: ImageFile[];
  onImageUpload: (files: FileList) => void;
  onImageRemove: (index: number) => void;
  onImageClick: (index: number) => void;
  freeFormText: string;
  onFreeFormTextChange: (value: string) => void;
  onAnalyzeStyle: () => void;
  supportivePrompt: string;
  onSupportivePromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  styleDescription: string;
  onStyleDescriptionChange: (value: string) => void;
  isProcessingStyle: boolean;
  statusMessage: string;
  isGeneratingSuggestions: boolean;
  suggestionsAvailable: boolean;
  onOpenSuggestionsModal: () => void;
  useAiStyleAnalysis: boolean;
  onUseAiStyleAnalysisChange: (value: boolean) => void;
  useStyleGuidance: boolean;
  onUseStyleGuidanceChange: (value: boolean) => void;
  hasGeneratedImages: boolean;
  onDownloadAll: () => void;
  onOpenStyleAnalysisModal: () => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ checked, onChange, disabled }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
        <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B61032]"></div>
    </label>
);

const InfoIcon: React.FC<{ tooltip: string } & React.SVGProps<SVGSVGElement>> = ({ tooltip, ...props }) => (
  <div className="relative group">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
      {tooltip}
    </div>
  </div>
);


const AssetLibrary: React.FC<AssetLibraryProps> = ({
  uploadedImages,
  onImageUpload,
  onImageRemove,
  onImageClick,
  freeFormText,
  onFreeFormTextChange,
  onAnalyzeStyle,
  supportivePrompt,
  onSupportivePromptChange,
  negativePrompt,
  onNegativePromptChange,
  styleDescription,
  onStyleDescriptionChange,
  isProcessingStyle,
  statusMessage,
  isGeneratingSuggestions,
  suggestionsAvailable,
  onOpenSuggestionsModal,
  useAiStyleAnalysis,
  onUseAiStyleAnalysisChange,
  useStyleGuidance,
  onUseStyleGuidanceChange,
  hasGeneratedImages,
  onDownloadAll,
  onOpenStyleAnalysisModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onImageUpload(event.target.files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onImageUpload(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="bg-slate-800 rounded-lg h-full flex flex-col shadow-md border border-slate-700 text-slate-200">
      <div className="flex-grow overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">1. Define your art style (Optional)</h2>
            <p className="text-sm text-slate-400 mb-4">Upload images or describe a style to guide the AI.</p>
            
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
              <p className="text-xs text-slate-500">PNG, JPG, WEBP supported</p>
            </div>

            {uploadedImages.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative w-12 h-12 group flex-shrink-0">
                    <img
                      src={`data:${image.type};base64,${image.base64}`}
                      alt={image.name}
                      className="w-full h-full object-cover rounded-md cursor-pointer"
                      onClick={() => onImageClick(index)}
                    />
                    <button
                      onClick={() => onImageRemove(index)}
                      className="absolute -top-1 -right-1 p-0.5 bg-black bg-opacity-60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-80"
                      aria-label={`Remove ${image.name}`}
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="h-4" />
            
            <p className="text-sm text-slate-400 mb-2">Describe your style in words (optional, can be combined with images).</p>
            <textarea
              value={freeFormText}
              onChange={(e) => onFreeFormTextChange(e.target.value)}
              placeholder="e.g., A whimsical watercolor style with soft, pastel colors, gentle lighting, and organic shapes..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032] transition"
              disabled={isProcessingStyle}
            />
          </div>
          
          <div className="border-t border-slate-700" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-100">2. AI Style Analysis</h2>
                    <InfoIcon tooltip="When enabled, the AI uses this description to guide generation. You must click 'Analyze Style' to generate/update it." className="text-slate-400" />
                </div>
                <div className="flex items-center gap-3">
                    {isProcessingStyle && <Spinner className="w-5 h-5" />}
                    <ToggleSwitch checked={useAiStyleAnalysis} onChange={onUseAiStyleAnalysisChange} />
                </div>
            </div>
            
            <button
                onClick={onAnalyzeStyle}
                disabled={isProcessingStyle || (uploadedImages.length === 0 && !freeFormText.trim())}
                className="w-full mt-2 mb-2 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-600"
            >
                {isProcessingStyle ? <Spinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                <span>{isProcessingStyle ? 'Analyzing...' : 'Analyze Style'}</span>
            </button>

            <div className="mt-2 space-y-2">
                {useAiStyleAnalysis && styleDescription ? (
                  <div className="text-center text-sm text-slate-400 p-4 bg-slate-900 rounded-md border border-slate-700">
                    <p className="font-semibold text-slate-300">Style DNA analysis is available.</p>
                    <button 
                        onClick={onOpenStyleAnalysisModal}
                        className="mt-2 text-sm font-semibold text-[#B61032] hover:text-[#960d29]"
                    >
                        View & Edit Details
                    </button>
                  </div>
                ) : useAiStyleAnalysis ? (
                    <div className="text-center text-sm text-slate-500 p-4 bg-slate-900 rounded-md border border-slate-700 border-dashed">
                        {isProcessingStyle ? 'Analyzing inputs...' : 'Click "Analyze Style" to generate a Style DNA.'}
                    </div>
                ) : null}
                
                {suggestionsAvailable && (
                    <button 
                        onClick={onOpenSuggestionsModal}
                        className="text-sm font-semibold text-[#B61032] hover:text-[#960d29] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!useAiStyleAnalysis}
                    >
                        <MagicWandIcon className="w-4 h-4" />
                        {isGeneratingSuggestions ? 'Generating suggestions...' : 'Show improvement suggestions'}
                    </button>
                )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-200">3. Style Guidance (Optional)</h3>
                <ToggleSwitch checked={useStyleGuidance} onChange={onUseStyleGuidanceChange} />
            </div>
            <div className="flex flex-col gap-4">
                <div>
                    <label htmlFor="supportive-prompt" className="block text-xs font-medium text-slate-400 mb-2">
                        Positive Keywords
                    </label>
                    <input
                        type="text"
                        id="supportive-prompt"
                        className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032] transition disabled:opacity-50 disabled:bg-slate-800"
                        placeholder="e.g., vibrant colors, cinematic lighting"
                        value={supportivePrompt}
                        onChange={(e) => onSupportivePromptChange(e.target.value)}
                        disabled={!useStyleGuidance}
                    />
                </div>
                <div>
                    <label htmlFor="negative-prompt" className="block text-xs font-medium text-slate-400 mb-2">
                        Negative Keywords
                    </label>
                    <input
                        type="text"
                        id="negative-prompt"
                        className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032] transition disabled:opacity-50 disabled:bg-slate-800"
                        placeholder="e.g., blurry, low quality, watermark"
                        value={negativePrompt}
                        onChange={(e) => onNegativePromptChange(e.target.value)}
                        disabled={!useStyleGuidance}
                    />
                </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0 border-t border-slate-700 shrink-0">
        <button
          onClick={onDownloadAll}
          disabled={!hasGeneratedImages}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed border border-slate-600"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>Download All</span>
        </button>
      </div>
    </div>
  );
};

export default AssetLibrary;