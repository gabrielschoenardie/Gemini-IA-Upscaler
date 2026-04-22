## Execution

This app runs **exclusively inside Google AI Studio**. The Gemini API key is
provided by the AI Studio session at runtime; the project has no backend and
the production bundle intentionally does not ship a usable key.

Open in AI Studio:
https://ai.studio/apps/7d53a25c-2280-4135-95fc-83aaf57f25b6

Local `npm run dev` is supported only for cosmetic UI work — the app will
display an "AI Studio only" screen and refuse to call the Gemini API when
`window.aistudio` is not present.

**Do not** `npm run build` and host the output publicly. Although the runtime
guard blocks calls, the bundle produced by `vite build` may still contain your
`GEMINI_API_KEY` inlined by Vite's `define` substitution. Treat the build
artifact as private.