<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps({
  error: Object as () => NuxtError,
})
</script>

<template>
  <div>
    <h1>{{ error?.statusCode }}</h1>
    <pre>{{ error?.statusMessage }}</pre>
    <NuxtLink to="/">Go back home</NuxtLink>
  </div>
</template>
