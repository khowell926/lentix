/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEEP_DIVE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
