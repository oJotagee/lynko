const HASH_OPTIONS = { algorithm: 'bcrypt', cost: 10 } as const
const DUMMY_HASH = await Bun.password.hash('dummy-password-for-timing', HASH_OPTIONS)

export function hashPassword(password: string) {
  return Bun.password.hash(password, HASH_OPTIONS)
}

export async function verifyPassword(password: string, hash: string | undefined) {
  if (!hash) {
    await Bun.password.verify(password, DUMMY_HASH)

    return false
  }

  return Bun.password.verify(password, hash)
}
