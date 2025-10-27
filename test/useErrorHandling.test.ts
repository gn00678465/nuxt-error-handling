import { describe, it, expect, vi } from 'vitest'
import { useErrorHandling } from '../src/runtime/composables/useErrorHandling'
import type { FetchError } from 'ofetch'
import type { NuxtError } from '#app'

describe('useErrorHandling', () => {
  describe('基本功能', () => {
    it('應該返回所有必要的方法', () => {
      const { errorHandler, isFetchError, isNuxtError, validateError, normalizeError } = useErrorHandling()

      expect(errorHandler).toBeTypeOf('function')
      expect(isFetchError).toBeTypeOf('function')
      expect(isNuxtError).toBeTypeOf('function')
      expect(validateError).toBeTypeOf('function')
      expect(normalizeError).toBeTypeOf('function')
    })

    it('應該能夠不傳入選項初始化', () => {
      expect(() => useErrorHandling()).not.toThrow()
    })

    it('應該能夠傳入空物件初始化', () => {
      expect(() => useErrorHandling({})).not.toThrow()
    })
  })

  describe('errorHandler - 使用狀態碼處理器', () => {
    it('應該調用對應狀態碼的處理器 (404)', () => {
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Resource not found' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        404: handler404,
      })

      expect(handler404).toHaveBeenCalledTimes(1)
      expect(handler404).toHaveBeenCalledWith({ message: 'Resource not found' })
    })

    it('應該調用對應狀態碼的處理器 (500)', () => {
      const handler500 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Server Error'), {
        statusCode: 500,
        data: { error: 'Internal server error' },
      }) as NuxtError<{ error: string }>

      errorHandler(error, {
        500: handler500,
      })

      expect(handler500).toHaveBeenCalledTimes(1)
      expect(handler500).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('應該處理 401 未授權錯誤', () => {
      const handler401 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Unauthorized'), {
        request: '/api/user',
        options: {},
        status: 401,
        data: { message: 'Token expired' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        401: handler401,
      })

      expect(handler401).toHaveBeenCalledTimes(1)
      expect(handler401).toHaveBeenCalledWith({ message: 'Token expired' })
    })

    it('應該處理 403 禁止訪問錯誤', () => {
      const handler403 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Forbidden'), {
        request: '/api/admin',
        options: {},
        status: 403,
        data: { message: 'Access denied' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        403: handler403,
      })

      expect(handler403).toHaveBeenCalledTimes(1)
      expect(handler403).toHaveBeenCalledWith({ message: 'Access denied' })
    })

    it('應該處理沒有 data 的錯誤', () => {
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
      }) as FetchError

      errorHandler(error, {
        404: handler404,
      })

      expect(handler404).toHaveBeenCalledTimes(1)
      expect(handler404).toHaveBeenCalledWith(undefined)
    })
  })

  describe('errorHandler - DEFAULT 處理器', () => {
    it('應該在沒有匹配的狀態碼處理器時調用 DEFAULT', () => {
      const defaultHandler = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Some Error'), {
        request: '/api/test',
        options: {},
        status: 418, // I'm a teapot
        data: { message: 'Teapot error' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        DEFAULT: defaultHandler,
      } as any)

      expect(defaultHandler).toHaveBeenCalledTimes(1)
      expect(defaultHandler).toHaveBeenCalledWith({ message: 'Teapot error' })
    })

    it('應該在有狀態碼但沒有對應處理器時調用 DEFAULT', () => {
      const defaultHandler = vi.fn()
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Server Error'), {
        statusCode: 500,
        data: { error: 'Internal error' },
      }) as NuxtError<{ error: string }>

      errorHandler(error, {
        404: handler404,
        DEFAULT: defaultHandler,
      } as any)

      expect(handler404).not.toHaveBeenCalled()
      expect(defaultHandler).toHaveBeenCalledTimes(1)
      expect(defaultHandler).toHaveBeenCalledWith({ error: 'Internal error' })
    })

    it('應該優先使用狀態碼處理器而非 DEFAULT', () => {
      const defaultHandler = vi.fn()
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        404: handler404,
        DEFAULT: defaultHandler,
      } as any)

      expect(handler404).toHaveBeenCalledTimes(1)
      expect(defaultHandler).not.toHaveBeenCalled()
    })
  })

  describe('errorHandler - 初始化處理器', () => {
    it('應該使用初始化時提供的 DEFAULT 處理器', () => {
      const originalDefault = vi.fn()
      const { errorHandler } = useErrorHandling({
        handlers: {
          DEFAULT: originalDefault,
        },
      })

      const error = Object.assign(new Error('Some Error'), {
        request: '/api/test',
        options: {},
        status: 418,
        data: { message: 'Error' },
      }) as FetchError<{ message: string }>

      errorHandler(error)

      expect(originalDefault).toHaveBeenCalledTimes(1)
      expect(originalDefault).toHaveBeenCalledWith({ message: 'Error' })
    })

    it('應該使用初始化時提供的狀態碼處理器', () => {
      const original404 = vi.fn()
      const { errorHandler } = useErrorHandling({
        handlers: {
          404: original404,
          DEFAULT: () => {},
        },
      })

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      errorHandler(error)

      expect(original404).toHaveBeenCalledTimes(1)
    })

    it('應該允許運行時處理器覆蓋初始化處理器', () => {
      const original404 = vi.fn()
      const runtime404 = vi.fn()
      const { errorHandler } = useErrorHandling({
        handlers: {
          404: original404,
          DEFAULT: () => {},
        },
      })

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        404: runtime404,
      })

      expect(runtime404).toHaveBeenCalledTimes(1)
      expect(original404).not.toHaveBeenCalled()
    })

    it('應該合併初始化處理器和運行時處理器', () => {
      const original404 = vi.fn()
      const runtime500 = vi.fn()
      const { errorHandler } = useErrorHandling({
        handlers: {
          404: original404,
          DEFAULT: () => {},
        },
      })

      const error404 = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      const error500 = Object.assign(new Error('Server Error'), {
        statusCode: 500,
        data: { error: 'Server error' },
      }) as NuxtError<{ error: string }>

      errorHandler(error404, {
        500: runtime500,
      })

      errorHandler(error500, {
        500: runtime500,
      })

      expect(original404).toHaveBeenCalledTimes(1)
      expect(runtime500).toHaveBeenCalledTimes(1)
    })
  })

  describe('errorHandler - 錯誤拋出', () => {
    it('應該在沒有運行時 DEFAULT 處理器時使用初始化 DEFAULT', () => {
      const defaultHandler = vi.fn()
      const { errorHandler } = useErrorHandling({
        handlers: {
          DEFAULT: defaultHandler,
        },
      })

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      // 運行時僅提供其他狀態碼處理器，未提供 DEFAULT
      const handlersWithoutDefault = { 500: () => {} }

      expect(() => errorHandler(error, handlersWithoutDefault)).not.toThrow()
      expect(defaultHandler).toHaveBeenCalledTimes(1)
      expect(defaultHandler).toHaveBeenCalledWith({ message: 'Not found' })
    })

    it('應該在錯誤無效時拋出原始錯誤', () => {
      const { errorHandler } = useErrorHandling({
        handlers: {
          DEFAULT: () => {},
        },
      })

      const invalidError = { invalid: 'object' }

      expect(() => errorHandler(invalidError)).toThrow()
    })

    it('應該在只有初始化 DEFAULT 但運行時未提供處理器時不拋出錯誤', () => {
      const defaultHandler = vi.fn()
      const { errorHandler } = useErrorHandling({
        handlers: {
          DEFAULT: defaultHandler,
        },
      })

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      expect(() => errorHandler(error)).not.toThrow()
      expect(defaultHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('errorHandler - 不同錯誤類型', () => {
    it('應該處理 FetchError (有 response)', () => {
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Fetch failed'), {
        request: '/api/test',
        options: {},
        response: {
          status: 404,
          statusText: 'Not Found',
          _data: { message: 'Resource not found' },
        },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        404: handler404,
      })

      expect(handler404).toHaveBeenCalledTimes(1)
      expect(handler404).toHaveBeenCalledWith({ message: 'Resource not found' })
    })

    it('應該處理 NuxtError (使用 statusCode)', () => {
      const handler500 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Nuxt error'), {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        data: { error: 'Something went wrong' },
      }) as NuxtError<{ error: string }>

      errorHandler(error, {
        500: handler500,
      })

      expect(handler500).toHaveBeenCalledTimes(1)
      expect(handler500).toHaveBeenCalledWith({ error: 'Something went wrong' })
    })

    it('應該處理 NuxtError (使用 status)', () => {
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Nuxt error'), {
        status: 404,
        data: { message: 'Page not found' },
      }) as unknown as NuxtError<{ message: string }>

      errorHandler(error, {
        404: handler404,
      })

      expect(handler404).toHaveBeenCalledTimes(1)
      expect(handler404).toHaveBeenCalledWith({ message: 'Page not found' })
    })

    it('應該處理標準 Error', () => {
      const defaultHandler = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = new Error('Standard error')

      errorHandler(error, {
        DEFAULT: defaultHandler,
      } as any)

      expect(defaultHandler).toHaveBeenCalledTimes(1)
      expect(defaultHandler).toHaveBeenCalledWith(undefined)
    })
  })

  describe('errorHandler - 邊界情況', () => {
    it('應該處理狀態碼為 undefined 時使用 DEFAULT', () => {
      const defaultHandler = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Network error'), {
        request: '/api/test',
        options: {},
        status: 0,
        data: { message: 'Network failed' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        DEFAULT: defaultHandler,
      } as any)

      expect(defaultHandler).toHaveBeenCalledTimes(1)
    })

    it('應該處理多個處理器但只調用一個', () => {
      const handler404 = vi.fn()
      const handler500 = vi.fn()
      const defaultHandler = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      errorHandler(error, {
        404: handler404,
        500: handler500,
        DEFAULT: defaultHandler,
      } as any)

      expect(handler404).toHaveBeenCalledTimes(1)
      expect(handler500).not.toHaveBeenCalled()
      expect(defaultHandler).not.toHaveBeenCalled()
    })

    it('應該處理空 data 物件', () => {
      const handler404 = vi.fn()
      const { errorHandler } = useErrorHandling()

      const error = Object.assign(new Error('Not Found'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: null,
      }) as FetchError<null>

      errorHandler(error, {
        404: handler404,
      })

      expect(handler404).toHaveBeenCalledTimes(1)
      // null 或 undefined 都會被標準化為 undefined
      expect(handler404).toHaveBeenCalledWith(undefined)
    })

    it('應該處理複雜的 data 結構', () => {
      const handler422 = vi.fn()
      const { errorHandler } = useErrorHandling()

      interface ValidationError {
        errors: Array<{ field: string, message: string }>
        timestamp: number
      }

      const error = Object.assign(new Error('Validation Failed'), {
        request: '/api/test',
        options: {},
        status: 422,
        data: {
          errors: [
            { field: 'email', message: 'Invalid email' },
            { field: 'password', message: 'Too short' },
          ],
          timestamp: Date.now(),
        },
      }) as FetchError<ValidationError>

      errorHandler(error, {
        422: handler422,
      })

      expect(handler422).toHaveBeenCalledTimes(1)
      expect(handler422).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' }),
          ]),
        }),
      )
    })
  })

  describe('導出的工具函數', () => {
    it('應該正確導出 isFetchError', () => {
      const { isFetchError } = useErrorHandling()

      const fetchError = Object.assign(new Error('Fetch failed'), {
        request: '/api/test',
        options: {},
        status: 404,
      })

      expect(isFetchError(fetchError)).toBe(true)
      expect(isFetchError(new Error('Normal error'))).toBe(false)
    })

    it('應該正確導出 isNuxtError', () => {
      const { isNuxtError } = useErrorHandling()

      const nuxtError = Object.assign(new Error('Nuxt error'), {
        statusCode: 500,
      })

      expect(isNuxtError(nuxtError)).toBe(true)
      expect(isNuxtError(new Error('Normal error'))).toBe(false)
    })

    it('應該正確導出 validateError', () => {
      const { validateError } = useErrorHandling()

      const validError = new Error('Valid error')
      const invalidError = { invalid: 'object' }

      expect(validateError(validError)).toBe(true)
      expect(() => validateError(invalidError)).toThrow()
    })

    it('應該正確導出 normalizeError', () => {
      const { normalizeError } = useErrorHandling()

      const error = Object.assign(new Error('Test error'), {
        request: '/api/test',
        options: {},
        status: 404,
        data: { message: 'Not found' },
      }) as FetchError<{ message: string }>

      const normalized = normalizeError(error)

      expect(normalized).toMatchObject({
        message: 'Test error',
        statusCode: 404,
        data: { message: 'Not found' },
      })
    })
  })

  describe('TypeScript 類型安全', () => {
    it('應該支持泛型類型參數', () => {
      interface CustomErrorData {
        code: string
        details: string[]
      }

      const handler = vi.fn()
      const { errorHandler } = useErrorHandling<CustomErrorData>()

      const error = Object.assign(new Error('Custom error'), {
        request: '/api/test',
        options: {},
        status: 400,
        data: {
          code: 'VALIDATION_ERROR',
          details: ['Field 1 invalid', 'Field 2 required'],
        },
      }) as FetchError<CustomErrorData>

      errorHandler(error, {
        400: handler,
      })

      expect(handler).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        details: ['Field 1 invalid', 'Field 2 required'],
      })
    })
  })
})
