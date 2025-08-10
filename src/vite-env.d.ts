/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MASTRA_API_BASE?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_DEBUG_MODE?: string
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
