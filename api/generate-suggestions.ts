import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

interface ImageFile {
  name: string;
  base64: string;
  type: string;
}

const suggestionsSchema = z.object({
  suggestedStyleDescription: z.string(),
  suggestedPositivePrompt: z.string(),
  suggestedNegativePrompt: z.string(),
});

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

    const content: any[] = [
      {
        type: 'text',
        text: `Compare the GENERATED image to the REFERENCE images. Identify style deviations and provide improved prompts.
Current style: ${currentStyleDescription}
Current positive prompt: ${currentPositivePrompt}
Current negative prompt: ${currentNegativePrompt}`
      },
      { type: 'text', text: '--- REFERENCE IMAGES ---' },
    ];

    for (const img of referenceImages) {
      content.push({
        type: 'image',
        image: `data:${img.type};base64,${img.base64}`,
      });
    }

    content.push({ type: 'text', text: '--- GENERATED IMAGE ---' });
    content.push({
      type: 'image',
      image: `data:${generatedImage.type};base64,${generatedImage.base64}`,
    });

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      messages: [{ role: 'user', content }],
      schema: suggestionsSchema,
    });

    return res.status(200).json(result.object);
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate suggestions' });
  }
}
