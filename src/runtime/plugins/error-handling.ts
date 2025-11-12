import type { Handlers } from '../types/handler'
import type { ErrorHandlingDefaultOptions } from '../types/options'
import { defineNuxtPlugin } from '#app'
import { isFetchError, isNuxtError, validateError, normalizeError } from '../utils/error-handling'

export default defineNuxtPlugin((_nuxtApp) => {
  /**
   * 錯誤處理組合函數
   * @param originalHandlers - 錯誤處理的配置選項。
   * @returns errorHandler function
   */

  type ErrorHandlingPluginOptions<TDefault> = ErrorHandlingDefaultOptions<TDefault>

  function defineErrorHandler<T = unknown>(originalHandlers: ErrorHandlingPluginOptions<T> = { handlers: { DEFAULT: (_data, _error) => {} } }) {
    return function errorHandler(error: unknown, handlers: Handlers<T> = {}) {
      // 使用類型斷言合併處理器，因為運行時它們處理的是相同錯誤
      const mergedHandlers = { ...originalHandlers.handlers, ...handlers } as Handlers<T> & { DEFAULT?: (data: T | undefined, error?: unknown) => void }

      if (validateError<T>(error)) {
      // 在這裡處理錯誤
        const data = normalizeError<T>(error)
        if (data.statusCode && data.statusCode.toString() in mergedHandlers) {
          mergedHandlers[data.statusCode.toString() as keyof Handlers<T>]?.(data.data, error)
          return
        }

        // 若無匹配的狀態碼處理器，則使用 DEFAULT
        mergedHandlers.DEFAULT?.(data.data, error)
        return
      }
      throw error
    }
  }

  return {
    provide: {
      validateError,
      isNuxtError,
      isFetchError,
      normalizeError,
      defineErrorHandler,
    },
  }
})
