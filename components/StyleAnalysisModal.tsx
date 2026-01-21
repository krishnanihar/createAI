
import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { StyleDnaDisplay } from './StyleDnaDisplay';
import { generateStyleDescriptionFromText } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { Spinner } from './icons/Spinner';

interface StyleAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  styleDescription: string;
  onStyleDescriptionChange: (value: string) => void;
}

const StyleAnalysisModal: React.FC<StyleAnalysisModalProps> = ({
  isOpen,
  onClose,
  styleDescription,
  onStyleDescriptionChange
}) => {
  const [freeFormText, setFreeFormText] = useState('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeText = async () => {
    if (!freeFormText.trim()) return;
    setIsAnalyzingText(true);
    setError(null);
    try {
      const newStyleJson = await generateStyleDescriptionFromText(freeFormText);
      onStyleDescriptionChange(newStyleJson);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the text. Please try again.");
    } finally {
      setIsAnalyzingText(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="style-analysis-modal-title"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 id="style-analysis-modal-title" className="text-xl font-bold text-slate-100">AI Style Analysis</h2>
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
            <h3 className="text-lg font-bold text-slate-200 mb-2">Describe Your Style</h3>
            <p className="text-sm text-slate-400 mb-3">
              Provide a free-form description of your art style. The AI will extract the key details into the structured format below.
            </p>
            <textarea
              value={freeFormText}
              onChange={(e) => setFreeFormText(e.target.value)}
              placeholder="e.g., A whimsical watercolor style with soft, pastel colors, gentle lighting, and organic shapes. The texture is like rough paper..."
              rows={5}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032] transition"
              disabled={isAnalyzingText}
            />
            <button
              onClick={handleAnalyzeText}
              disabled={isAnalyzingText || !freeFormText.trim()}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {isAnalyzingText ? <Spinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
              <span>{isAnalyzingText ? 'Analyzing...' : 'Analyze & Fill'}</span>
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="border-t border-slate-700" />

           <StyleDnaDisplay 
              styleDescription={styleDescription}
              onStyleDescriptionChange={onStyleDescriptionChange}
           />
        </main>
        <footer className="flex justify-end items-center gap-4 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
};

export default StyleAnalysisModal;