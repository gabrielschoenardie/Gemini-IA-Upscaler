import { GoogleGenAI } from '@google/genai';

const API_CALL_TIMEOUT_MS = 60000;

// ============================================================
// BACKEND_URL CORRIGIDO
//
// ANTES: const BACKEND_URL = '/api'
//   → fetch('/api/upscale') via Vite proxy → localhost:3001/api/upscale
//   → mas server.ts tem /api/upscale → ok no dev, quebra em produção
//
// AGORA: usa VITE_BACKEND_URL do .env.local (http://localhost:3001)
//   → fetch('http://localhost:3001/upscale')
//   → server.ts tem /upscale ✅ consistente em dev e produção
// ============================================================
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const IMAGE_MODEL_FREE = 'gemini-2.5-flash-image';
const IMAGE_MODEL_PRO  = 'gemini-3-pro-image-preview';

export type UpscaleTier = 'Standard' | 'Pro';

export interface UpscaleResponse {
  data: string;
  mimeType: string;
}

// FREE TIER — chama o backend Express
export const upscaleImageByBackend = async (
  base64ImageData: string,
  mimeType: string,
  enhanceFaces: boolean,
  quality: 'Standard' | 'High' | 'Professional',
  aspectRatio: string = '1:1',
): Promise<UpscaleResponse> => {
  try {
    console.log(`📤 FREE → ${BACKEND_URL}/upscale (${IMAGE_MODEL_FREE})`);

    const response = await fetch(`${BACKEND_URL}/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64ImageData, mimeType, enhanceFaces, quality, aspectRatio }),
      signal: AbortSignal.timeout(API_CALL_TIMEOUT_MS),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Backend error: ${response.statusText}`);
    }

    const data = (await response.json()) as UpscaleResponse;
    console.log('✅ FREE upscale completed');
    return data;

  } catch (error: any) {
    const msg: string = error?.message || 'Unknown error';
    console.error('❌ Backend error:', msg);

    if (msg.includes('timeout') || msg.includes('Abort')) {
      throw new Error('Upscale timed out after 60s. Try a smaller image or lower quality.');
    }
    if (msg.includes('Connection refused') || msg.includes('Failed to fetch')) {
      throw new Error(`Backend não encontrado em ${BACKEND_URL}. Verifique se o servidor está rodando.`);
    }
    throw new Error(msg);
  }
};

// PRO TIER — chama a API Gemini diretamente via window.aistudio
export const upscaleImage = async (
  base64ImageData: string,
  mimeType: string,
  enhanceFaces: boolean,
  quality: 'Standard' | 'High' | 'Professional',
  tier: UpscaleTier,
  aspectRatio: string = '1:1',
): Promise<UpscaleResponse> => {
  if (tier === 'Standard') {
    return upscaleImageByBackend(base64ImageData, mimeType, enhanceFaces, quality, aspectRatio);
  }

  try {
    console.log(`📤 PRO → API direta (${IMAGE_MODEL_PRO})`);

    const ai = new GoogleGenAI({ apiKey: undefined as any });

    const RestorationPrompt =
      quality === 'Professional'
        ? `You are an elite Super-Resolution AI at Premium Master level.
Upscale this image by 2x, INTELLIGENTLY RECONSTRUCTING photorealistic micro-details.

MANDATORY RULES:
1. MACRO-TEXTURE INJECTION: Add hyper-realistic micro-textures per material (fabric weaves, skin pores).
2. RAW SHARPNESS: Eliminate AI smoothing. Deliver Hasselblad-aesthetic raw micro-contrast.
3. CONTEXTUAL FAITHFULNESS: Preserve exact structure, hues, text/logos, and lighting.`
        : `You are a dedicated Super-Resolution AI. Upscale this image by 2x, MAXIMIZING SHARPNESS.

MANDATORY RULES:
1. MAX SHARPNESS: Eliminate blur, enhance edge contrast, define micro-textures.
2. TEXT/LOGO PRESERVATION: Do NOT redraw lettering. Sharpen existing pixels only.
3. COLOR CONSTANCY: Keep exact original hues, exposure, and lighting.`;

    const qualityInstructions: Record<string, string> = {
      Standard: '',
      High: '\nApply strong enhancement to edges.',
      Professional: '\nExecute premium master reconstruction for maximum-sharpness and photorealistic details.',
    };

    let promptText =
      `${RestorationPrompt}\nDeliver extreme sharpness and high-definition texture fidelity.` +
      '\n' + qualityInstructions[quality];

    if (enhanceFaces) {
      promptText += `\nFace Restoration: Reconstruct natural skin textures and eye details carefully.`;
    }

    const imageSize = quality === 'Professional' ? '4K' : '2K';

    const generateParams: any = {
      model: IMAGE_MODEL_PRO,
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType } },
          { text: promptText },
        ],
      },
      config: {
        imageConfig: { aspectRatio, imageSize },
      },
    };

    console.log(`   ratio: ${aspectRatio} | size: ${imageSize}`);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('API call timed out after 60 seconds.')), API_CALL_TIMEOUT_MS),
    );

    const response = await Promise.race([
      ai.models.generateContent(generateParams),
      timeoutPromise,
    ]);

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content parts found in the response.');
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType) {
        console.log('✅ PRO upscale completed');
        return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }

    throw new Error('The AI model returned no image data.');

  } catch (error: any) {
    const msg: string = error?.message || '';
    console.error('❌ PRO error:', msg);

    if (msg.includes('timed out')) throw new Error('PRO timed out. Try smaller image or Standard quality.');
    if (msg.includes('API_KEY') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      throw new Error('Pro Mode requires a valid Paid API Key. Check your AI Studio settings.');
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      throw new Error('Quota limit reached. Wait a few minutes or check your billing.');
    }
    if (msg.includes('404') || msg.includes('NOT_FOUND')) {
      throw new Error('Model unavailable in your region.');
    }
    if (msg.includes('safety') || msg.includes('SAFETY')) {
      throw new Error('Image flagged by safety filters.');
    }

    throw new Error(msg || 'Unexpected PRO error. Please try again.');
  }
};