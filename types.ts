
export type GenerationModel = 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001';

export interface ImageFile {
  name: string;
  base64: string;
  type: string;
}

export interface GenerationSessionState {
    uploadedImages: ImageFile[];
    freeFormStyleText: string;
    styleDescription: string;
    subjectPrompt: string;
    supportivePrompt: string;
    negativePrompt: string;
    aspectRatio: string;
    removeBackground: boolean;
    compositionReferenceImage: ImageFile | null;
    compositionView: string | null;
    subjectReferenceImages: ImageFile[];
    generationModel: GenerationModel;
    useAiStyleAnalysis: boolean;
    useStyleGuidance: boolean;
}

export interface GenerationSession {
    id: string;
    timestamp: number;
    prompt: string;
    images: string[];
    model: GenerationModel;
    state: GenerationSessionState;
}
