import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAI, STYLE_EXTRACTION_PROMPT, TEXT_TO_STYLE_PROMPT, styleSchema, ImageFile } from './_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ai = getAI();

    const { images, textDescription } = req.body as {
      images: ImageFile[];
      textDescription?: string;
    };

    // If only text description provided (no images), use text-to-style prompt
    if (!images || images.length === 0) {
      if (!textDescription) {
        return res.status(400).json({ error: 'Either images or textDescription required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: TEXT_TO_STYLE_PROMPT }, { text: textDescription }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: styleSchema,
        },
      });

      const jsonStr = response.text.trim();
      try {
        const jsonObj = JSON.parse(jsonStr);
        return res.status(200).json({ styleDescription: JSON.stringify(jsonObj, null, 2) });
      } catch {
        return res.status(200).json({ styleDescription: jsonStr });
      }
    }

    // With images - use style extraction prompt
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64,
        mimeType: image.type,
      },
    }));

    const parts: any[] = [{ text: STYLE_EXTRACTION_PROMPT }];
    if (textDescription) {
      parts.push({ text: `Additional context provided by user: "${textDescription}". Incorporate this into your analysis of the images.` });
    }
    parts.push(...imageParts);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: styleSchema,
      },
    });

    const jsonStr = response.text.trim();
    try {
      const jsonObj = JSON.parse(jsonStr);
      return res.status(200).json({ styleDescription: JSON.stringify(jsonObj, null, 2) });
    } catch {
      return res.status(200).json({ styleDescription: jsonStr });
    }
  } catch (error: any) {
    console.error('Error generating style description:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate style description' });
  }
}
