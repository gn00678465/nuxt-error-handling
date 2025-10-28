<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'

const { $validateError, $normalizeError } = useNuxtApp()
const { errorHandler, validateError } = useErrorHandling({
  handlers: {
    DEFAULT(errorData, error) {
      console.log('🚀 ~ DEFAULT error handler:', errorData)
      console.log('🚀 ~ Original error:', error)
    },
  },
})

const { data, error, refresh } = await useAsyncData('error-example', async () => {
  return await $fetch('https://dummyjson.com/http/404/Hello_Peter', {
    retry: 0,
    method: 'GET',
  }).catch((error) => {
    if ($validateError<unknown>(error)) {
      const normalizedError = $normalizeError(error)
      throw createError({
        ...normalizedError,
        message: `Custom Error Message: ${normalizedError.message}`,
        fatal: true,
      })
    }
    throw error
  })
}, {
  server: true,
  lazy: true,
})

const { mutate } = useMutation({
  mutationKey: ['example-post-mutation'],
  mutationFn: async (data: string) => {
    return await $fetch(`https://dummyjson.com/http/400/${data}`, {
      method: 'POST',
    })
  },
  onError: (error) => {
    if (validateError<unknown>(error)) {
      const normalizedError = $normalizeError(error)
      console.log('🚀 ~ Mutation normalized error:', normalizedError)
      errorHandler(error, {
        400: (errorData) => {
          console.log('🚀 ~ 400 error handler in Mutation:', errorData)
        },
      })
    }
  },
})

if (error.value) {
  console.log('🚀 ~ nuxt error is instanceof Error:', error.value instanceof Error)
  console.log('🚀 ~ nuxt error is:', error.value)
  errorHandler(error.value)
}
</script>

<template>
  <div>
    <p>Nuxt module playground!</p>
    <div>{{ data }}</div>
    <div>
      <h2>發生錯誤</h2>
      <pre>{{ error }}</pre>
      <button @click="() => { refresh() }">
        重試
      </button>
    </div>
    <br>
    <div>
      <h2>Mutation 範例</h2>
      <button @click="mutate('Bad_Request')">
        觸發 400 錯誤的 Mutation
      </button>
    </div>
  </div>
</template>

<style scoped>

</style>
