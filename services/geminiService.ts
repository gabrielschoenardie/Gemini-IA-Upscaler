import { GoogleGenAI } from '@google/genai';

const API_CALL_TIMEOUT_MS = 60000;
const BACKEND_URL = '/api';

// ============================================================
// MODELOS CONFIRMADOS — ai.google.dev/gemini-api/docs/models
// Documentação oficial atualizada em fevereiro 2026
//
// FREE  → gemini-2.5-flash-image        (estável, geração nativa)
// PRO   → gemini-3-pro-image-preview    (preview pago, qualidade estúdio)
//
// PROBLEMA ORIGINAL: o app usava o mesmo modelo em ambos os tiers,
// o usuário pagava pela chave PRO mas recebia resultado do FREE.
// ============================================================
const IMAGE_MODEL_FREE = 'gemini-2.5-flash-image';
const IMAGE_MODEL_PRO  = 'gemini-3-pro-image-preview';

export type UpscaleTier = 'Standard' | 'Pro';

export interface UpscaleResponse {
  data: string;
  mimeType: string;
}

// FREE TIER: chama o backend Express (API key protegida no servidor)
export const upscaleImageByBackend = async (
  base64ImageData: string,
  mimeType: string,
  enhanceFaces: boolean,
  quality: 'Standard' | 'High' | 'Professional',
  aspectRatio: string = '1:1',
): Promise<UpscaleResponse> => {
  try {
    console.log(`📤 FREE tier → backend (${IMAGE_MODEL_FREE})`);

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
    // Bug #6 FIX: guard obrigatório — error.message pode ser undefined
    const msg: string = error?.message || 'Unknown error';
    console.error('❌ Backend upscale error:', msg);

    if (msg.includes('timeout') || msg.includes('Abort')) {
      throw new Error('Upscale timed out after 60s. Try a smaller image or lower quality.');
    }
    if (msg.includes('Connection refused') || msg.includes('Failed to fetch')) {
      throw new Error('Backend not running. Start with: npm run server');
    }
    throw new Error(msg);
  }
};

// PRO TIER: chama a API Gemini diretamente com a chave do usuário
export const upscaleImage = async (
  base64ImageData: string,
  mimeType: string,
  enhanceFaces: boolean,
  quality: 'Standard' | 'High' | 'Professional',
  tier: UpscaleTier,
  aspectRatio: string = '1:1',
): Promise<UpscaleResponse> => {
  // Redireciona Standard para o backend FREE
  if (tier === 'Standard') {
    return upscaleImageByBackend(base64ImageData, mimeType, enhanceFaces, quality, aspectRatio);
  }

  // ============================================================
  // PRO TIER — modelo correto: gemini-3-pro-image-preview
  // Diferença real vs FREE:
  //   - Raciocínio multimodal avançado (Thinking: Compatível)
  //   - Google Search grounding (Pesquisar conteúdo: Compatível)
  //   - Qualidade de estúdio, layouts complexos, texto preciso
  //   - Limite: apenas Preview (sem versão estável ainda)
  // ============================================================
  try {
    console.log(`📤 PRO tier → API direta (${IMAGE_MODEL_PRO})`);

    const ai = new GoogleGenAI({
      apiKey: undefined as any, // injetado pelo contexto window.aistudio
    });

    const RestorationPrompt =
      quality === 'Professional'
        ? `You are an elite Super-Resolution AI operating at a Premium Master level.
Your task is to INTELLIGENTLY RECONSTRUCT AND ADD photorealistic micro-details to upscale this image by 2x.

MANDATORY RULES:
1. MACRO-TEXTURE INJECTION: Dynamically add hyper-realistic micro-textures. If it's denim, render exact fabric weaves. If it's skin, render microscopic pores.
2. RAW SHARPNESS: Eliminate AI smoothing. Deliver a RAW Hasselblad-aesthetic output with immense micro-contrast.
3. CONTEXTUAL FAITHFULNESS: Preserve exact structure, color hue, text/logo shapes, and lighting of the original.`
        : `You are a dedicated Super-Resolution AI. Upscale this image by 2x while MAXIMIZING SHARPNESS.

MANDATORY RULES:
1. MAX SHARPNESS: Eliminate blur. Enhance edge contrast, define micro-textures (fabric weave, paper grain).
2. TEXT/LOGO PRESERVATION: Do NOT redraw lettering. Intensely sharpen existing pixels only.
3. COLOR CONSTANCY: Keep exact original hues, exposure, and lighting.`;

    const qualityInstructions: Record<string, string> = {
      Standard: '',
      High: '\nApply strong enhancement to edges.',
      Professional: '\nExecute premium master reconstruction for maximum-sharpness and photorealistic macro-details.',
    };

    let promptText =
      `${RestorationPrompt}\nDeliver extreme sharpness and high-definition texture fidelity.` +
      '\n' + qualityInstructions[quality];

    if (enhanceFaces) {
      promptText += `\nFace Restoration: Reconstruct natural skin textures and eye details carefully.`;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('API call timed out after 60 seconds.')), API_CALL_TIMEOUT_MS),
    );

    // PRO usa resolução mais alta que FREE
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
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    };

    console.log(`   ratio: ${aspectRatio} | size: ${imageSize}`);

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

    throw new Error('The AI model completed the request but did not return any image data.');

  } catch (error: any) {
    // Bug #6 FIX: guard completo para error.message undefined
    const msg: string = error?.message || '';
    console.error(`❌ PRO upscale error:`, msg);

    if (msg.includes('timed out')) {
      throw new Error('PRO process timed out. Try a smaller image or Standard quality.');
    }
    if (
      msg.includes('API_KEY') ||
      msg.includes('API key not valid') ||
      msg.includes('403') ||
      msg.includes('PERMISSION_DENIED')
    ) {
      throw new Error(
        'Pro Mode requires a valid Paid API Key with active billing. Check your AI Studio settings.',
      );
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      throw new Error('Quota limit reached. Wait a few minutes or check your billing.');
    }
    if (msg.includes('404') || msg.includes('NOT_FOUND')) {
      throw new Error('Model unavailable in your region or not supported yet.');
    }
    if (msg.includes('safety') || msg.includes('SAFETY')) {
      throw new Error('Image flagged by safety filters. Cannot process this content.');
    }

    throw new Error(msg || `Unexpected error with Gemini PRO. Please try again.`);
  }
};