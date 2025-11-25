import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Note: instrumentation.ts is supported by default in Next.js 16+
  // No need for experimental.instrumentationHook
};

export default nextConfig;
