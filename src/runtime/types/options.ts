import type { HandlersWithDefault } from './handler'

export interface ErrorHandlingDefaultOptions<TDefault> {
  handlers?: HandlersWithDefault<TDefault>
}
