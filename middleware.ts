import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logRequestStart, logRequestEnd } from '@/lib/middleware/logging'

export function middleware(request: NextRequest) {
  // Log all API requests
  const logContext = logRequestStart(request)

  const response = NextResponse.next()

  // Add request ID to headers for tracing
  response.headers.set('x-request-id', logContext.requestId)

  logRequestEnd(logContext)

  return response
}

export const config = {
  matcher: '/api/:path*',
}
