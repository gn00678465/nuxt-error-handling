/**
 * 標準化錯誤對象的介面
 */
export interface NormalizedError<T = unknown> {
  cause?: unknown
  data?: T
  message: string
  name: string
  stack?: string
  statusCode?: number
  statusMessage?: string
}

/**
 * 錯誤轉換回調函式類型
 */
export type ErrorTransformCallback<T = unknown, R = NormalizedError<T>> = (
  normalized: NormalizedError<T>,
) => R
