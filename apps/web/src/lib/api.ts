import axios, { type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  timeout: 15000,
  withCredentials: true,
})

// O Fastify rejeita requisição sem corpo que declare um Content-Type (400 para JSON, 415 para
// form). Com corpo, o axios continua enviando application/json.
api.interceptors.request.use((config) => {
  if (config.data == null) config.headers.setContentType(false)

  return config
})

const MAX_RETRIES = 2

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config as (InternalAxiosRequestConfig & { retryCount?: number }) | undefined
  const status = error.response?.status
  const retryable = !status || status >= 500

  if (config?.method !== 'get' || !retryable || (config.retryCount ?? 0) >= MAX_RETRIES) {
    throw error
  }

  const attempt = (config.retryCount ?? 0) + 1
  config.retryCount = attempt
  await new Promise((resolve) => setTimeout(resolve, 500 * attempt))

  return api.request(config)
})
