import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAI, getModality, ImageFile } from './_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = await getAI();
    const Modality = await getModality();

    const {
      prompt,
      referenceImages = [],
      numberOfImages = 1,
      compositionImage = null,
      subjectReferenceImages = []
    } = req.body as {
      prompt: string;
      referenceImages?: ImageFile[];
      numberOfImages?: number;
      compositionImage?: ImageFile | null;
      subjectReferenceImages?: ImageFile[];
    };

    const parts: any[] = [];

    // 1. Add the main prompt/instructions
    parts.push({ text: prompt });

    // 2. Style Images
    if (referenceImages.length > 0) {
      parts.push({ text: "--- STYLE REFERENCE IMAGES START --- \n The following images are the STYLE REFERENCES mentioned in the prompt. Use their art style." });
      referenceImages.forEach(image => {
        parts.push({
          inlineData: { data: image.base64, mimeType: image.type }
        });
      });
      parts.push({ text: "--- STYLE REFERENCE IMAGES END ---" });
    }

    // 3. Subject Images
    if (subjectReferenceImages.length > 0) {
      parts.push({ text: "--- SUBJECT REFERENCE IMAGES START --- \n The following images are the SUBJECT REFERENCES mentioned in the prompt. Use their subject matter, features, and characteristics." });
      subjectReferenceImages.forEach(image => {
        parts.push({
          inlineData: { data: image.base64, mimeType: image.type }
        });
      });
      parts.push({ text: "--- SUBJECT REFERENCE IMAGES END ---" });
    }

    // 4. Composition Image
    if (compositionImage) {
      parts.push({ text: "--- COMPOSITION REFERENCE IMAGE START --- \n The following image is the COMPOSITION REFERENCE. Use its layout and perspective." });
      parts.push({
        inlineData: { data: compositionImage.base64, mimeType: compositionImage.type }
      });
      parts.push({ text: "--- COMPOSITION REFERENCE IMAGE END ---" });
    }

    const generationPromises = [];
    for (let i = 0; i < numberOfImages; i++) {
      generationPromises.push(ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      }));
    }

    const responses = await Promise.all(generationPromises);
    const generatedImages: string[] = [];

    for (const response of responses) {
      if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImages.push(part.inlineData.data);
            break;
          }
        }
      } else {
        console.warn("A generation response was missing content, possibly due to safety filters.", response);
      }
    }

    if (generatedImages.length === 0 && numberOfImages > 0) {
      return res.status(500).json({ error: "Image generation failed to produce any images. The response may have been blocked due to safety settings." });
    }

    return res.status(200).json({ images: generatedImages });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate images' });
  }
}
