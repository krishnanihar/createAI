
import React, { useState, useEffect, useMemo } from 'react';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { StyleDnaDisplay } from './StyleDnaDisplay'; // Using the new visual component

type ChangeType = 'style' | 'positive' | 'negative';

interface SuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (changes: { style?: string; positive?: string; negative?: string }) => void;
  currentStyleDescription: string;
  suggestedStyleDescription: string;
  currentSupportivePrompt: string;
  suggestedSupportivePrompt: string;
  currentNegativePrompt: string;
  suggestedNegativePrompt: string;
}

const KeywordDiff: React.FC<{
    current: string;
    suggested: string;
    onApply: (value: string) => void;
}> = ({ current, suggested, onApply }) => {
    const [content, setContent] = useState(suggested);

    useEffect(() => {
        setContent(suggested);
    }, [suggested]);
    
    const { added, removed, unchanged } = useMemo(() => {
        const currentSet = new Set(current.split(',').map(k => k.trim()).filter(Boolean));
        const suggestedSet = new Set(suggested.split(',').map(k => k.trim()).filter(Boolean));
        
        const added = [...suggestedSet].filter(k => !currentSet.has(k));
        const removed = [...currentSet].filter(k => !suggestedSet.has(k));
        const unchanged = [...currentSet].filter(k => suggestedSet.has(k));
        
        return { added, removed, unchanged };
    }, [current, suggested]);
    
    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex-grow bg-slate-900 border border-slate-700 rounded-md p-4">
                <p className="text-sm text-slate-400 mb-3">The AI suggests these keyword changes for better results.</p>
                <div className="flex flex-wrap gap-2">
                    {unchanged.map(k => <span key={k} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-sm">{k}</span>)}
                    {added.map(k => <span key={k} className="px-2 py-1 bg-green-900 text-green-200 rounded text-sm font-medium ring-1 ring-green-700"> + {k}</span>)}
                    {removed.map(k => <span key={k} className="px-2 py-1 bg-red-900 text-red-200 rounded text-sm line-through">{k}</span>)}
                </div>
                 <textarea
                    className="w-full mt-6 bg-slate-800 border border-slate-600 rounded-md p-3 text-sm text-slate-200 focus:ring-1 focus:ring-[#B61032] focus:border-[#B61032] transition resize-none"
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                 />
            </div>
            <footer className="flex justify-end items-center gap-4 pt-4 border-t border-slate-700">
                <button
                    onClick={() => setContent(suggested)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={() => onApply(content)}
                    className="px-4 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors"
                >
                    Apply Changes
                </button>
            </footer>
        </div>
    );
};


const SuggestionsModal: React.FC<SuggestionsModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentStyleDescription,
  suggestedStyleDescription,
  currentSupportivePrompt,
  suggestedSupportivePrompt,
  currentNegativePrompt,
  suggestedNegativePrompt,
}) => {
  const [activeTab, setActiveTab] = useState<ChangeType>('style');
  const [editedStyle, setEditedStyle] = useState(suggestedStyleDescription);

  useEffect(() => {
    // When the modal opens or suggestions change, reset the edited style
    setEditedStyle(suggestedStyleDescription);
  }, [suggestedStyleDescription, isOpen]);

  if (!isOpen) return null;
  
  const handleApplyStyle = () => {
    onApply({ style: editedStyle });
  };
  
  const handleResetStyle = () => {
    setEditedStyle(suggestedStyleDescription);
  }

  const renderContent = () => {
    switch (activeTab) {
        case 'style':
            return (
                <div className="h-full flex flex-col gap-4">
                    <div className="flex-grow overflow-y-auto bg-slate-900 border border-slate-700 rounded-md p-4">
                       <StyleDnaDisplay 
                            styleDescription={editedStyle}
                            onStyleDescriptionChange={setEditedStyle}
                            diffSource={currentStyleDescription}
                        />
                    </div>
                     <footer className="flex justify-end items-center gap-4 pt-4 border-t border-slate-700">
                        <button
                            onClick={handleResetStyle}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-md border border-slate-600 hover:bg-slate-700 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApplyStyle}
                            className="px-4 py-2 bg-[#B61032] text-white font-semibold rounded-md hover:bg-[#960d29] transition-colors"
                        >
                            Apply Changes
                        </button>
                    </footer>
                </div>
            );
        case 'positive':
            return <KeywordDiff 
                current={currentSupportivePrompt} 
                suggested={suggestedSupportivePrompt}
                onApply={(value) => onApply({ positive: value })}
            />;
        case 'negative':
            return <KeywordDiff 
                current={currentNegativePrompt} 
                suggested={suggestedNegativePrompt}
                onApply={(value) => onApply({ negative: value })}
            />;
        default:
            return null;
    }
  }

  const tabs: { id: ChangeType; label: string; }[] = [
    { id: 'style', label: 'AI Style Analysis' },
    { id: 'positive', label: 'Positive Keywords' },
    { id: 'negative', label: 'Negative Keywords' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-modal-title"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800 rounded-t-lg">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-[#B61032]"/>
            <h2 id="suggestion-modal-title" className="text-xl font-bold text-slate-100">Suggested Improvements</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow flex flex-col sm:flex-row overflow-hidden">
            <nav className="w-full sm:w-56 bg-slate-800 border-b sm:border-r sm:border-b-0 border-slate-700 p-4 shrink-0">
                <ul className="flex sm:flex-col gap-2">
                    {tabs.map(tab => (
                        <li key={tab.id} className="flex-1">
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left font-semibold px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
                                    activeTab === tab.id
                                    ? 'bg-[#B61032] text-white'
                                    : 'text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
            <main className="flex-grow p-6 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsModal;