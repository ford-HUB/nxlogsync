/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** NXLogSync server base, including the global prefix, e.g. http://localhost:3000/api */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
