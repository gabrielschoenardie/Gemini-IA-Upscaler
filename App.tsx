import React, { useState, useCallback, useEffect } from 'react';
import { upscaleImage, UpscaleTier } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { sharpenImageWebGL } from './utils/webglSharpen';
import { UploadIcon, SparklesIcon, LoadingSpinner, ErrorIcon } from './components/Icons';
import ImageComparisonSlider from './components/ImageComparisonSlider';

type Quality = 'Standard' | 'High' | 'Professional';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 10MB in bytes

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enhanceFaces, setEnhanceFaces] = useState<boolean>(true);
  const [outputQuality, setOutputQuality] = useState<Quality>('High');
  const [tier, setTier] = useState<UpscaleTier>('Standard');
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);
  const [isAiStudioEnv, setIsAiStudioEnv] = useState<boolean | null>(null);

  useEffect(() => {
    const inAiStudio =
      typeof window !== 'undefined' &&
      !!(window as any).aistudio &&
      typeof (window as any).aistudio.hasSelectedApiKey === 'function';

    setIsAiStudioEnv(inAiStudio);
    if (!inAiStudio) return;

    const checkApiKey = async () => {
      const hasKey = await (window as any).aistudio!.hasSelectedApiKey();
      setApiKeySelected(hasKey);
      setShowApiKeyPrompt(tier === 'Pro' && !hasKey);
    };
    checkApiKey();
  }, [tier]);

  const handleSelectApiKey = async () => {
    if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
      try {
        await (window as any).aistudio.openSelectKey();
        setApiKeySelected(true);
        setShowApiKeyPrompt(false);
        setError(null);
      } catch (err) {
        console.error("Error opening API key selection dialog:", err);
        setError("Failed to open API key selection. Please try again.");
      }
    } else {
      setError("API key selection not available in this environment.");
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetState();

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        return;
      }

      setOriginalImageFile(file);
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage(base64);
      } catch (err) {
        setError('Could not read the selected file.');
        console.error(err);
      }
    }
  };

  const handleUpscale = useCallback(async () => {
    if (tier === 'Pro' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setShowApiKeyPrompt(true);
        setError("A paid API key is required for Pro mode.");
        return;
      }
    }

    if (!originalImage) {
      setError('Please select an image first.');
      return;
    }

    const base64Data = originalImage.split(',')[1];
    if (!base64Data || !originalImageFile) {
      setError('Invalid image format.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUpscaledImage(null);

    try {
      // Calculate aspect ratio dynamically
      const calculateAspectRatio = async (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const targetRatio = img.width / img.height;
            let closest = "1:1";
            let minDiff = Infinity;
            const RatiosMap: Record<string, number> = {
              "1:1": 1, "4:3": 4 / 3, "3:4": 3 / 4, "16:9": 16 / 9, "9:16": 9 / 16,
              "4:1": 4, "1:4": 1 / 4, "8:1": 8, "1:8": 1 / 8
            };
            for (const [ratioStr, ratioVal] of Object.entries(RatiosMap)) {
              const diff = Math.abs(targetRatio - ratioVal);
              if (diff < minDiff) {
                minDiff = diff;
                closest = ratioStr;
              }
            }
            resolve(closest);
          };
          img.onerror = () => resolve("1:1");
          img.src = base64Str;
        });
      };

      const closestAspectRatio = await calculateAspectRatio(originalImage);
      const { data, mimeType } = await upscaleImage(
        base64Data,
        originalImageFile.type,
        enhanceFaces,
        outputQuality,
        tier,
        closestAspectRatio
      );

      // Convert result to High Quality JPG with optional GPU sharpening
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to decode upscaled image"));
          img.src = src;
        });

      const imageToJpgOnWhite = (img: HTMLImageElement, fallbackDataUrl: string): string => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return fallbackDataUrl;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/jpeg', 1.0);
      };

      const convertToJpg = async (base64Str: string, mime: string): Promise<string> => {
        const rawDataUrl = `data:${mime};base64,${base64Str}`;
        let img: HTMLImageElement;
        try {
          img = await loadImage(rawDataUrl);
        } catch (e) {
          console.warn("Image decode failed; returning raw payload.", e);
          return rawDataUrl;
        }

        // Professional + Pro: GPU sharpening via WebGL2 fragment shader.
        // Falls back transparently to the plain JPG path on any GPU failure.
        const needsSharpen = outputQuality === 'Professional' && tier === 'Pro';
        if (needsSharpen) {
          try {
            const sharpened = sharpenImageWebGL(img, 0.55);
            return sharpened.toDataURL('image/jpeg', 1.0);
          } catch (e) {
            console.warn("WebGL sharpening failed; falling back to plain JPG.", e);
          }
        }

        return imageToJpgOnWhite(img, rawDataUrl);
      };

      const jpgDataUrl = await convertToJpg(data, mimeType);
      setUpscaledImage(jpgDataUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upscaling failed.');
      if (tier === 'Pro' && (err.message.includes("API key") || err.message.includes("entity was not found"))) {
        setShowApiKeyPrompt(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, originalImageFile, enhanceFaces, outputQuality, tier]);

  const resetState = () => {
    setOriginalImage(null);
    setOriginalImageFile(null);
    setUpscaledImage(null);
    setError(null);
    setIsLoading(false);
  };

  const handleReset = () => {
    resetState();
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // AI-Studio-only gate: block the app when window.aistudio is absent.
  if (isAiStudioEnv === false) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-xl bg-gray-800/60 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <ErrorIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">AI Studio only</h1>
          <p className="text-gray-300 leading-relaxed mb-4">
            Este aplicativo foi configurado para rodar exclusivamente dentro do
            Google AI Studio, onde a chave Gemini é provida pela sessão logada.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Abra em{' '}
            <a
              href="https://ai.studio/apps/7d53a25c-2280-4135-95fc-83aaf57f25b6"
              className="text-cyan-400 hover:text-cyan-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              ai.studio
            </a>{' '}
            para usar. Execução local não é suportada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400">
          Gemini Image Upscaler
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Advanced AI reconstruction for low-res images and screenshots.
        </p>
      </header>

      <main className="w-full max-w-6xl flex-grow flex flex-col items-center">
        {/* Tier Selector */}
        <div className="flex bg-gray-800 p-1 rounded-xl mb-8 border border-gray-700 shadow-xl overflow-hidden">
          <button
            onClick={() => setTier('Standard')}
            className={`px-6 py-2 rounded-lg font-bold transition-all duration-300 ${
              tier === 'Standard'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Standard (Free)
          </button>
          <button
            onClick={() => setTier('Pro')}
            className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 ${
              tier === 'Pro'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <SparklesIcon className={`w-4 h-4 ${tier === 'Pro' ? 'text-yellow-300' : ''}`} />
            Gemini 3 Pro (Paid)
          </button>
        </div>

        {showApiKeyPrompt && tier === 'Pro' && (
          <div className="w-full max-w-3xl bg-indigo-900/30 text-indigo-100 p-6 rounded-2xl mb-8 border border-indigo-700/50 shadow-2xl flex flex-col items-center text-center backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
            <SparklesIcon className="w-10 h-10 text-yellow-400 mb-3" />
            <p className="font-bold text-xl mb-2 text-white">Paid API Key Required for Pro Tier</p>
            <p className="text-sm opacity-90 max-w-md">
              Gemini 3 Pro offers ultra high-fidelity results but requires a user-provided paid API key.
            </p>
            <button
              onClick={handleSelectApiKey}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Select Paid API Key
            </button>
          </div>
        )}

        <div className="w-full bg-gray-800/40 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-md">
          {!originalImage && (
            <div className={`flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-xl p-6 text-center group transition-colors duration-300 bg-gray-900/20 ${tier === 'Pro' ? 'border-purple-500/30 hover:border-purple-500/60' : 'border-cyan-500/30 hover:border-cyan-500/60'}`}>
              <UploadIcon className={`w-20 h-20 mb-4 transition-colors duration-300 ${tier === 'Pro' ? 'text-purple-600 group-hover:text-purple-400' : 'text-cyan-600 group-hover:text-cyan-400'}`} />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer font-bold text-xl transition-colors ${tier === 'Pro' ? 'text-purple-400 hover:text-purple-300' : 'text-cyan-400 hover:text-cyan-300'}`}
              >
                <span>Drop your image here or browse</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
              </label>
              <p className="text-sm text-gray-500 mt-2">Maximum file size: {MAX_FILE_SIZE_MB}MB</p>
            </div>
          )}

          {originalImage && (
            <div className="flex flex-col items-center gap-8">
              <div className="w-full max-w-4xl">
                <h3 className="text-lg font-medium text-center mb-4 text-gray-400 flex items-center justify-center gap-2">
                  <SparklesIcon className={`w-4 h-4 ${tier === 'Pro' ? 'text-purple-400' : 'text-cyan-400'}`} />
                  Comparison: Original vs. {tier} Result
                </h3>
                <div className="aspect-square w-full max-h-[600px] bg-black rounded-xl overflow-hidden border border-gray-700 shadow-2xl flex items-center justify-center relative group">
                  {!upscaledImage && originalImage && (
                    <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain" />
                  )}
                  {upscaledImage && originalImage && (
                    <ImageComparisonSlider beforeImage={originalImage} afterImage={upscaledImage} />
                  )}

                  {isLoading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                      <LoadingSpinner className={`w-16 h-16 ${tier === 'Pro' ? 'text-purple-500' : 'text-cyan-500'}`} />
                      <div className="mt-6 text-center">
                        <p className="text-lg font-bold text-white animate-pulse">
                          Gemini {tier} is processing...
                        </p>
                        <p className="mt-2 text-sm text-gray-400">Enhancing clarity and details</p>
                      </div>
                    </div>
                  )}
                  {error && !isLoading && (
                    <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center z-20 p-6 text-center backdrop-blur-md animate-in fade-in duration-300">
                      <div className="bg-gray-900 p-8 rounded-2xl border border-red-500/50 shadow-2xl max-w-md w-full">
                        <ErrorIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-xl font-bold text-white mb-3">Something went wrong</p>
                        <p className="text-sm text-red-100/80 leading-relaxed mb-6">
                          {error}
                        </p>

                        <div className="flex flex-col gap-3">
                          {(error.toLowerCase().includes("api key") || error.toLowerCase().includes("billing")) && (
                            <button
                              onClick={handleSelectApiKey}
                              className="w-full py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              Configure API Key
                            </button>
                          )}

                          <button
                            onClick={() => setError(null)}
                            className="w-full py-3 bg-red-600/20 text-red-200 font-semibold rounded-xl border border-red-500/30 hover:bg-red-600/30 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl bg-gray-900/30 p-6 rounded-xl border border-gray-700/30">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="face-enhancement"
                        name="face-enhancement"
                        type="checkbox"
                        checked={enhanceFaces}
                        onChange={(e) => setEnhanceFaces(e.target.checked)}
                        className={`w-5 h-5 rounded border-gray-600 bg-gray-800 focus:ring-offset-gray-900 cursor-pointer ${tier === 'Pro' ? 'text-purple-500 focus:ring-purple-600' : 'text-cyan-500 focus:ring-cyan-600'}`}
                      />
                      <label htmlFor="face-enhancement" className="ml-3 text-sm font-semibold text-gray-300 cursor-pointer">
                        Face Restoration
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label htmlFor="output-quality" className="text-sm font-semibold text-gray-300">
                      Quality Mode
                    </label>
                    <select
                      id="output-quality"
                      name="output-quality"
                      value={outputQuality}
                      onChange={(e) => setOutputQuality(e.target.value as Quality)}
                      className="rounded-lg border-gray-600 bg-gray-800 text-white text-sm font-medium focus:ring-offset-gray-900 cursor-pointer py-2 pl-3 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="Standard">Standard</option>
                      <option value="High">High Fidelity</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={handleUpscale}
                    disabled={isLoading || !originalImage}
                    className={`group flex items-center gap-3 px-10 py-4 text-white font-bold text-lg rounded-xl shadow-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${
                      tier === 'Pro'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                    }`}
                  >
                    <SparklesIcon className={`w-6 h-6 group-hover:rotate-12 transition-transform ${tier === 'Pro' ? 'text-yellow-300' : 'text-cyan-200'}`} />
                    {isLoading ? 'Processing...' : `Upscale with Gemini ${tier}`}
                  </button>

                  {upscaledImage && (
                    <a
                      href={upscaledImage}
                      download={`upscaled-${tier}-${originalImageFile?.name.replace(/\.[^/.]+$/, "") || 'result'}.${upscaledImage.split(';')[0].split('/')[1]}`}
                      className="px-8 py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl shadow-xl hover:bg-emerald-500 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      Download
                    </a>
                  )}

                  <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-gray-700 text-white font-bold text-lg rounded-xl shadow-xl hover:bg-gray-600 transition-all duration-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl mt-12 py-8 border-t border-gray-800 text-center">
        <div className="flex flex-col items-center gap-2">
          {upscaledImage && (
            <p className="text-gray-400 text-sm font-medium">
              Formato: {upscaledImage.split(';')[0].split(':')[1] === 'image/jpeg' ? 'JPG em Alta Qualidade (100%)' : 'Imagem de Alta Qualidade'}
            </p>
          )}
          <p className="text-gray-500 text-xs">
            Gemini Standard utiliza Flash para resultados rápidos. Gemini Pro utiliza reasoning avançado para detalhes superiores.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;