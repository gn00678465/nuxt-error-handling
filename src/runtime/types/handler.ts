import type { StatusCodes as SC } from './statusCodes'

/**
 * 處理錯誤資料的處理器函數。
 * @param errorData - 標準化後的類型 T 錯誤資料，或為 undefined。
 * @param error - 原始錯誤物件（可選）。
 */
type Handler<T> = (errorData: T | undefined, error?: unknown) => void

export type Handlers<T = unknown> = Partial<Record<`${SC}`, Handler<T>>>

export type HandlersWithDefault<T = unknown> = Handlers<T> & {
  DEFAULT: Handler<T>
}
