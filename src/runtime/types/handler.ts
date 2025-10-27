import type { StatusCodes as SC } from './status-codes'

type StatusCodes = `${SC}`

type Handler<T> = (errorData: T | undefined) => void

export type Handlers<T = unknown> = Partial<Record<StatusCodes, Handler<T>>>

export type HandlersWithDefault<T = unknown> = Handlers<T> & {
  DEFAULT: Handler<T>
}
