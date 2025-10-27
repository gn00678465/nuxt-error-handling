<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'

const { data, error, refresh } = await useAsyncData('error-example', async () => {
  return await $fetch('https://dummyjson.com/http/404/Hello_Peter', {
    retry: 0,
    method: 'GET',
  }).catch((error) => {
    console.log("🚀 ~ Caught an error during fetch:", error)
    console.log("🚀 ~ Error details:", {
      message: error.message,
      statusCode: error.statusCode,
      data: error.data,
      name: error.name,
    })
    throw error
  })
}, {
  server: true,
  lazy: true
})

const { mutate } = useMutation({
  mutationKey: ['example-post-mutation'],
  mutationFn: async (data: string) => {
    return await $fetch(`https://dummyjson.com/http/400/${data}`, {
      method: 'POST',
    })
  },
  onError: (error) => {

  },
})

if (error.value) {
  console.log("🚀 ~ nuxt error is instanceof Error:", error.value instanceof Error)
  console.log("🚀 ~ nuxt error is:", error.value)

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
