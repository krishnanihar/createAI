import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

interface ImageFile {
  name: string;
  base64: string;
  type: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Build content array
    const content: any[] = [{ type: 'text', text: prompt }];

    // Add style reference images
    if (referenceImages.length > 0) {
      content.push({ type: 'text', text: '--- STYLE REFERENCES ---' });
      for (const img of referenceImages) {
        content.push({
          type: 'image',
          image: `data:${img.type};base64,${img.base64}`,
        });
      }
    }

    // Add subject reference images
    if (subjectReferenceImages.length > 0) {
      content.push({ type: 'text', text: '--- SUBJECT REFERENCES ---' });
      for (const img of subjectReferenceImages) {
        content.push({
          type: 'image',
          image: `data:${img.type};base64,${img.base64}`,
        });
      }
    }

    // Add composition image
    if (compositionImage) {
      content.push({ type: 'text', text: '--- COMPOSITION REFERENCE ---' });
      content.push({
        type: 'image',
        image: `data:${compositionImage.type};base64,${compositionImage.base64}`,
      });
    }

    const generatedImages: string[] = [];

    // Generate images using gemini-2.5-flash-image-preview (supports image generation)
    for (let i = 0; i < numberOfImages; i++) {
      const result = await generateText({
        model: google('gemini-2.5-flash-image-preview'),
        messages: [{ role: 'user', content }],
        providerOptions: {
          google: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        },
      });

      // Extract images from files array (returned as uint8Array)
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
      return res.status(500).json({
        error: "Image generation failed. Response may have been blocked by safety filters."
      });
    }

    return res.status(200).json({ images: generatedImages });
  } catch (error: any) {
    console.error('Error generating images:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate images' });
  }
}
