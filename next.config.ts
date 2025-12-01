import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Note: instrumentation.ts is supported by default in Next.js 16+
  // No need for experimental.instrumentationHook

  // Enable standalone output for optimized Azure Web App deployment
  output: 'standalone',

  // Exclude Application Insights and Pino from Turbopack bundling
  // These packages use dynamic requires incompatible with Turbopack
  serverExternalPackages: [
    'applicationinsights',
    'diagnostic-channel-publishers',
    '@opentelemetry/instrumentation',
    '@azure/opentelemetry-instrumentation-azure-sdk',
    'pino',
    'pino-pretty',
    'thread-stream',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'appsbymciblob.blob.core.windows.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
