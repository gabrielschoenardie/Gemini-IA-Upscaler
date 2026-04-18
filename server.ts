import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const API_KEY = process.env.GEMINI_API_KEY;
const API_CALL_TIMEOUT_MS = 60000;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ Server initialized with Gemini API Key');

interface UpscaleRequest {
  base64ImageData: string;
  mimeType: string;
  enhanceFaces: boolean;
  quality: 'Standard' | 'High' | 'Professional';
  aspectRatio?: string;
}

interface UpscaleResponse {
  data: string;
  mimeType: string;
}

app.post('/api/upscale', async (req: Request, res: Response) => {
  try {
    const { base64ImageData, mimeType, enhanceFaces, quality, aspectRatio = "1:1" } = req.body as UpscaleRequest;

    if (!base64ImageData || !mimeType) {
      return res.status(400).json({ error: 'Missing image data or mimeType' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const modelName = 'gemini-2.5-flash-image';

    const RestorationPrompt = `You are a dedicated Super-Resolution AI. Your task is to upscale the provided image by 2x while aggressively MAXIMIZING SHARPNESS and micro-details.

MANDATORY RULES:
1. MAX SHARPNESS: Eliminate any blur. Enhance edge contrast and crisply define micro-textures (such as denim fabric weave, threads, and paper grain). The output must be mathematically sharper than the original.
2. STRICT TEXT/LOGO PRESERVATION: Do NOT redraw, alter, or hallucinate lettering. Instead, intensely sharpen the existing pixels of text and logos.
3. COLOR CONSTANCY: Keep the exact original hues, exposure, and lighting. No color shifting.`;

    let promptText = RestorationPrompt;

    const qualityInstructions = {
      Standard: "",
      High: "\nApply strong enhancement to edges.",
      Professional: "\nExecute premium master reconstruction for maximum-sharpness and photorealistic macro-details."
    };

    promptText += "\n" + (qualityInstructions[quality as keyof typeof qualityInstructions] || "");

    if (enhanceFaces) {
      promptText += `\nFace Restoration: Reconstruct natural skin textures and eye details carefully.`;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`API call timed out after 60 seconds.`)), API_CALL_TIMEOUT_MS)
    );

    const generateParams: any = {
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: promptText },
        ],
      },
    };

    const response = await Promise.race([
      ai.models.generateContent(generateParams),
      timeoutPromise
    ]);

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return res.status(500).json({ error: "No content parts found in the response." });
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return res.json({
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        } as UpscaleResponse);
      }
    }

    return res.status(500).json({ error: "No image data in response" });

  } catch (error: any) {
    console.error('Upscale error:', error);
    return res.status(500).json({ error: error.message || 'Upscale failed' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
