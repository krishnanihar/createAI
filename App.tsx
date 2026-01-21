
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import AssetLibrary from './components/AssetLibrary';
import GenerationView from './components/GenerationView';
import SuggestionsModal from './components/SuggestionsModal';
import ImageEditorModal from './components/ImageEditorModal';
import FullscreenViewer from './components/FullscreenViewer';
import StyleAnalysisModal from './components/StyleAnalysisModal';
import SubjectReferenceModal from './components/SubjectReferenceModal';
import CompositionReferenceModal from './components/CompositionReferenceModal';
import { Logo } from './components/icons/Logo';
import { MenuIcon } from './components/icons/MenuIcon';
import { generateStyleDescription, generateImagesWithReference, generateStyleSuggestions, editImageWithMask, generateImagesWithImagen } from './services/geminiService';
import { toBase64, dataURLtoFile } from './utils/fileUtils';
import type { ImageFile, GenerationModel, GenerationSession } from './types';

type FullscreenSource = 
  | { type: 'assets' } 
  | { type: 'generated' } 
  | { type: 'history', prompt: string, model: GenerationModel };

const App: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<ImageFile[]>([]);
  const [freeFormStyleText, setFreeFormStyleText] = useState('');
  const [supportivePrompt, setSupportivePrompt] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [subjectPrompt, setSubjectPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [removeBackground, setRemoveBackground] = useState(false);
  const [compositionReferenceImage, setCompositionReferenceImage] = useState<ImageFile | null>(null);
  const [compositionView, setCompositionView] = useState<string | null>(null);
  const [subjectReferenceImages, setSubjectReferenceImages] = useState<ImageFile[]>([]);
  const [generationModel, setGenerationModel] = useState<GenerationModel>('gemini-2.5-flash-image');
  
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [generationHistory, setGenerationHistory] = useState<GenerationSession[]>([]);
  const [addedToAssets, setAddedToAssets] = useState<Set<string>>(new Set());
  
  const [isProcessingStyle, setIsProcessingStyle] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState('Upload images or describe a style.');
  const [error, setError] = useState<string | null>(null);

  const [suggestedStyleDescription, setSuggestedStyleDescription] = useState<string | null>(null);
  const [suggestedSupportivePrompt, setSuggestedSupportivePrompt] = useState<string | null>(null);
  const [suggestedNegativePrompt, setSuggestedNegativePrompt] = useState<string | null>(null);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isStyleAnalysisModalOpen, setIsStyleAnalysisModalOpen] = useState(false);
  const [isSubjectReferenceModalOpen, setIsSubjectReferenceModalOpen] = useState(false);
  const [isCompositionReferenceModalOpen, setIsCompositionReferenceModalOpen] = useState(false);

  const [editingImage, setEditingImage] = useState<{ index: number; src: string } | null>(null);
  const [fullscreenState, setFullscreenState] = useState<{ source: FullscreenSource; index: number; } | null>(null);

  const [useAiStyleAnalysis, setUseAiStyleAnalysis] = useState(true);
  const [useStyleGuidance, setUseStyleGuidance] = useState(true);

  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);

  const handleAnalyzeStyle = useCallback(async () => {
    if (uploadedImages.length === 0 && !freeFormStyleText.trim()) {
        setError("Please upload images or enter a text description to analyze.");
        return;
    }
    
    setIsProcessingStyle(true);
    setError(null);
    setStatusMessage('Analyzing style...');
    
    try {
        const description = await generateStyleDescription(uploadedImages, freeFormStyleText);
        setStyleDescription(description);
        setStatusMessage('Style analysis complete.');
    } catch (err) {
        console.error(err);
        setError("Failed to analyze the style. Please try again.");
        setStatusMessage('Error analyzing style.');
    } finally {
        setIsProcessingStyle(false);
    }
  }, [uploadedImages, freeFormStyleText]);

  const clearSuggestions = () => {
    setSuggestedStyleDescription(null);
    setSuggestedSupportivePrompt(null);
    setSuggestedNegativePrompt(null);
  };

  const handleImagesAdded = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    setStatusMessage('Reading files...');
    
    try {
      const filePromises = files.map(file => toBase64(file).then(b64 => ({ file, b64 })));
      const results = await Promise.all(filePromises);
      
      const newImageFiles = results.map(({ file, b64 }) => ({
        name: file.name || `pasted_image_${Date.now()}.png`,
        base64: b64.split(',')[1],
        type: file.type,
      }));
      
      setUploadedImages(prev => [...prev, ...newImageFiles]);
      setStatusMessage('Images added. Click "Analyze Style" to update analysis.');
    } catch (err) {
      console.error(err);
      setError('Failed to process images.');
      setStatusMessage('Error processing images.');
    }
  }, []);

  const handleImageUpload = useCallback((files: FileList) => {
    handleImagesAdded(Array.from(files));
  }, [handleImagesAdded]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;
      if (!event.clipboardData?.items) return;
      
      const imageFiles = Array.from(event.clipboardData.items)
        .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);
      
      if (imageFiles.length > 0) {
        event.preventDefault();
        handleImagesAdded(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleImagesAdded]);

  const handleImageRemove = useCallback((indexToRemove: number) => {
    setUploadedImages(prevImages => {
      const newImages = prevImages.filter((_, index) => index !== indexToRemove);
      return newImages;
    });
    setStatusMessage('Image removed. Remember to re-analyze if needed.');
  }, []);
  
  const handleApplyCompositionReference = useCallback(({ image, view }: { image: ImageFile | null; view: string | null }) => {
    setCompositionReferenceImage(image);
    setCompositionView(view);
  }, []);

  const handleRemoveCompositionReference = useCallback(() => {
    setCompositionReferenceImage(null);
    setCompositionView(null);
  }, []);

  const handleSetSubjectReferenceImages = useCallback((images: ImageFile[]) => {
    setSubjectReferenceImages(images);
  }, []);

  const handleRemoveSubjectReferenceImage = useCallback((indexToRemove: number) => {
    setSubjectReferenceImages(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleRestoreSession = useCallback((session: GenerationSession) => {
      if (window.confirm("Restore settings from this session? This will overwrite your current inputs.")) {
          const { state } = session;
          setUploadedImages(state.uploadedImages);
          setFreeFormStyleText(state.freeFormStyleText);
          setStyleDescription(state.styleDescription);
          setSubjectPrompt(state.subjectPrompt);
          setSupportivePrompt(state.supportivePrompt);
          setNegativePrompt(state.negativePrompt);
          setAspectRatio(state.aspectRatio);
          setRemoveBackground(state.removeBackground);
          setCompositionReferenceImage(state.compositionReferenceImage);
          setCompositionView(state.compositionView);
          setSubjectReferenceImages(state.subjectReferenceImages);
          setGenerationModel(state.generationModel);
          setUseAiStyleAnalysis(state.useAiStyleAnalysis);
          setUseStyleGuidance(state.useStyleGuidance);
          
          setGeneratedImages(session.images);
          setStatusMessage(`Restored session from ${new Date(session.timestamp).toLocaleTimeString()}`);
      }
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (generationModel === 'gemini-2.5-flash-image' && !subjectPrompt && !compositionReferenceImage && !compositionView && subjectReferenceImages.length === 0) {
      setError('Please enter a subject prompt or provide a composition or subject reference.');
      return;
    }
    if (generationModel === 'imagen-4.0-generate-001' && !subjectPrompt) {
      setError('Please enter a subject prompt to generate an image.');
      return;
    }
    if (useAiStyleAnalysis && !styleDescription && generationModel === 'imagen-4.0-generate-001' && uploadedImages.length > 0) {
        setError('Style description is not available. Please analyze style first.');
        return;
    }

    setError(null);
    setIsGeneratingImage(true);
    clearSuggestions();
    
    const numberOfImagesToGenerate = 3;
    setGeneratingCount(numberOfImagesToGenerate);

    try {
      let imageB64s: string[];
      
      if (generationModel === 'imagen-4.0-generate-001') {
        let fullPrompt = [subjectPrompt, supportivePrompt].filter(Boolean).join(', ');
        if (useAiStyleAnalysis && styleDescription) {
            let styleInstruction: string;
            try {
                const styleObj = JSON.parse(styleDescription);
                const parts = [];
                if (styleObj.overallAesthetic) parts.push(styleObj.overallAesthetic);
                if (styleObj.materialAndTexture?.surfaceTexture) parts.push(`with a ${styleObj.materialAndTexture.surfaceTexture} texture`);
                if (styleObj.lighting?.style) parts.push(`using ${styleObj.lighting.style} lighting`);
                if (styleObj.composition?.complexity) parts.push(`in a ${styleObj.composition.complexity} composition`);
                if (styleObj.colorPalette?.usageDescription) parts.push(`with a color palette that is ${styleObj.colorPalette.usageDescription}`);
                styleInstruction = `Render this in an artistic style described as: ${parts.join(', ')}.`;
            } catch (e) {
                styleInstruction = `Render this in the artistic style described as: ${styleDescription}`;
            }
            fullPrompt = `${fullPrompt}. ${styleInstruction}`;
        }
        imageB64s = await generateImagesWithImagen(fullPrompt, numberOfImagesToGenerate, aspectRatio);
      } else {
        // Logic for gemini-2.5-flash-image
        const qualityKeywords = "masterpiece, 4k, high resolution, ultra-detailed, sharp focus";
        let positiveKeywords = supportivePrompt ? `${supportivePrompt}, ${qualityKeywords}` : qualityKeywords;
        let finalNegativePrompt = negativePrompt;

        if (removeBackground) {
          positiveKeywords += ', transparent background, isolated subject, no background, clean cutout, white background, plain background';
          const negativeAdditions = 'background, scenery, environment, context, indoor, outdoor, landscape, shadows, cast shadow, drop shadow, contact shadow, texture, pattern, gradient, noise, messy, complex, detailed background, wall, floor, ground, furniture, plants, objects';
          finalNegativePrompt = finalNegativePrompt ? `${finalNegativePrompt}, ${negativeAdditions}` : negativeAdditions;
        }

        const compositionMandate = compositionReferenceImage
            ? `**COMPOSITION REFERENCE**: A composition reference image is provided. Use its composition, layout, and subject placement as a strong guide for the new image. The STYLE of the composition reference image should be IGNORED.`
            : compositionView
            ? `**COMPOSITION MANDATE**: The new image MUST be rendered from a "${compositionView}" perspective. This is a strict compositional requirement.`
            : '';
        
        const subjectReferenceMandate = subjectReferenceImages.length > 0
            ? `**SUBJECT REFERENCE**: Subject reference images are provided. Use them as the primary visual source for the subject of the new image. **CRITICAL**: The visual characteristics, features, and details of the subject in these reference images must be replicated with extreme fidelity. However, the overall ART STYLE (e.g., brushwork, lighting, color grading) of the subject reference(s) should be completely IGNORED and replaced with the art style defined by the main style references.`
            : '';

        let subjectInstruction;
        if (subjectReferenceImages.length > 0) {
            subjectInstruction = subjectPrompt 
                ? `**Subject**: Create an image of "${subjectPrompt}", using the provided subject reference images as a strong visual guide for the subject's appearance and characteristics.`
                : `**Subject**: Create a new image based on the provided subject reference images.`;
        } else {
            subjectInstruction = subjectPrompt 
                ? `**Subject**: Create an image of "${subjectPrompt}".` 
                : '**Subject**: Create a new image based on the composition reference.';
        }
        
        const promptParts = [
          `**Task**: Generate a new, high-quality image with a ${aspectRatio} aspect ratio.`,
          subjectInstruction,
        ];

        if (removeBackground) {
            promptParts.push(`**BACKGROUND MANDATE**: The subject MUST be isolated on a completely TRANSPARENT background. Do NOT generate any background elements, scenery, environment, context, or shadows. The background pixels must be empty/transparent. This is a strict requirement for a cutout asset.`);
        }

        if (subjectReferenceImages.length > 0) {
            promptParts.push(subjectReferenceMandate);
        }

        if (compositionReferenceImage || compositionView) {
            promptParts.push(compositionMandate);
        }

        if (uploadedImages.length > 0) {
            if (useAiStyleAnalysis) {
                promptParts.push(`**CRITICAL STYLE MANDATE**: This is a command, not a suggestion. The artistic style of the new image must be a PERFECT, FLAWLESS REPLICATION of the style embodied by the provided reference images. The reference images are the absolute ground truth for the style. Style fidelity is the number one priority, overriding all other interpretations. The detailed style description below is your guide to achieving this perfection.`);
            } else {
                promptParts.push(`**STYLE MANDATE**: The artistic style of the new image must be a PERFECT, FLAWLESS REPLICATION of the style embodied by the provided reference images. Style fidelity is the number one priority.`);
            }
            
            if (useAiStyleAnalysis && styleDescription) {
                promptParts.push(`**Style DNA Analysis (from reference images)**: \n${styleDescription}`);
            }
        }
        
        if (useStyleGuidance) {
            const instructions = [
                `**Execution Instructions**:`,
                `- Positive Keywords (Enhance these qualities): ${positiveKeywords}`
            ];
            if (finalNegativePrompt) {
                instructions.push(`- Negative Keywords (Strictly avoid these elements): ${finalNegativePrompt}`);
            }
            promptParts.push(instructions.join('\n'));
        }

        if (uploadedImages.length > 0) {
            promptParts.push(`Execute this task with extreme precision. The subject of the reference images must be completely ignored and replaced with the new subject, but the style must be preserved exactly.`);
        }

        const fullPrompt = promptParts.join('\n\n');
        imageB64s = await generateImagesWithReference(fullPrompt, uploadedImages, numberOfImagesToGenerate, compositionReferenceImage, subjectReferenceImages);
      }

      const newImages = imageB64s.map(b64 => `data:image/jpeg;base64,${b64}`);
      
      // Create new session history item
      const newSession: GenerationSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        prompt: subjectPrompt || "Composition/Style Generation",
        images: newImages,
        model: generationModel,
        state: {
            uploadedImages,
            freeFormStyleText,
            styleDescription,
            subjectPrompt,
            supportivePrompt,
            negativePrompt,
            aspectRatio,
            removeBackground,
            compositionReferenceImage,
            compositionView,
            subjectReferenceImages,
            generationModel,
            useAiStyleAnalysis,
            useStyleGuidance
        }
      };

      setGenerationHistory(prev => [newSession, ...prev]);
      setGeneratedImages(newImages);
      
      if (imageB64s.length > 0 && generationModel === 'gemini-2.5-flash-image') {
        setIsGeneratingSuggestions(true);
        setStatusMessage('Analyzing result for refinement suggestions...');
        try {
          const firstGeneratedImageFile: ImageFile = { name: 'generated.jpg', base64: imageB64s[0], type: 'image/jpeg' };
          const suggestions = await generateStyleSuggestions(uploadedImages, firstGeneratedImageFile, styleDescription, supportivePrompt, negativePrompt);
          setSuggestedStyleDescription(suggestions.suggestedStyleDescription);
          setSuggestedSupportivePrompt(suggestions.suggestedPositivePrompt);
          setSuggestedNegativePrompt(suggestions.suggestedNegativePrompt);
          setStatusMessage('Style refinement suggestions are ready!');
        } catch (suggestionError) {
            console.error('Failed to generate suggestions:', suggestionError);
            setStatusMessage('Image generated. Could not retrieve suggestions.');
        } finally {
          setIsGeneratingSuggestions(false);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate the image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
      setGeneratingCount(0);
    }
  }, [subjectPrompt, styleDescription, supportivePrompt, uploadedImages, negativePrompt, aspectRatio, removeBackground, compositionReferenceImage, compositionView, subjectReferenceImages, generationModel, useAiStyleAnalysis, useStyleGuidance, freeFormStyleText]);

  const handleOpenSuggestionsModal = () => setIsSuggestionsModalOpen(true);
  const handleCloseSuggestionsModal = () => setIsSuggestionsModalOpen(false);

  const handleApplySuggestions = useCallback((changes: { style?: string, positive?: string, negative?: string }) => {
    let applied = false;
    if (changes.style) {
      setStyleDescription(changes.style);
      applied = true;
    }
    if (changes.positive) {
      setSupportivePrompt(changes.positive);
      applied = true;
    }
    if (changes.negative) {
      setNegativePrompt(changes.negative);
      applied = true;
    }

    if (applied) {
        setStatusMessage('Suggestions applied! Ready for the next generation.');
    }
  }, []);

  const handleOpenEditorWithSrc = (src: string) => {
    const index = generatedImages?.findIndex(img => img === src) ?? -1;
    setEditingImage({ index, src });
  };
  const handleCloseEditor = () => setEditingImage(null);

  const handleApplyEdit = async (index: number, newImageBase64: string) => {
    const newImageSrc = `data:image/jpeg;base64,${newImageBase64}`;
    setGeneratedImages(prevImages => prevImages ? [...prevImages, newImageSrc] : [newImageSrc]);
    handleCloseEditor();
  };
  
  const handleAddToAssets = useCallback(async (imageSrc: string) => {
    if (addedToAssets.has(imageSrc)) return;
    const newFile = dataURLtoFile(imageSrc, `generated_asset_${Date.now()}.jpeg`);
    setAddedToAssets(prev => new Set(prev).add(imageSrc));
    await handleImagesAdded([newFile]);
  }, [addedToAssets, handleImagesAdded]);

  const editServiceWithStyle = useCallback(
    (prompt: string, image: ImageFile, mask: ImageFile) => {
        return editImageWithMask(prompt, image, mask, styleDescription);
    },
    [styleDescription]
  );
  
  const openFullscreen = (source: FullscreenSource, index: number) => {
    setFullscreenState({ source, index });
  };
  const closeFullscreen = () => setFullscreenState(null);

  const handleFullscreenNav = (direction: 'next' | 'prev') => {
    setFullscreenState(current => {
      if (!current) return null;
  
      const { source } = current;
      let imageList: string[] = [];
      if (source.type === 'assets') {
        imageList = uploadedImages.map(img => `data:${img.type};base64,${img.base64}`);
      } else if (source.type === 'generated') {
        imageList = generatedImages || [];
      } else if (source.type === 'history') {
        const historyItem = generationHistory.find(h => h.prompt === source.prompt && h.model === source.model);
        imageList = historyItem?.images || [];
      }
  
      const newIndex = current.index + (direction === 'next' ? 1 : -1);
  
      if (newIndex >= 0 && newIndex < imageList.length) {
        return { ...current, index: newIndex };
      }
      return current;
    });
  };

  const getFullscreenData = () => {
    if (!fullscreenState) return null;

    const { source, index } = fullscreenState;
    let images: string[] = [];
    let isAsset = false;
    let model: GenerationModel | undefined;

    if (source.type === 'assets') {
        images = uploadedImages.map(img => `data:${img.type};base64,${img.base64}`);
        isAsset = true;
    } else if (source.type === 'generated') {
        images = generatedImages || [];
        model = generationModel;
    } else if (source.type === 'history') {
        const historyItem = generationHistory.find(h => h.prompt === source.prompt && h.model === source.model);
        images = historyItem?.images || [];
        model = source.model;
    }
    
    if (index >= images.length) {
        closeFullscreen();
        return null;
    }
    
    return { images, currentIndex: index, isAsset, model };
  }

  const fullscreenData = getFullscreenData();

  const handleDownloadAll = useCallback(() => {
    const allImages: string[] = [];
    generationHistory.forEach(item => {
        allImages.push(...item.images);
    });
    if (generatedImages) {
        allImages.push(...generatedImages);
    }
    
    if (allImages.length === 0) {
        console.warn("No images to download.");
        return;
    }
    
    allImages.forEach((imageSrc, index) => {
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `generated_image_${index + 1}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  }, [generatedImages, generationHistory]);

  const hasGeneratedImages = useMemo(() => {
      const historyHasImages = generationHistory.some(item => item.images.length > 0);
      const currentHasImages = !!generatedImages && generatedImages.length > 0;
      return historyHasImages || currentHasImages;
  }, [generatedImages, generationHistory]);

  return (
    <div className="h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <header className="flex items-center justify-start px-4 py-3 bg-[#B61032] text-white shadow-md z-10 shrink-0">
        <button 
          onClick={() => setIsLeftPanelVisible(p => !p)}
          className="mr-2 p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={isLeftPanelVisible ? "Hide controls panel" : "Show controls panel"}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Logo className="h-8 w-auto" />
      </header>
      <main className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden">
        {isLeftPanelVisible && (
          <div className="md:col-span-4 lg:col-span-3 min-h-0">
            <AssetLibrary
              uploadedImages={uploadedImages}
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              onImageClick={(index) => openFullscreen({ type: 'assets' }, index)}
              freeFormText={freeFormStyleText}
              onFreeFormTextChange={setFreeFormStyleText}
              onAnalyzeStyle={handleAnalyzeStyle}
              supportivePrompt={supportivePrompt}
              onSupportivePromptChange={setSupportivePrompt}
              negativePrompt={negativePrompt}
              onNegativePromptChange={setNegativePrompt}
              styleDescription={styleDescription}
              onStyleDescriptionChange={setStyleDescription}
              isProcessingStyle={isProcessingStyle}
              statusMessage={statusMessage}
              isGeneratingSuggestions={isGeneratingSuggestions}
              suggestionsAvailable={!!(suggestedStyleDescription || suggestedNegativePrompt || suggestedSupportivePrompt)}
              onOpenSuggestionsModal={handleOpenSuggestionsModal}
              useAiStyleAnalysis={useAiStyleAnalysis}
              onUseAiStyleAnalysisChange={setUseAiStyleAnalysis}
              useStyleGuidance={useStyleGuidance}
              onUseStyleGuidanceChange={setUseStyleGuidance}
              onDownloadAll={handleDownloadAll}
              hasGeneratedImages={hasGeneratedImages}
              onOpenStyleAnalysisModal={() => setIsStyleAnalysisModalOpen(true)}
            />
          </div>
        )}
        <div className={isLeftPanelVisible ? "md:col-span-8 lg:col-span-9 min-h-0" : "md:col-span-12 min-h-0"}>
          <GenerationView
            subjectPrompt={subjectPrompt}
            onSubjectPromptChange={setSubjectPrompt}
            onGenerateImage={handleGenerateImage}
            generatedImages={generatedImages}
            isGeneratingImage={isGeneratingImage}
            isProcessingStyle={isProcessingStyle}
            generatingCount={generatingCount}
            error={error}
            isReadyToGenerate={true}
            onEditImageFromSrc={handleOpenEditorWithSrc}
            onAddToAssets={handleAddToAssets}
            addedToAssets={addedToAssets}
            onOpenFullscreen={(sourceType, index, prompt, model) => {
              if (sourceType === 'history' && prompt && model) {
                openFullscreen({ type: 'history', prompt, model }, index);
              } else if (sourceType === 'generated') {
                openFullscreen({ type: 'generated' }, index);
              }
            }}
            generationHistory={generationHistory}
            onRestoreSession={handleRestoreSession}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            removeBackground={removeBackground}
            onRemoveBackgroundChange={setRemoveBackground}
            compositionReferenceImage={compositionReferenceImage}
            compositionView={compositionView}
            onOpenCompositionReferenceModal={() => setIsCompositionReferenceModalOpen(true)}
            onRemoveCompositionReference={handleRemoveCompositionReference}
            subjectReferenceImages={subjectReferenceImages}
            onRemoveSubjectReferenceImage={handleRemoveSubjectReferenceImage}
            onOpenSubjectReferenceModal={() => setIsSubjectReferenceModalOpen(true)}
            generationModel={generationModel}
            onGenerationModelChange={setGenerationModel}
          />
        </div>
      </main>
      {isSuggestionsModalOpen && (
        <SuggestionsModal
          isOpen={isSuggestionsModalOpen}
          onClose={handleCloseSuggestionsModal}
          onApply={handleApplySuggestions}
          currentStyleDescription={styleDescription}
          suggestedStyleDescription={suggestedStyleDescription || ''}
          currentSupportivePrompt={supportivePrompt}
          suggestedSupportivePrompt={suggestedSupportivePrompt || ''}
          currentNegativePrompt={negativePrompt}
          suggestedNegativePrompt={suggestedNegativePrompt || ''}
        />
      )}
      {isStyleAnalysisModalOpen && (
        <StyleAnalysisModal
          isOpen={isStyleAnalysisModalOpen}
          onClose={() => setIsStyleAnalysisModalOpen(false)}
          styleDescription={styleDescription}
          onStyleDescriptionChange={setStyleDescription}
        />
      )}
      {isSubjectReferenceModalOpen && (
        <SubjectReferenceModal
          isOpen={isSubjectReferenceModalOpen}
          onClose={() => setIsSubjectReferenceModalOpen(false)}
          onApply={handleSetSubjectReferenceImages}
          initialImages={subjectReferenceImages}
        />
      )}
      {isCompositionReferenceModalOpen && (
        <CompositionReferenceModal
          isOpen={isCompositionReferenceModalOpen}
          onClose={() => setIsCompositionReferenceModalOpen(false)}
          onApply={handleApplyCompositionReference}
          initialImage={compositionReferenceImage}
          initialView={compositionView}
        />
      )}
      <ImageEditorModal
        isOpen={!!editingImage}
        onClose={handleCloseEditor}
        onApply={handleApplyEdit}
        image={editingImage}
        editService={editServiceWithStyle}
      />
      {fullscreenData && (
        <FullscreenViewer 
            images={fullscreenData.images}
            currentIndex={fullscreenData.currentIndex}
            isAsset={fullscreenData.isAsset}
            model={fullscreenData.model}
            onClose={closeFullscreen}
            onNavigate={handleFullscreenNav} 
            onEdit={handleOpenEditorWithSrc}
            onAddToAssets={handleAddToAssets}
            isAddedToAssets={addedToAssets}
        />
      )}
    </div>
  );
};

export default App;
