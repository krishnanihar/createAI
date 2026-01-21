import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// Check API key
export function checkApiKey() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable not set");
  }
}

// Style schema for Zod validation
export const styleSchema = z.object({
  overallAesthetic: z.string().describe("A concise summary of the overall style and mood"),
  colorPalette: z.object({
    dominantColors: z.array(z.string()).describe("Array of dominant hex color codes"),
    accentColors: z.array(z.string()).describe("Array of accent hex color codes"),
    usageDescription: z.string().describe("How colors are used and overall harmony"),
    colorWeight: z.string().describe("Balance and proportion of colors"),
  }),
  materialAndTexture: z.object({
    material: z.string().describe("Depicted material type"),
    surfaceTexture: z.string().describe("Texture description"),
    brushwork: z.string().describe("Brushwork or stroke style"),
  }),
  lighting: z.object({
    style: z.string().describe("Lighting style"),
    effects: z.array(z.string()).describe("Notable lighting effects"),
  }),
  composition: z.object({
    shapeLanguage: z.string().describe("Nature of shapes used"),
    depthAndPerspective: z.string().describe("How depth is created"),
    complexity: z.string().describe("Visual complexity level"),
  }),
  postProcessingEffects: z.array(z.string()).describe("Post-processing effects detected"),
});

export const STYLE_EXTRACTION_PROMPT = `Analyze the provided images and extract their "Style DNA" - a detailed description of their artistic fingerprint.
Focus ONLY on aesthetic and technical execution, ignore subject matter.
Analyze: overall aesthetic, color palette, material/texture, lighting, composition, and post-processing effects.`;

export const TEXT_TO_STYLE_PROMPT = `Convert the user's art style description into a structured format.
Only include information explicitly mentioned. Leave empty if not specified.`;

export const SUGGESTION_GENERATION_PROMPT = `Compare the GENERATED image to the REFERENCE images and identify style deviations.
Provide improved: styleDescription (JSON), positivePrompt, and negativePrompt to better match the reference style.`;

export interface ImageFile {
  name: string;
  base64: string;
  type: string;
}

// Helper to create image content for AI SDK
export function createImageContent(image: ImageFile) {
  return {
    type: 'image' as const,
    image: `data:${image.type};base64,${image.base64}`,
  };
}

// Get the Google model for text/analysis
export function getTextModel() {
  return google('gemini-2.0-flash');
}

// Get the Google model for image generation
export function getImageModel() {
  return google('gemini-2.0-flash-exp', {
    useSearchGrounding: false,
  });
}
