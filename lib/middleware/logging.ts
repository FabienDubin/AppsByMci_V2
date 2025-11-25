import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export interface RequestLogContext {
  requestId: string
  method: string
  path: string
  startTime: number
}

/**
 * Generates a unique request ID and logs the start of a request
 */
export function logRequestStart(request: NextRequest): RequestLogContext {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  logger.info({
    msg: 'Request started',
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
  })

  return {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    startTime,
  }
}

/**
 * Logs the completion of a request with response time
 */
export function logRequestEnd(context: RequestLogContext): void {
  const responseTime = Date.now() - context.startTime

  logger.info({
    msg: 'Request completed',
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    responseTime: `${responseTime}ms`,
  })
}
