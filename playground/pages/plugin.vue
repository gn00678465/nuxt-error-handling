<template>
  <div>
    <p>Nuxt error handler plugin!</p>
    <div>{{ data }}</div>
    <div>
      <h2>Error Data</h2>
      <pre>
        <code>
          {{ errData }}
        </code>
      </pre>
      <h2>Normalize Error</h2>
      <pre>
        <code>
          {{ normalizeError }}
        </code>
      </pre>
      <button @click="() => { refresh() }">
        重試
      </button>
    </div>
    <br>
  </div>
</template>

<script setup lang="ts">
import type { NormalizedError } from 'nuxt/error-handling'

const { $defineErrorHandler, $normalizeError } = useNuxtApp()

const errData = ref<unknown | null>(null)
const normalizeError = ref<NormalizedError | null>(null)

const errorHandler = $defineErrorHandler({
  handlers: {
    DEFAULT(errorData, error) {
      console.log('🚀 ~ DEFAULT error handler(plugin):', errorData)
      console.log('🚀 ~ Original error(plugin):', error)
      errData.value = errorData
      normalizeError.value = $normalizeError(error)
    },
  },
})

const { data, refresh } = await useAsyncData('error-example', async () => {
  return await $fetch('https://dummyjson.com/http/404/Hello_Peter', {
    retry: 0,
    method: 'GET',
  }).catch(errorHandler)
}, {
  server: true,
  lazy: true,
})
</script>

<style scoped>

</style>
