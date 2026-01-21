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
    const { prompt, image, mask, styleDescription } = req.body as {
      prompt: string;
      image: ImageFile;
      mask: ImageFile;
      styleDescription: string;
    };

    const content: any[] = [
      {
        type: 'text',
        text: `Edit the image within the masked area. Match the artistic style of the unmasked parts.
Style: ${styleDescription}
Edit instruction: ${prompt}
Keep unmasked areas unchanged.`
      },
      {
        type: 'image',
        image: `data:${image.type};base64,${image.base64}`,
      },
      {
        type: 'image',
        image: `data:${mask.type};base64,${mask.base64}`,
      },
    ];

    const result = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [{ role: 'user', content }],
      providerOptions: {
        google: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      },
    });

    if (result.files && result.files.length > 0) {
      const file = result.files[0];
      const base64 = file.base64 || (file.uint8Array ? Buffer.from(file.uint8Array).toString('base64') : null);
      if (base64) {
        return res.status(200).json({ image: base64 });
      }
    }

    return res.status(500).json({ error: "Image editing failed. Response may have been blocked." });
  } catch (error: any) {
    console.error('Error editing image:', error);
    return res.status(500).json({ error: error.message || 'Failed to edit image' });
  }
}
