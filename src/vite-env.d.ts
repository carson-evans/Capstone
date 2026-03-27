// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PACKET_API_URL?: string;
  readonly VITE_ELIGIBILITY_API_URL?: string;
  readonly VITE_ENABLE_RUM?: string;
  readonly VITE_RUM_APP_ID?: string;
  readonly VITE_RUM_APP_VERSION?: string;
  readonly VITE_RUM_REGION?: string;
  readonly VITE_RUM_SESSION_SAMPLE_RATE?: string;
  readonly VITE_RUM_ENABLE_HTTP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}