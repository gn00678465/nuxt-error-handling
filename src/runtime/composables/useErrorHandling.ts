import type { Handlers, HandlersWithDefault } from '../types/handler'
import { isFetchError, isNuxtError, validateError, normalizeError } from '../utils/error-handling'

export interface UseErrorHandlingOptions<TDefault> {
  handlers?: HandlersWithDefault<TDefault>
}

export function useErrorHandling<TDefault = unknown>(options: UseErrorHandlingOptions<TDefault> = {}) {
  const { handlers: originalHandlers = { DEFAULT: () => {} } } = options

  function errorHandler<T = TDefault>(error: unknown, handlers: Handlers<T> = {}) {
    // 使用類型斷言來合併 handlers，因為運行時它們處理的是同一個錯誤
    const newHandlers = { ...originalHandlers, ...handlers } as Handlers<T> & { DEFAULT?: (data: T | undefined) => void }

    if (validateError<T>(error)) {
      // 在這裡處理錯誤
      const data = normalizeError<T>(error)
      if (data.statusCode && data.statusCode.toString() in newHandlers) {
        newHandlers[data.statusCode.toString() as keyof Handlers<T>]?.(data.data)
        return
      }

      // 如果沒有匹配的狀態碼處理器，使用 DEFAULT
      newHandlers.DEFAULT?.(data.data)
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
