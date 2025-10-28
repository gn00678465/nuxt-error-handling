import type { Handlers, HandlersWithDefault } from '../types/handler'
import { isFetchError, isNuxtError, validateError, normalizeError } from '../utils/error-handling'

export interface UseErrorHandlingOptions<TDefault> {
  handlers?: HandlersWithDefault<TDefault>
}

/**
 * 錯誤處理組合函數
 * @param options - 錯誤處理的配置選項。
 * @returns 包含錯誤處理工具的物件。
 */
export function useErrorHandling<TDefault = unknown>(options: UseErrorHandlingOptions<TDefault> = {}) {
  const { handlers: originalHandlers = { DEFAULT: (_data, _error) => {} } } = options

  function errorHandler<T = TDefault>(error: unknown, handlers: Handlers<T> = {}) {
    // 使用類型斷言合併處理器，因為運行時它們處理的是相同錯誤
    const newHandlers = { ...originalHandlers, ...handlers } as Handlers<T> & { DEFAULT?: (data: T | undefined, error?: unknown) => void }

    if (validateError<T>(error)) {
      const data = normalizeError<T>(error)
      if (data.statusCode && data.statusCode.toString() in newHandlers) {
        newHandlers[data.statusCode.toString() as keyof Handlers<T>]?.(data.data, error)
        return
      }

      // 若無匹配的狀態碼處理器，則使用 DEFAULT
      newHandlers.DEFAULT?.(data.data, error)
      return
    }
    throw error
  }

  return {
    errorHandler,
    isFetchError,
    isNuxtError,
    validateError,
    normalizeError,
  }
}
