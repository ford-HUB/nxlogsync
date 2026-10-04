import axios from 'axios'
import { API_TIMEOUT_MS, API_UNREACHABLE_MESSAGE } from '@/constants/api'

export type ApiResult<T> = { success: true; data: T } | { success: false; message: string }

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: API_TIMEOUT_MS,
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

export async function post<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await client.post(url, body)
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
