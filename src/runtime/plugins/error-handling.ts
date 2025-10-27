import type { Handlers } from '../types/handler'
import { defineNuxtPlugin } from '#app'
import { isFetchError, isNuxtError, validateError, normalizeError } from '../utils/error-handling'

export default defineNuxtPlugin((_nuxtApp) => {
  function errorHandler<T = unknown>(error: unknown, handlers: Handlers<T> = {}) {
    if (validateError<T>(error)) {
      // 在這裡處理錯誤
      const data = normalizeError<T>(error)
      if (data.statusCode && data.statusCode.toString() in handlers) {
        handlers[data.statusCode.toString() as keyof Handlers<T>]?.(data.data)
        return
      }
    }
    throw error
  }

  return {
    provide: {
      validateError,
      isNuxtError,
      isFetchError,
      normalizeError,
      errorHandler,
    },
  }
})
