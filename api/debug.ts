import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const diagnostics: any = {
    nodeVersion: process.version,
    hasApiKey: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    env: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY') && !k.includes('TOKEN')),
  };

  // Try to dynamically import @google/genai
  try {
    diagnostics.importAttempt = 'starting';
    const genai = await import('@google/genai');
    diagnostics.importAttempt = 'success';
    diagnostics.genaiKeys = Object.keys(genai);

    // Try to create client
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        diagnostics.clientCreated = true;
        diagnostics.aiMethods = Object.keys(ai);
      } catch (clientError: any) {
        diagnostics.clientCreated = false;
        diagnostics.clientError = clientError.message;
      }
    }
  } catch (importError: any) {
    diagnostics.importAttempt = 'failed';
    diagnostics.importError = importError.message;
    diagnostics.importStack = importError.stack;
  }

  return res.status(200).json(diagnostics);
}
