import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================================
// Bug #4b FIX: trust proxy obrigatório no Codespaces/Railway/Render
// Sem isso o express-rate-limit lança ValidationError porque
// detecta X-Forwarded-For mas não sabe se deve confiar nele.
// ============================================================
app.set('trust proxy', 1);

const API_KEY = process.env.GEMINI_API_KEY;
const API_CALL_TIMEOUT_MS = 60000;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

// MODELO CONFIRMADO — ai.google.dev (fev/2026)
// ⚠️  REQUER billing ativo na chave — free tier tem limit: 0
const IMAGE_MODEL_FREE = 'gemini-2.5-flash-image';

console.log('✅ Server initialized');
console.log(`🤖 FREE model: ${IMAGE_MODEL_FREE}`);
console.log(`⚠️  Este modelo requer API Key com billing ativo`);

const upscaleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  // validate false apenas desliga o aviso — trust proxy acima resolve o problema real
  validate: { xForwardedForHeader: false },
  message: { error: 'Muitas requisições. Aguarde 1 minuto e tente novamente.' },
  handler: (req, res, next, options) => {
    console.warn(`⚠️  Rate limit atingido para IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});

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

app.post('/api/upscale', upscaleLimiter, async (req: Request, res: Response) => {
  try {
    const {
      base64ImageData,
      mimeType,
      enhanceFaces,
      quality,
      aspectRatio = '1:1',
    } = req.body as UpscaleRequest;

    if (!base64ImageData || !mimeType) {
      return res.status(400).json({ error: 'Missing image data or mimeType' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const RestorationPrompt = `You are a dedicated Super-Resolution AI. Your task is to upscale the provided image by 2x while aggressively MAXIMIZING SHARPNESS and micro-details.

MANDATORY RULES:
1. MAX SHARPNESS: Eliminate any blur. Enhance edge contrast and crisply define micro-textures (such as denim fabric weave, threads, and paper grain). The output must be mathematically sharper than the original.
2. STRICT TEXT/LOGO PRESERVATION: Do NOT redraw, alter, or hallucinate lettering. Instead, intensely sharpen the existing pixels of text and logos.
3. COLOR CONSTANCY: Keep the exact original hues, exposure, and lighting. No color shifting.`;

    const qualityInstructions: Record<string, string> = {
      Standard: '',
      High: '\nApply strong enhancement to edges.',
      Professional: '\nExecute premium master reconstruction for maximum-sharpness and photorealistic macro-details.',
    };

    let promptText = RestorationPrompt + '\n' + (qualityInstructions[quality] || '');

    if (enhanceFaces) {
      promptText += `\nFace Restoration: Reconstruct natural skin textures and eye details carefully.`;
    }

    const imageSize = quality === 'Professional' ? '2K' : '1K';

    const generateParams: any = {
      model: IMAGE_MODEL_FREE,
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType } },
          { text: promptText },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    };

    console.log(`📤 FREE upscale | quality: ${quality} | ratio: ${aspectRatio} | size: ${imageSize}`);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('API call timed out after 60 seconds.')),
        API_CALL_TIMEOUT_MS,
      ),
    );

    const response = await Promise.race([
      ai.models.generateContent(generateParams),
      timeoutPromise,
    ]);

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      return res.status(500).json({ error: 'No content parts found in the response.' });
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        console.log('✅ FREE upscale completed');
        return res.json({
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        } as UpscaleResponse);
      }
    }

    return res.status(500).json({ error: 'No image data in response' });

  } catch (error: any) {
    const msg: string = error?.message || 'Upscale failed';
    console.error('❌ Upscale error:', error);

    // Erro de quota — mensagem clara para o usuário
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return res.status(429).json({
        error: 'Quota da API esgotada. Este modelo requer uma API Key com billing ativo. Acesse https://aistudio.google.com/apikeys para configurar.',
      });
    }

    return res.status(500).json({ error: msg });
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', freeModel: IMAGE_MODEL_FREE });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});