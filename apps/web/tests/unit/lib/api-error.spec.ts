import { describe, expect, it } from 'bun:test'
import { AxiosError } from 'axios'

import { getApiErrorMessage } from '@/lib/api-error'
import { getDashboardError } from '@/lib/get-dashboard-error'
import { createAxiosError } from '../support/mocks'

const fallback = 'Não foi possível concluir'

describe('getApiErrorMessage', () => {
  it('returns the fallback for errors that are not from axios', () => {
    expect(getApiErrorMessage(new Error('boom'), fallback)).toBe(fallback)
  })

  it('returns the network message when there is no response', () => {
    expect(getApiErrorMessage(new AxiosError('Network Error'), fallback)).toBe(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    )
  })

  it.each([
    [401, 'Sua sessão expirou. Entre novamente para continuar.'],
    [429, 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.'],
  ])('maps status %i', (status, message) => {
    expect(getApiErrorMessage(createAxiosError(status), fallback)).toBe(message)
  })

  it('hides server errors behind the fallback', () => {
    expect(getApiErrorMessage(createAxiosError(500, { message: 'stack' }), fallback)).toBe(fallback)
  })

  it('returns the API message for client errors', () => {
    expect(getApiErrorMessage(createAxiosError(400, { message: 'Invalid' }), fallback)).toBe(
      'Invalid',
    )
  })
})

describe('getDashboardError', () => {
  it('translates the known API messages', () => {
    expect(
      getDashboardError(createAxiosError(409, { message: 'Username already taken' }), fallback),
    ).toBe('Este nome de usuário já está em uso.')
  })

  it('never shows an untranslated API message', () => {
    expect(
      getDashboardError(createAxiosError(400, { message: 'Validation error' }), fallback),
    ).toBe(fallback)
  })

  it('keeps the session and rate limit messages', () => {
    expect(getDashboardError(createAxiosError(401), fallback)).toBe(
      'Sua sessão expirou. Entre novamente para continuar.',
    )
  })

  it('returns the fallback for validation errors thrown before the request', () => {
    expect(getDashboardError(new Error('ZodError'), fallback)).toBe(fallback)
  })
})
