/**
 * Global ambient declarations for the Gemini Image Upscaler.
 *
 * The AI Studio runtime injects a small `aistudio` helper onto `window`
 * when the app is opened in the deployed/shared environment (not in the
 * inline preview). It is used exclusively to let the user select a paid
 * Gemini API key for the Pro tier.
 *
 * The property is marked optional because it is absent in:
 *   - the AI Studio inline preview iframe,
 *   - any local `vite dev` run, and
 *   - any standalone build of the bundle.
 *
 * Always narrow before calling, e.g.:
 *   if (window.aistudio?.hasSelectedApiKey) { ... }
 */
export {};

declare global {
  interface AiStudioBridge {
    /** Returns true when the user has selected a paid API key in AI Studio. */
    hasSelectedApiKey: () => Promise<boolean>;
    /** Opens the AI Studio dialog to select / change the paid API key. */
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AiStudioBridge;
  }
}
