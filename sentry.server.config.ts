import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./sentry.shared";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: sanitizeSentryEvent,
});
