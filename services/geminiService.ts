import { GoogleGenAI } from "@google/genai";

const API_CALL_TIMEOUT_MS = 60000; // 60 seconds (1 minute)
// Use relative URL - vite proxy will handle the routing to localhost:3001
const BACKEND_URL = '/api';

export type UpscaleTier = 'Standard' | 'Pro';

export interface UpscaleResponse {
  data: string;
  mimeType: string;
}

// FREE TIER: Call backend (protected API key)
export const upscaleImageByBackend = async (
  base64ImageData: string,
  mimeType: string,
  enhanceFaces: boolean,
  quality: 'Standard' | 'High' | 'Professional',
  aspectRatio: string = "1:1"
): Promise<UpscaleResponse> => {
  try {
    console.log('📤 Calling backend upscale (FREE tier)...');

    const response = await fetch(`${BACKEND_URL}/upscale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64ImageData,
        mimeType,
        enhanceFaces,
        quality,
        aspectRatio,
      }),
      signal: AbortSignal.timeout(API_CALL_TIMEOUT_MS),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Backend error: ${response.statusText}`);
    }

    const data = await response.json() as UpscaleResponse;
    console.log('✅ Backend upscale completed');
    return data;
  } catch (error: any) {
    console.error('❌ Backend upscale error:', error);
    const errorMessage = error.message || 'Unknown error';

    if (errorMessage.includes('timeout') || errorMessage.includes('Abort')) {
      throw new Error('The upscale process timed out after 60 seconds. Try a smaller image or lower quality.');
    }

    if (errorMessage.includes('Connection refused')) {
      throw new Error('Backend server is not running. Please ensure the server is started with: npm run server');
    }

    throw new Error(errorMessage || 'Failed to upscale image via backend');
  }
};

// PRO TIER: Direct API call (user's API key)
export const upscaleImage = async (
  base64ImageData: string,
  mimeType: string,
  enhanceFaces: boolean,
  quality: 'Standard' | 'High' | 'Professional',
  tier: UpscaleTier,
  aspectRatio: string = "1:1"
): Promise<UpscaleResponse> => {
  try {
    // If Standard tier, use backend
    if (tier === 'Standard') {
      return await upscaleImageByBackend(base64ImageData, mimeType, enhanceFaces, quality, aspectRatio);
    }

    // PRO tier: use user's API key from aistudio
    // The API key must be selected via window.aistudio.openSelectKey() before this is called
    // The GoogleGenAI SDK will use the selected key automatically from aistudio
    console.log('📤 Calling Gemini API directly (PRO tier)...');
    // Initialize GoogleGenAI without explicit key - it will use the one from aistudio context
    const ai = new GoogleGenAI({
      apiKey: undefined as any, // Will use aistudio's selected key
    });
    const modelName = 'gemini-2.5-flash-image';

    const RestorationPrompt = quality === 'Professional'
      ? `You are an elite Super-Resolution AI operating at a Premium Master level (like a high-end photography studio algorithm).
Your task is to INTELLIGENTLY RECONSTRUCT AND ADD photorealistic micro-details to upscale this image by 2x.

MANDATORY RULES:
1. MACRO-TEXTURE INJECTION: Do not leave surfaces smooth. Dynamically add hyper-realistic micro-textures corresponding to the material. If it's denim, render the exact fabric weaves and threads. If it's leather or skin, render microscopic pores.
2. RAW SHARPNESS: Eliminate AI "smoothing" completely. Provide a RAW, high-frequency Hasselblad photograph aesthetic with immense micro-contrast.
3. CONTEXTUAL FAITHFULNESS: While inventing high-resolution textures, you MUST preserve the exact structure, color hue, text/logo shapes, and overall lighting of the original image.`
      : `You are a dedicated Super-Resolution AI. Your task is to upscale the provided image by 2x while aggressively MAXIMIZING SHARPNESS and micro-details.

MANDATORY RULES:
1. MAX SHARPNESS: Eliminate any blur. Enhance edge contrast and crisply define micro-textures (such as denim fabric weave, threads, and paper grain). The output must be mathematically sharper than the original.
2. STRICT TEXT/LOGO PRESERVATION: Do NOT redraw, alter, or hallucinate lettering. Instead, intensely sharpen the existing pixels of text and logos.
3. COLOR CONSTANCY: Keep the exact original hues, exposure, and lighting. No color shifting.`;

    let promptText = `${RestorationPrompt}\nDeliver extreme sharpness and high-definition texture fidelity.`;

    const qualityInstructions = {
      Standard: "",
      High: "\nApply strong enhancement to edges.",
      Professional: "\nExecute premium master reconstruction for maximum-sharpness and photorealistic macro-details."
    };

    promptText += "\n" + qualityInstructions[quality];

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

    generateParams.config = {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: quality === 'Professional' ? "4K" : "2K"
      }
    };

    const response = await Promise.race([
      ai.models.generateContent(generateParams),
      timeoutPromise
    ]);

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No content parts found in the response.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
        console.log('✅ PRO upscale completed');
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
      }
    }

    throw new Error("The AI model completed the request but did not return any image data.");
  } catch (error: any) {
    console.error(`Error calling Gemini API (${tier} tier):`, error);

    const errorMessage = error.message || "";

    // Timeout
    if (errorMessage.includes("timed out")) {
      throw new Error(`The ${tier} process timed out after 60 seconds. High-resolution upscaling is computationally intensive; try a smaller image or "Standard" quality.`);
    }

    // API Key / Billing Issues
    if (errorMessage.includes("API_KEY") || errorMessage.includes("API key not valid") || errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
      if (tier === 'Pro') {
        throw new Error("Pro Mode requires a valid Paid API Key with an active billing account. Please check your AI Studio settings.");
      }
      throw new Error("The API key is invalid or lacks necessary permissions for this operation. Verify your configuration in AI Studio.");
    }

    // Quota / Rate Limiting
    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      throw new Error(`Quota limit reached for ${tier} tier. Please wait a few minutes or switch to a paid API key for higher throughput.`);
    }

    // Model availability / Region issues
    if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
      throw new Error(`Model is currently unavailable in your region or not supported in this tier.`);
    }

    // Safety filters
    if (errorMessage.includes("safety") || errorMessage.includes("SAFETY")) {
      throw new Error("The image was flagged by safety filters. Gemini cannot process content that may violate safety guidelines.");
    }

    // Fallback
    throw new Error(errorMessage || `An unexpected error occurred while processing with Gemini ${tier}. Please try again later.`);
  }
};