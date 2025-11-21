import Fastify from 'fastify'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() }
  })

  return app
}
