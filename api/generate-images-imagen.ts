import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ai } from './_utils/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prompt,
      numberOfImages = 1,
      aspectRatio = '1:1'
    } = req.body as {
      prompt: string;
      numberOfImages?: number;
      aspectRatio?: string;
    };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: numberOfImages,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      return res.status(500).json({ error: "Imagen generation failed to produce any images. The prompt may have been blocked." });
    }

    const images = response.generatedImages.map(img => img.image.imageBytes);
    return res.status(200).json({ images });
  } catch (error) {
    console.error('Error generating images with Imagen:', error);
    return res.status(500).json({ error: 'Failed to generate images with Imagen' });
  }
}
