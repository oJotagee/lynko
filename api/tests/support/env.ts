process.env.NODE_ENV = 'test'

process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/lynko_test'

process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'

process.env.CORS_ORIGIN = 'http://localhost:3000'

process.env.AWS_REGION = 'us-east-1'

process.env.S3_BUCKET = 'lynko-test'

process.env.CDN_URL = 'https://cdn.lynko.test'
