import { defineNuxtModule, addPlugin, createResolver, addImportsDir } from '@nuxt/kit'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxtjs/error-handling',
    configKey: 'errorHandling',
  },
  defaults: {},
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    addPlugin(resolver.resolve('./runtime/plugins/error-handling'))

    addImportsDir(resolver.resolve('./runtime/composables'))
  },
})
