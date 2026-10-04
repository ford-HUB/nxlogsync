/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Which server the renderer talks to: `production` uses VITE_PRODUCTION, anything else VITE_DEVELOPMENT. */
  readonly VITE_ENV: 'development' | 'production'
  /** Local NXLogSync server base, including the global prefix, e.g. http://localhost:8000/api */
  readonly VITE_DEVELOPMENT: string
  /** Deployed NXLogSync server base, including the global prefix. */
  readonly VITE_PRODUCTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
