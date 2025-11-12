# @nuxtjs/error-handling

一個為 Nuxt 4 打造的輕量錯誤處理模組，目標是提供統一且可擴充的錯誤處理機制。模組可辨識常見的錯誤來源（例如 FetchError、NuxtError 與一般 Error），並允許您依 HTTP 狀態碼指定不同的處理器（handler）。

## 核心特性

- 支援識別並標準化 FetchError、NuxtError 與標準 Error
- 根據 HTTP 狀態碼（如 400、404、500）定義分流處理器
- 提供 Nuxt 插件（可透過 `useNuxtApp()` 取得全域工具）與組合函式 `useErrorHandling()`（便於在 setup 中使用）
- 提供簡潔的 API：`validateError`、`isFetchError`、`isNuxtError`、`normalizeError`、`errorHandler`

## 安裝

### Option 1: 從 github 安裝

```bash
pnpm add gn00678465/nuxt-error-handling
```
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/error-handling'],
})
```

### Options 2: 本地端

在本地開發或從原始碼測試，可在 `nuxt.config.ts` 中直接引用本套件的路徑（playground 範例）：

```ts
export default defineNuxtConfig({
  modules: ['../src/module'],
})
```

## 主要 API 與型別概述

模組會在 Nuxt 應用中透過 plugin 提供下列工具（可透過 `useNuxtApp()` 存取）：

- `$validateError(error)`：驗證傳入是否為已支援的錯誤（FetchError / NuxtError / Error），若不是會丟錯。
- `$isFetchError(error)`、`$isNuxtError(error)`：判斷錯誤來源。
- `$normalizeError(error)`：將錯誤標準化為可讀的結構（見下方）。
- `$defineErrorHandler(handlers)`：定義錯誤處理器工廠函式，可預先設定預設處理器，回傳一個 `errorHandler` 函式用於處理錯誤。

此外，模組提供 `useErrorHandling()` 組合函式，可在 setup 中直接使用相同的工具（不需使用 `$` 前綴）：

- `const { errorHandler, validateError, normalizeError, isFetchError, isNuxtError } = useErrorHandling()`

Handler 型別與行為：

- Handler 為 `(errorData: T | undefined, error?: unknown) => void`。
- `handlers` 是一個物件，key 為 HTTP status code 的字串（例如 `'400'`, `'404'`），也可提供 `DEFAULT` 作為預設處理。

NormalizedError（由 `normalizeError` 回傳）的欄位：

- `message: string`
- `name: string`
- `stack?: string`
- `statusCode?: number`
- `statusMessage?: string`
- `data?: T`（若 FetchError 或 NuxtError 帶有 body/data，會被填入）
- `cause?: unknown`

## 使用範例

以下範例包含三個場景：

1. 在 `useAsyncData` 中, 將 fetch 的錯誤轉為 NuxtError 並交由 Nuxt 的錯誤頁面處理。
2. 使用其他第三方: 如 vue-query `useMutation` 在 onError 中用 `errorHandler` 針對特定 status 做處理。
3. 在元件中直接使用 `errorHandler` 呼叫預設處理。

示範程式片段（Typescript / setup）：

```ts
// 透過 useNuxtApp() 存取 plugin 提供的變數
const { $validateError, $normalizeError } = useNuxtApp()

// 使用組合函式（在 setup 中）
const { errorHandler, validateError } = useErrorHandling({
  handlers: {
    DEFAULT(errorData, error) {
      console.log('DEFAULT error handler', errorData, error)
    },
  },
})

// 範例：在 useAsyncData 裡處理 fetch 的錯誤，並將其轉成 Nuxt 的 createError()
const { data, error, refresh } = await useAsyncData('error-example', async () => {
  return await $fetch('https://example.com/404', { retry: 0 }).catch((err) => {
    if ($validateError(err)) {
      const normalized = $normalizeError(err)
      throw createError({
        ...normalized,
        message: `Custom Error Message: ${normalized.message}`,
        fatal: true,
      })
    }
    throw err
  })
}, { server: true, lazy: true })

// 範例：在 mutation 的 onError 中，使用 validate + normalize 並依狀態碼分流
const { mutate } = useMutation({
  mutationFn: async (payload: string) => $fetch(`https://example.com/400/${payload}`, { method: 'POST' }),
  onError(error) {
    if (validateError(error)) {
      const normalized = normalizeError(error)
      errorHandler(error, {
        400: (data) => {
          console.log('400 handler', data)
        },
      })
    }
  },
})

// 若頁面上的 `error`（Nuxt error store）存在，也可直接傳入 errorHandler
if (error.value) {
  errorHandler(error.value)
}
```

重點說明：

- `validateError` / `isFetchError` / `isNuxtError` 幫助你在不同情境（fetch、mutation、server）先判斷錯誤類型。
- `normalizeError` 會把不同來源的錯誤轉成一致的欄位，方便 handler 使用。
- `errorHandler` 會優先嘗試依 `statusCode` 分流，若未命中則可使用 `DEFAULT` 處理器。

## 常見用法摘要

- 全域工具：
  - `useNuxtApp()` 可取得 `$validateError`、`$normalizeError`、`$errorHandler`（plugin 提供）
- 組合函式：
  - `useErrorHandling()` 在 setup 內直接使用（回傳 `errorHandler` 與判斷/標準化工具）

## 開發與貢獻

專案包含一個 `playground/` 範例，可在本地開發時啟動 Nuxt playground：

```bash
pnpm install
pnpm run dev
```

常見腳本（package.json）：

- `pnpm run dev`：啟動 playground 與本地開發環境
- `pnpm run dev:build`：建置 playground
- `pnpm run test`：執行單元測試（Vitest）

歡迎提交 Issue / PR，或在本地修改 `src/` 並用 playground 驗證行為。
