const UNIQUE_VIOLATION = '23505'

export function getUniqueViolation(error: unknown) {
  const cause =
    error instanceof Error
      ? (error.cause as { code?: string; constraint?: string } | undefined)
      : undefined

  if (cause?.code !== UNIQUE_VIOLATION) return null

  return cause.constraint ?? 'unknown'
}
