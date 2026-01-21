import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

interface ImageFile {
  name: string;
  base64: string;
  type: string;
}

const styleSchema = z.object({
  overallAesthetic: z.string(),
  colorPalette: z.object({
    dominantColors: z.array(z.string()),
    accentColors: z.array(z.string()),
    usageDescription: z.string(),
    colorWeight: z.string(),
  }),
  materialAndTexture: z.object({
    material: z.string(),
    surfaceTexture: z.string(),
    brushwork: z.string(),
  }),
  lighting: z.object({
    style: z.string(),
    effects: z.array(z.string()),
  }),
  composition: z.object({
    shapeLanguage: z.string(),
    depthAndPerspective: z.string(),
    complexity: z.string(),
  }),
  postProcessingEffects: z.array(z.string()),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, textDescription } = req.body as {
      images: ImageFile[];
      textDescription?: string;
    };

    const content: any[] = [];

    if (!images || images.length === 0) {
      if (!textDescription) {
        return res.status(400).json({ error: 'Either images or textDescription required' });
      }
      content.push({
        type: 'text',
        text: `Convert this art style description into structured format: ${textDescription}`
      });
    } else {
      content.push({
        type: 'text',
        text: `Analyze these images and extract their "Style DNA". Focus on aesthetic/technical execution, ignore subject matter.${textDescription ? ` Additional context: ${textDescription}` : ''}`
      });
      for (const img of images) {
        content.push({
          type: 'image',
          image: `data:${img.type};base64,${img.base64}`,
        });
      }
    }

    const result = await generateObject({
      model: google('gemini-2.0-flash'),
      messages: [{ role: 'user', content }],
      schema: styleSchema,
    });

    return res.status(200).json({
      styleDescription: JSON.stringify(result.object, null, 2)
    });
  } catch (error: any) {
    console.error('Error generating style:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate style' });
  }
}
