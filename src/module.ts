import { defineNuxtModule, addPlugin, createResolver, addImportsDir, addTypeTemplate } from '@nuxt/kit'
import { name, version } from '../package.json'
import fs from 'node:fs'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'errorHandling',
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    addPlugin(resolver.resolve('./runtime/plugins/error-handling'))

    addImportsDir(resolver.resolve('./runtime/composables'))

    // 添加類型聲明
    addTypeTemplate({
      filename: 'types/error-handling.d.ts',
      getContents: () => {
        const normalizedError = fs.readFileSync(resolver.resolve('./runtime/types/normalizedError.ts'), 'utf-8')
        const handler = fs.readFileSync(resolver.resolve('./runtime/types/handler.ts'), 'utf-8')

        return `
        declare module 'nuxt/error-handling' {
        ${normalizedError.replaceAll('export ', '')}
        ${handler.replaceAll('export ', '')}
        }
        `
      },
    })
  },
})
