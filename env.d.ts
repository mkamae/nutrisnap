/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  const __SUPABASE_URL__: string;
  const __SUPABASE_ANON_KEY__: string;
  const __GEMINI_API_KEY__: string;
}

export {};
