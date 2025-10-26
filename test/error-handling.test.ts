import { describe, it, expect } from 'vitest'
import {
  validateError,
  isFetchError,
  isFetchContext,
  isFetchResponse,
  isNuxtError,
  normalizeError,
} from '../src/runtime/utils/error-handling'

describe('error-handling utilities', () => {
  describe('validateError', () => {
    it('應該驗證 FetchError 並返回 true', () => {
      const fetchError = Object.assign(new Error('Fetch failed'), {
        request: '/api/test',
        options: {},
        response: { status: 404 },
        status: 404,
      })
      expect(validateError(fetchError)).toBe(true)
    })

    it('應該驗證 NuxtError 並返回 true', () => {
      const nuxtError = Object.assign(new Error('Nuxt error'), {
        statusCode: 500,
      })
      expect(validateError(nuxtError)).toBe(true)
    })

    it('應該驗證標準 Error 並返回 true', () => {
      const error = new Error('Standard error')
      expect(validateError(error)).toBe(true)
    })

    it('應該對未知類型拋出錯誤', () => {
      const unknownError = { invalid: 'object' }
      expect(() => validateError(unknownError)).toThrow()
    })
  })

  describe('isFetchError', () => {
    it('應該識別有效的 FetchError', () => {
      const fetchError = Object.assign(new Error('Fetch failed'), {
        request: '/api/test',
        options: {},
        response: { status: 404 },
        status: 404,
      })
      expect(isFetchError(fetchError)).toBe(true)
    })

    it('應該識別只有 status 的 FetchError', () => {
      const fetchError = Object.assign(new Error('Fetch failed'), {
        request: '/api/test',
        options: {},
        status: 404,
      })
      expect(isFetchError(fetchError)).toBe(true)
    })

    it('應該拒絕缺少 request 的錯誤', () => {
      const invalidError = Object.assign(new Error('Invalid'), {
        options: {},
        response: {},
      })
      expect(isFetchError(invalidError)).toBe(false)
    })

    it('應該拒絕非 Error 實例', () => {
      const notError = {
        request: '/api/test',
        options: {},
        response: {},
      }
      expect(isFetchError(notError)).toBe(false)
    })

    it('應該拒絕 null 和 undefined', () => {
      expect(isFetchError(null)).toBe(false)
      expect(isFetchError(undefined)).toBe(false)
    })
  })

  describe('isFetchContext', () => {
    it('應該識別有效的 FetchContext', () => {
      const context = {
        request: '/api/test',
        options: { method: 'GET' },
      }
      expect(isFetchContext(context)).toBe(true)
    })

    it('應該拒絕缺少 request 的 context', () => {
      const invalidContext = {
        options: { method: 'GET' },
      }
      expect(isFetchContext(invalidContext)).toBe(false)
    })

    it('應該拒絕缺少 options 的 context', () => {
      const invalidContext = {
        request: '/api/test',
      }
      expect(isFetchContext(invalidContext)).toBe(false)
    })

    it('應該拒絕 null 和 undefined', () => {
      expect(isFetchContext(null)).toBe(false)
      expect(isFetchContext(undefined)).toBe(false)
    })

    it('應該拒絕非物件類型', () => {
      expect(isFetchContext('string')).toBe(false)
      expect(isFetchContext(123)).toBe(false)
    })
  })

  describe('isFetchResponse', () => {
    it('應該識別有效的 FetchResponse', () => {
      const response = {
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        ok: true,
      }
      expect(isFetchResponse(response)).toBe(true)
    })

    it('應該拒絕缺少必要屬性的 response', () => {
      const invalidResponse = {
        status: 200,
        statusText: 'OK',
      }
      expect(isFetchResponse(invalidResponse)).toBe(false)
    })

    it('應該拒絕 status 不是數字的 response', () => {
      const invalidResponse = {
        status: '200',
        statusText: 'OK',
        headers: new Headers(),
        ok: true,
      }
      expect(isFetchResponse(invalidResponse)).toBe(false)
    })

    it('應該拒絕 null 和 undefined', () => {
      expect(isFetchResponse(null)).toBe(false)
      expect(isFetchResponse(undefined)).toBe(false)
    })
  })

  describe('isNuxtError', () => {
    it('應該識別有 statusCode 的 NuxtError', () => {
      const nuxtError = Object.assign(new Error('Nuxt error'), {
        statusCode: 500,
      })
      expect(isNuxtError(nuxtError)).toBe(true)
    })

    it('應該識別有 status 的 NuxtError', () => {
      const nuxtError = Object.assign(new Error('Nuxt error'), {
        status: 404,
      })
      expect(isNuxtError(nuxtError)).toBe(true)
    })

    it('應該拒絕沒有 statusCode 或 status 的 Error', () => {
      const error = new Error('Standard error')
      expect(isNuxtError(error)).toBe(false)
    })

    it('應該拒絕非 Error 實例', () => {
      const notError = {
        statusCode: 500,
        message: 'Error',
      }
      expect(isNuxtError(notError)).toBe(false)
    })

    it('應該拒絕 null 和 undefined', () => {
      expect(isNuxtError(null)).toBe(false)
      expect(isNuxtError(undefined)).toBe(false)
    })
  })

  describe('normalizeError', () => {
    describe('FetchError 處理', () => {
      it('應該正確標準化 FetchError', () => {
        const fetchError = Object.assign(new Error('Fetch failed'), {
          name: 'FetchError',
          request: '/api/test',
          options: {},
          response: {
            status: 404,
            statusText: 'Not Found',
            _data: { error: 'Resource not found' },
          },
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' },
          stack: 'Error stack',
        })

        const normalized = normalizeError(fetchError)

        expect(normalized).toEqual({
          cause: undefined,
          data: { error: 'Resource not found' },
          message: 'Fetch failed',
          name: 'FetchError',
          stack: 'Error stack',
          statusCode: 404,
          statusMessage: 'Not Found',
        })
      })

      it('應該從 response 中提取資料', () => {
        const fetchError = Object.assign(new Error('Fetch failed'), {
          request: '/api/test',
          options: {},
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            _data: { error: 'Server error' },
          },
        })

        const normalized = normalizeError(fetchError)

        expect(normalized.statusCode).toBe(500)
        expect(normalized.statusMessage).toBe('Internal Server Error')
        expect(normalized.data).toEqual({ error: 'Server error' })
      })

      it('應該使用 error.data 優先於 response._data', () => {
        const fetchError = Object.assign(new Error('Fetch failed'), {
          request: '/api/test',
          options: {},
          data: { error: 'Primary data' },
          response: {
            status: 400,
            _data: { error: 'Secondary data' },
          },
        })

        const normalized = normalizeError(fetchError)

        expect(normalized.data).toEqual({ error: 'Primary data' })
      })

      it('應該處理沒有 response 的 FetchError', () => {
        const fetchError = Object.assign(new Error('Network error'), {
          request: '/api/test',
          options: {},
          status: 0,
        })

        const normalized = normalizeError(fetchError)

        expect(normalized.statusCode).toBe(0)
        expect(normalized.statusMessage).toBe('Network error')
      })
    })

    describe('NuxtError 處理', () => {
      it('應該正確標準化 NuxtError', () => {
        const nuxtError = Object.assign(new Error('Page not found'), {
          name: 'NuxtError',
          statusCode: 404,
          statusMessage: 'Not Found',
          data: { path: '/missing' },
          stack: 'Error stack',
        })

        const normalized = normalizeError(nuxtError)

        expect(normalized).toEqual({
          cause: undefined,
          data: { path: '/missing' },
          message: 'Page not found',
          name: 'NuxtError',
          stack: 'Error stack',
          statusCode: 404,
          statusMessage: 'Not Found',
        })
      })

      it('應該使用 status 如果沒有 statusCode', () => {
        const nuxtError = Object.assign(new Error('Error'), {
          status: 500,
        })

        const normalized = normalizeError(nuxtError)

        expect(normalized.statusCode).toBe(500)
      })

      it('應該優先使用 statusCode', () => {
        const nuxtError = Object.assign(new Error('Error'), {
          statusCode: 404,
          status: 500,
        })

        const normalized = normalizeError(nuxtError)

        expect(normalized.statusCode).toBe(404)
      })

      it('應該使用 message 作為 statusMessage 的備選', () => {
        const nuxtError = Object.assign(new Error('Custom error'), {
          statusCode: 400,
        })

        const normalized = normalizeError(nuxtError)

        expect(normalized.statusMessage).toBe('Custom error')
      })
    })

    describe('標準 Error 處理', () => {
      it('應該正確標準化標準 Error', () => {
        const error = new Error('Something went wrong')
        error.name = 'TypeError'
        error.stack = 'Error stack'

        const normalized = normalizeError(error)

        expect(normalized).toEqual({
          cause: undefined,
          data: undefined,
          message: 'Something went wrong',
          name: 'TypeError',
          stack: 'Error stack',
          statusCode: undefined,
          statusMessage: undefined,
        })
      })

      it('應該處理帶有 cause 的 Error', () => {
        const cause = new Error('Original error')
        const error = new Error('Wrapper error', { cause })

        const normalized = normalizeError(error)

        expect(normalized.cause).toBe(cause)
      })

      it('應該使用預設名稱 "Error"', () => {
        const error = new Error('Test')
        error.name = ''

        const normalized = normalizeError(error)

        expect(normalized.name).toBe('Error')
      })
    })

    describe('未知錯誤處理', () => {
      it('應該對非錯誤物件拋出錯誤', () => {
        const unknownError = { message: 'Not an error' }
        expect(() => normalizeError(unknownError)).toThrow()
      })

      it('應該對 null 拋出錯誤', () => {
        expect(() => normalizeError(null)).toThrow()
      })

      it('應該對 undefined 拋出錯誤', () => {
        expect(() => normalizeError(undefined)).toThrow()
      })

      it('應該對字串拋出錯誤', () => {
        expect(() => normalizeError('error string')).toThrow()
      })

      it('應該對數字拋出錯誤', () => {
        expect(() => normalizeError(123)).toThrow()
      })
    })

    describe('型別參數', () => {
      it('應該支援自訂資料型別', () => {
        interface CustomData {
          code: string
          details: string
        }

        const fetchError = Object.assign(new Error('Custom error'), {
          request: '/api/test',
          options: {},
          data: { code: 'ERR_001', details: 'Detailed info' },
          status: 400,
        })

        const normalized = normalizeError<CustomData>(fetchError)

        expect(normalized.data).toEqual({
          code: 'ERR_001',
          details: 'Detailed info',
        })
      })
    })

    describe('transform 回調函式', () => {
      it('應該在不提供 transform 時返回標準化格式', () => {
        const error = new Error('Test error')
        const normalized = normalizeError(error)

        expect(normalized).toEqual({
          cause: undefined,
          data: undefined,
          message: 'Test error',
          name: 'Error',
          stack: error.stack,
          statusCode: undefined,
          statusMessage: undefined,
        })
      })

      it('應該使用 transform 函式轉換 FetchError', () => {
        interface ApiResponse {
          success: boolean
          error: {
            code: number
            message: string
          }
        }

        const fetchError = Object.assign(new Error('API Error'), {
          request: '/api/test',
          options: {},
          status: 404,
          data: { detail: 'Not found' },
        })

        const result = normalizeError<unknown, ApiResponse>(
          fetchError,
          normalized => ({
            success: false,
            error: {
              code: normalized.statusCode ?? 500,
              message: normalized.message,
            },
          }),
        )

        expect(result).toEqual({
          success: false,
          error: {
            code: 404,
            message: 'API Error',
          },
        })
      })

      it('應該使用 transform 函式轉換 NuxtError', () => {
        interface CustomErrorFormat {
          errorCode: number
          errorMessage: string
          timestamp: string
        }

        const nuxtError = Object.assign(new Error('Page not found'), {
          statusCode: 404,
          statusMessage: 'Not Found',
        })

        const result = normalizeError<unknown, CustomErrorFormat>(
          nuxtError,
          normalized => ({
            errorCode: normalized.statusCode ?? 500,
            errorMessage: normalized.statusMessage ?? normalized.message,
            timestamp: '2025-01-01T00:00:00Z',
          }),
        )

        expect(result).toEqual({
          errorCode: 404,
          errorMessage: 'Not Found',
          timestamp: '2025-01-01T00:00:00Z',
        })
      })

      it('應該使用 transform 函式轉換標準 Error', () => {
        interface SimpleError {
          msg: string
          type: string
        }

        const error = new Error('Something went wrong')
        error.name = 'TypeError'

        const result = normalizeError<unknown, SimpleError>(
          error,
          normalized => ({
            msg: normalized.message,
            type: normalized.name,
          }),
        )

        expect(result).toEqual({
          msg: 'Something went wrong',
          type: 'TypeError',
        })
      })

      it('應該在 transform 中存取所有標準化屬性', () => {
        const fetchError = Object.assign(new Error('Fetch failed'), {
          request: '/api/test',
          options: {},
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            _data: { error: 'Server error' },
          },
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Server error' },
          stack: 'Error stack',
        })

        const result = normalizeError(fetchError, (normalized) => {
          // 驗證所有屬性都可以在 transform 中存取
          expect(normalized.message).toBe('Fetch failed')
          expect(normalized.name).toBe('Error')
          expect(normalized.statusCode).toBe(500)
          expect(normalized.statusMessage).toBe('Internal Server Error')
          expect(normalized.data).toEqual({ error: 'Server error' })
          expect(normalized.stack).toBe('Error stack')

          return {
            fullError: normalized,
          }
        })

        expect(result).toHaveProperty('fullError')
        expect(result.fullError.message).toBe('Fetch failed')
      })

      it('應該支援複雜的轉換邏輯', () => {
        interface DetailedApiError {
          status: 'error'
          code: number
          title: string
          detail?: string
          meta?: {
            stackTrace?: string
            errorName: string
          }
        }

        const error = Object.assign(new Error('Validation failed'), {
          statusCode: 400,
          data: { field: 'email', issue: 'invalid format' },
        })

        const result = normalizeError<unknown, DetailedApiError>(
          error,
          normalized => ({
            status: 'error',
            code: normalized.statusCode ?? 500,
            title: normalized.message,
            detail: normalized.data ? JSON.stringify(normalized.data) : undefined,
            meta: {
              stackTrace: normalized.stack,
              errorName: normalized.name,
            },
          }),
        )

        expect(result).toEqual({
          status: 'error',
          code: 400,
          title: 'Validation failed',
          detail: JSON.stringify({ field: 'email', issue: 'invalid format' }),
          meta: {
            stackTrace: error.stack,
            errorName: 'Error',
          },
        })
      })

      it('應該在 transform 中處理 undefined 值', () => {
        const error = new Error('Simple error')

        const result = normalizeError(error, normalized => ({
          hasStatusCode: normalized.statusCode !== undefined,
          hasData: normalized.data !== undefined,
          message: normalized.message || 'Unknown error',
        }))

        expect(result).toEqual({
          hasStatusCode: false,
          hasData: false,
          message: 'Simple error',
        })
      })
    })
  })
})
