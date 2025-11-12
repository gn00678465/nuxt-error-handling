import type { FetchError, FetchContext, FetchResponse } from 'ofetch'
import type { NuxtError } from '#app'
import type { NormalizedError, ErrorTransformCallback } from '../types/normalizedError'

/**
 * 驗證錯誤類型並返回是否為有效錯誤
 * 如果不是任何已知錯誤類型，則拋出錯誤
 */
export function validateError<T = unknown>(error: unknown): boolean {
  if (isFetchError<T>(error)) return true
  if (isNuxtError<T>(error)) return true
  if (error instanceof Error) return true

  throw error
}

/**
 * 驗證是否為 FetchError 實例
 */
export function isFetchError<T = unknown>(error: unknown): error is FetchError<T> {
  return (
    error instanceof Error
    && 'request' in error
    && 'options' in error
    && ('response' in error || 'status' in error)
  )
}

/**
 * 驗證是否為 FetchContext 物件
 */
export function isFetchContext<T = unknown>(
  context: unknown,
): context is FetchContext<T> {
  if (!context || typeof context !== 'object') return false

  const ctx = context as Record<string, unknown>
  return (
    'request' in ctx
    && 'options' in ctx
    && ctx.request !== undefined
    && ctx.options !== undefined
  )
}

/**
 * 驗證是否為 FetchResponse 物件
 */
export function isFetchResponse<T = unknown>(response: unknown): response is FetchResponse<T> {
  if (!response || typeof response !== 'object') return false

  const res = response as Record<string, unknown>
  return (
    'status' in res
    && 'statusText' in res
    && 'headers' in res
    && 'ok' in res
    && typeof res.status === 'number'
  )
}

/**
 * 驗證是否為 NuxtError 實例
 */
export function isNuxtError<DataT = unknown>(error: unknown): error is NuxtError<DataT> {
  if (!error || typeof error !== 'object') return false

  const err = error as Record<string, unknown>
  return (
    err instanceof Error
    && ('statusCode' in err || 'status' in err)
    && 'message' in err
  )
}

/**
 * 將錯誤物件標準化為統一格式
 */
export function normalizeError<T = unknown>(error: unknown): NormalizedError<T>
/**
 * 將錯誤物件標準化為統一格式，並可選擇性轉換為自訂格式
 */
export function normalizeError<T = unknown, R = NormalizedError<T>>(
  error: unknown,
  transform: ErrorTransformCallback<T, R>,
): R
export function normalizeError<T = unknown, R = NormalizedError<T>>(
  error: unknown,
  transform?: ErrorTransformCallback<T, R>,
): NormalizedError<T> | R {
  let normalized: NormalizedError<T>

  // 處理 FetchError
  if (isFetchError<T>(error)) {
    const statusCode = error.status ?? error.response?.status
    const statusMessage = error.statusText ?? error.response?.statusText ?? error.message
    const data = error.data ?? error.response?._data

    normalized = {
      cause: error.cause,
      data,
      message: error.message,
      name: error.name || 'FetchError',
      stack: error.stack,
      statusCode,
      statusMessage,
    }
  }
  // 處理 NuxtError
  else if (isNuxtError<T>(error)) {
    const err = error as unknown as Record<string, unknown> & Error
    const statusCode = (typeof err.statusCode === 'number' ? err.statusCode : typeof err.status === 'number' ? err.status : undefined)

    normalized = {
      cause: err.cause,
      data: err.data as T,
      message: error.message,
      name: error.name || 'NuxtError',
      stack: error.stack,
      statusCode,
      statusMessage: typeof err.statusMessage === 'string' ? err.statusMessage : error.message,
    }
  }
  // 處理標準 Error
  else if (error instanceof Error) {
    const err = error as unknown as Record<string, unknown> & Error

    normalized = {
      cause: err.cause,
      data: undefined,
      message: error.message,
      name: error.name || 'Error',
      stack: error.stack,
      statusCode: undefined,
      statusMessage: undefined,
    }
  }
  // 處理未知錯誤
  else {
    throw error
  }

  // 如果提供了轉換函式，則使用它轉換標準化後的錯誤
  return transform ? transform(normalized) : normalized
}
