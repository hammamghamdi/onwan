import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ggirbnywlkbbzowlbqlq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "onwans",
  project: process.env.SENTRY_PROJECT || "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
  silent: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
  routeManifestInjection: {
    exclude: [
      "/admin",
      /^\/admin\//,
      "/auth/callback",
      "/login",
      "/manage",
    ],
  },
  suppressOnRouterTransitionStartWarning: true,
  webpack: {
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true,
      removeTracing: true,
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
      excludeReplayCompressionWorker: true,
    },
  },
});
