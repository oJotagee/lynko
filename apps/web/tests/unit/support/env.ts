// O Auth.js lê estas variáveis ao importar @/lib/auth; precisam existir antes de qualquer spec.
process.env.AUTH_SECRET = 'test-only-secret-with-at-least-32-characters'
process.env.AUTH_URL = 'http://localhost:3000'
process.env.AUTH_TRUST_HOST = 'true'
