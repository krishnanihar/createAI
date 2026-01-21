import { GoogleGenAI, Type, Modality } from "@google/genai";

// Lazy initialization to avoid module-level errors
let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set. Please add it in Vercel project settings.");
    }
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

export const GENERATION_INPUT_MAX_DIMENSION = 1024;

export const STYLE_EXTRACTION_PROMPT = `You are a world-renowned art historian with a specialty in digital art forensics. Your mission is to analyze the provided images and distill their "Style DNA"—a highly detailed, structured description of their unique artistic fingerprint.
You must completely IGNORE the subject matter and focus exclusively on the aesthetic and technical execution.
Your analysis must be output as a JSON object that strictly adheres to the provided schema. Be incredibly thorough and perceptive in your descriptions.

Key directives for your analysis:
- **Overall Aesthetic:** Capture the essence, the immediate feeling, and the genre of the style. What is its soul?
- **Color Palette:** Go beyond simple hex codes. Describe the color harmony, the temperature, the mood the colors create, and their interplay. Analyze color weight and proportion—is one color dominant, or is it a balanced palette?
- **Material & Texture:** Think like a physicist. Describe the surfaces. How do they interact with light? Are they rough, smooth, viscous, ethereal? What tools (digital or physical) might have created these textures?
- **Lighting:** Is the light a gentle narrator or a dramatic spotlight? Describe its quality, direction, color, and the emotional atmosphere it creates. Identify subtle effects like caustics, subsurface scattering, or volumetric light.
- **Composition:** Analyze the visual architecture. How are elements arranged? Is there a clear focal point? Describe the balance, rhythm, and flow. What is the underlying "shape language"? Assess the overall complexity: is the composition minimal with a lot of negative space, or is it dense, complex, and detailed?
- **Post-Processing:** Identify the final touches that unify the piece. Is there film grain, chromatic aberration, a specific type of bloom, or a unique color grading LUT applied?

Every field in the JSON schema must be populated with a rich, detailed analysis that would allow another artist to replicate this style perfectly.`;

export const TEXT_TO_STYLE_PROMPT = `You are an expert art style analyst. Your task is to read the user's free-form description of an art style and convert it into a structured JSON object that strictly adheres to the provided schema.

Extract all relevant details directly from the provided text. Populate the corresponding fields in the JSON only with information that is explicitly mentioned. If a specific detail is not present in the text, you MUST leave the corresponding field in the JSON object as an empty string or an empty array. Do NOT infer, guess, or add any information that is not directly stated in the user's description.

The user's description is provided. Analyze it carefully and generate the JSON output based *only* on the given text.`;

export const styleSchema = {
    type: Type.OBJECT,
    properties: {
      overallAesthetic: {
        type: Type.STRING,
        description: "A concise summary of the overall style and mood (e.g., photorealistic 3D render, whimsical watercolor, retro comic book)."
      },
      colorPalette: {
        type: Type.OBJECT,
        description: "Detailed analysis of the color usage.",
        properties: {
          dominantColors: {
            type: Type.ARRAY,
            description: "An array of dominant hex color codes found in the image.",
            items: { type: Type.STRING }
          },
          accentColors: {
            type: Type.ARRAY,
            description: "An array of accent hex color codes.",
            items: { type: Type.STRING }
          },
          usageDescription: {
            type: Type.STRING,
            description: "Describe how colors are used (e.g., fills, strokes, gradients) and the overall color harmony and temperature (warm, cool, muted, vibrant)."
          },
          colorWeight: {
            type: Type.STRING,
            description: "Describe the balance and proportion of colors. Is there one color that dominates, or is it a more even distribution?"
          },
        },
        required: ["dominantColors", "accentColors", "usageDescription", "colorWeight"],
      },
      materialAndTexture: {
        type: Type.OBJECT,
        description: "Analysis of surface qualities.",
        properties: {
          material: {
            type: Type.STRING,
            description: "Describe the depicted material (e.g., glass, metal, paper, fabric)."
          },
          surfaceTexture: {
            type: Type.STRING,
            description: "Describe the texture (e.g., smooth, polished, rough, painterly, gritty)."
          },
          brushwork: {
              type: Type.STRING,
              description: "Describe any visible brushwork or stroke style (e.g., digital, clean lines, textured strokes)."
          }
        },
        required: ["material", "surfaceTexture", "brushwork"],
      },
      lighting: {
        type: Type.OBJECT,
        description: "Analysis of the lighting.",
        properties: {
          style: {
            type: Type.STRING,
            description: "Describe the lighting style (e.g., studio HDRI, dramatic, soft, flat, rim lighting)."
          },
          effects: {
            type: Type.ARRAY,
            description: "List any notable lighting effects observed (e.g., reflections, refractions, bloom, dispersion).",
            items: { type: Type.STRING }
          }
        },
        required: ["style", "effects"],
      },
      composition: {
          type: Type.OBJECT,
          description: "Analysis of composition and form.",
          properties: {
              shapeLanguage: {
                  type: Type.STRING,
                  description: "Describe the nature of shapes used (e.g., geometric, organic, sharp, soft)."
              },
              depthAndPerspective: {
                  type: Type.STRING,
                  description: "How is depth created (e.g., shading, layering, atmospheric effects)?"
              },
              complexity: {
                  type: Type.STRING,
                  description: "Describe the visual complexity, from 'minimalist' to 'highly detailed and dense'."
              }
          },
          required: ["shapeLanguage", "depthAndPerspective", "complexity"],
      },
      postProcessingEffects: {
          type: Type.ARRAY,
          description: "List any post-processing effects detected (e.g., chromatic aberration, glow, high contrast, vignette).",
          items: { type: Type.STRING }
      }
    },
    required: ["overallAesthetic", "colorPalette", "materialAndTexture", "lighting", "composition", "postProcessingEffects"]
};

export const SUGGESTION_GENERATION_PROMPT = `You are an exacting AI Art Director, and your sole purpose is to ensure perfect style replication. A junior artist has attempted to replicate a style defined by a set of REFERENCE images, producing a GENERATED image. The attempt has failed to capture the style's true essence.

Your task is to conduct a rigorous forensic analysis comparing the GENERATED image to the core "Style DNA" of the REFERENCE images. Identify every single deviation, no matter how subtle. Explain *why* these deviations break the style.

Based on this forensic analysis, your output must be a JSON object with three critical corrections to guide the artist's next attempt:
1. 'suggestedStyleDescription': Take the user's current JSON style description and surgically modify it. Do not rewrite it from scratch. Refine the descriptions, add missing nuances, and correct inaccuracies to make it a perfect representation of the REFERENCE style. The goal is precision.
2. 'suggestedPositivePrompt': Enhance the user's current positive prompt. Add specific, targeted keywords that will better align the output with the core style, focusing on qualities present in the REFERENCE images but missed in the GENERATED one.
3. 'suggestedNegativePrompt': Enhance the user's current negative prompt. Add specific, targeted keywords that will actively suppress the stylistic errors you identified in the GENERATED image. Be direct and unambiguous.`;

export interface ImageFile {
  name: string;
  base64: string;
  type: string;
}

export { Type, Modality };
