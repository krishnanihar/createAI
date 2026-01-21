import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai, SUGGESTION_GENERATION_PROMPT, Type, ImageFile } from './_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      referenceImages,
      generatedImage,
      currentStyleDescription,
      currentPositivePrompt,
      currentNegativePrompt
    } = req.body as {
      referenceImages: ImageFile[];
      generatedImage: ImageFile;
      currentStyleDescription: string;
      currentPositivePrompt: string;
      currentNegativePrompt: string;
    };

    const referenceImageParts = referenceImages.map(image => ({
      inlineData: { data: image.base64, mimeType: image.type },
    }));

    const generatedImagePart = {
      inlineData: { data: generatedImage.base64, mimeType: generatedImage.type },
    };

    const textContent = `${SUGGESTION_GENERATION_PROMPT}

The user's current style description is: "${currentStyleDescription}"
The user's current positive prompt is: "${currentPositivePrompt}"
The user's current negative prompt is: "${currentNegativePrompt}"
`;

    const parts = [
      { text: textContent },
      { text: "== REFERENCE IMAGES START ==" },
      ...referenceImageParts,
      { text: "== REFERENCE IMAGES END ==" },
      { text: "== GENERATED IMAGE START ==" },
      generatedImagePart,
      { text: "== GENERATED IMAGE END ==" },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedStyleDescription: {
              type: Type.STRING,
              description: "The improved style description in a valid, pretty-printed JSON string format."
            },
            suggestedPositivePrompt: {
              type: Type.STRING,
              description: "The improved positive prompt."
            },
            suggestedNegativePrompt: {
              type: Type.STRING,
              description: "The improved negative prompt."
            }
          },
          required: ["suggestedStyleDescription", "suggestedPositivePrompt", "suggestedNegativePrompt"],
        },
      },
    });

    const jsonStr = response.text.trim();
    const suggestions = JSON.parse(jsonStr);
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}
