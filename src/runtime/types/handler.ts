import type { StatusCodes as SC } from "./status-codes";

type StatusCodes = `${SC}`

type Handler<T> = (errorData: T | undefined) => void

export type Handlers<T = any> = Partial<Record<StatusCodes, Handler<T>>>

export type HandlersWithDefault<T = any> = Handlers<T> & {
  DEFAULT: Handler<T>
}
