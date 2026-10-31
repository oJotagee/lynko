import axios, { type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
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
