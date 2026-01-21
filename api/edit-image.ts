import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAI, Modality, ImageFile } from './_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = getAI();

    const {
      prompt,
      image,
      mask,
      styleDescription
    } = req.body as {
      prompt: string;
      image: ImageFile;
      mask: ImageFile;
      styleDescription: string;
    };

    const fullPrompt = `**Task**: Edit the provided image within the masked area.

**Style Mandate**: The edits MUST EXACTLY match the artistic style of the unmasked parts of the image. The style description below is a guide to help understand the key elements of the style. The original image is the definitive source for the style.

**Style Description (from AI analysis)**:
${styleDescription}

**Edit Instruction**: Apply the following instruction to the masked area ONLY: "${prompt}".

The rest of the image outside the mask must remain completely unchanged.`;

    const imagePart = { inlineData: { data: image.base64, mimeType: image.type } };
    const maskPart = { inlineData: { data: mask.base64, mimeType: mask.type } };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: fullPrompt },
          imagePart,
          maskPart
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return res.status(200).json({ image: part.inlineData.data });
        }
      }
    }

    console.error("Image editing failed. Response might have been blocked.", response);
    return res.status(500).json({ error: "Image editing failed to produce an image. The response may have been blocked due to safety settings." });
  } catch (error: any) {
    console.error('Error editing image:', error);
    return res.status(500).json({ error: error.message || 'Failed to edit image' });
  }
}
