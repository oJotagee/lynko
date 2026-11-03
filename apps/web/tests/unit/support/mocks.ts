import { mock, spyOn } from 'bun:test'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

import { api } from '@/lib/api'

export const authorization = { Authorization: 'Bearer access-token' }

export const revalidatePath = mock((..._args: unknown[]) => undefined)

// mock.module vale para o processo inteiro: os outros specs continuam usando o restante do módulo real.
const realAuthorization = await import('@/lib/get-api-authorization')

mock.module('next/cache', () => ({ revalidatePath }))
mock.module('@/lib/get-api-authorization', () => ({
  ...realAuthorization,
  getApiAuthorization: async () => authorization,
}))

// spyOn em vez de mock.module: o auth.spec usa o mesmo axios com adapter próprio.
export function spyOnApi() {
  return {
    get: spyOn(api, 'get'),
    post: spyOn(api, 'post'),
    put: spyOn(api, 'put'),
    patch: spyOn(api, 'patch'),
    delete: spyOn(api, 'delete'),
  }
}

export function createAxiosError(status: number, data?: unknown) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config,
    data,
  })
}
