import axios from 'axios'
import { API_TIMEOUT_MS, API_UNREACHABLE_MESSAGE, SESSION_TOKEN_STORAGE_KEY } from '@/constants/api'

export type ApiResult<T> = { success: true; data: T } | { success: false; message: string }

const API_BASE_URL =
  import.meta.env.VITE_ENV === 'production' ? import.meta.env.VITE_PRODUCTION : import.meta.env.VITE_DEVELOPMENT

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

/**
 * The token Connect returns: it tells the server which user every request is for,
 * so each user only ever reads and writes their own entries. Kept across restarts
 * until Log out, or until the server stops accepting it (401).
 */
export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY)
  } catch {
    // Storage unavailable: the session lasts until the app closes.
  }
}

client.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// The server signed this user out (Log out elsewhere, or N-PAX rejected the saved login).
// Dropping the token makes the next status poll report 'disconnected', which locks the app.
client.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) setSessionToken(null)
  return Promise.reject(error)
})

/** The server's `{ ok, data }` envelope, when the response is wrapped in one. */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'ok' in body && 'data' in body) return body.data as T
  return body as T
}

export function parseApiError(error: unknown): string {
  if (!axios.isAxiosError(error) || !error.response) return API_UNREACHABLE_MESSAGE
  const message: unknown = error.response.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message !== '') return message
  return error.message
}

/** `timeoutMs` overrides API_TIMEOUT_MS for calls known to run long. */
export async function post<T>(url: string, body: unknown, options?: { timeoutMs?: number }): Promise<ApiResult<T>> {
  try {
    const res = await client.post(url, body, { timeout: options?.timeoutMs })
    return { success: true, data: unwrap<T>(res.data) }
  } catch (error) {
    return { success: false, message: parseApiError(error) }
  }
}

export async function get<T>(url: string, params?: Record<string, string | number>): Promise<ApiResult<T>> {
  try {
    const res = await client.get(url, { params })
    return { success: true, data: unwrap<T>(res.data) }
  } catch (error) {
    return { success: false, message: parseApiError(error) }
  }
}

export async function put<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await client.put(url, body)
    return { success: true, data: unwrap<T>(res.data) }
  } catch (error) {
    return { success: false, message: parseApiError(error) }
  }
}

export async function patch<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await client.patch(url, body)
    return { success: true, data: unwrap<T>(res.data) }
  } catch (error) {
    return { success: false, message: parseApiError(error) }
  }
}

export async function del<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await client.delete(url)
    return { success: true, data: unwrap<T>(res.data) }
  } catch (error) {
    return { success: false, message: parseApiError(error) }
  }
}
