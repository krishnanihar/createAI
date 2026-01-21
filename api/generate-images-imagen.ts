import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, numberOfImages = 1 } = req.body as {
      prompt: string;
      numberOfImages?: number;
      aspectRatio?: string;
    };

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generatedImages: string[] = [];

    for (let i = 0; i < numberOfImages; i++) {
      const result = await generateText({
        model: google('gemini-2.5-flash-image'),
        messages: [{ role: 'user', content: prompt }],
        providerOptions: {
          google: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        },
      });

      if (result.files && result.files.length > 0) {
        for (const file of result.files) {
          if (file.uint8Array) {
            const base64 = Buffer.from(file.uint8Array).toString('base64');
            generatedImages.push(base64);
          } else if (file.base64) {
            generatedImages.push(file.base64);
          }
        }
      }
    }

    if (generatedImages.length === 0) {
      return res.status(500).json({ error: "Image generation failed. Prompt may have been blocked." });
    }

    return res.status(200).json({ images: generatedImages });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate images' });
  }
}
