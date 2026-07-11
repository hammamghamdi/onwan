import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const sensitiveHeaderNames = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "x-forwarded-for",
  "x-real-ip",
  "apikey",
  "x-supabase-auth",
]);

const sensitiveTokenPattern =
  /\b(access_token|refresh_token|code|token|apikey)=([^&#\s]+)/gi;

type SentryRequest = NonNullable<ErrorEvent["request"]>;
type SentryHeaders = SentryRequest["headers"];
type SentryBreadcrumbs = ErrorEvent["breadcrumbs"];
type SentryExceptionValues = NonNullable<
  NonNullable<ErrorEvent["exception"]>["values"]
>;

const stripUrlSecrets = (value: string) => {
  const withoutTokens = value.replace(
    sensitiveTokenPattern,
    "$1=[Filtered]"
  );

  return withoutTokens.replace(/https?:\/\/[^\s"'<>]+|\/auth\/callback[^\s"'<>]*/g, (match) => {
    try {
      const parsed = match.startsWith("http")
        ? new URL(match)
        : new URL(match, "https://onwans.com");

      if (parsed.pathname === "/auth/callback") {
        return match.startsWith("http")
          ? `${parsed.origin}/auth/callback`
          : "/auth/callback";
      }

      return match.startsWith("http")
        ? `${parsed.origin}${parsed.pathname}`
        : parsed.pathname;
    } catch {
      return match.split(/[?#]/, 1)[0];
    }
  });
};

const sanitizeHeaders = (headers: SentryHeaders): SentryHeaders => {
  if (!headers) {
    return headers;
  }

  const sanitized: NonNullable<SentryHeaders> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (sensitiveHeaderNames.has(name.toLowerCase())) {
      continue;
    }

    sanitized[name] = value;
  }

  return sanitized;
};

const sanitizeRequestUrl = (url: string) => {
  try {
    const parsed = new URL(url, "https://onwans.com");

    if (parsed.pathname === "/auth/callback") {
      return url.startsWith("http")
        ? `${parsed.origin}/auth/callback`
        : "/auth/callback";
    }

    return url.startsWith("http")
      ? `${parsed.origin}${parsed.pathname}`
      : parsed.pathname;
  } catch {
    return url.split(/[?#]/, 1)[0];
  }
};

const sanitizeBreadcrumbs = (breadcrumbs: SentryBreadcrumbs) => {
  if (!breadcrumbs) {
    return breadcrumbs;
  }

  return breadcrumbs.map((breadcrumb) => {
    if (!breadcrumb || typeof breadcrumb !== "object") {
      return breadcrumb;
    }

    const sanitized = { ...breadcrumb } as Record<string, unknown>;

    if (typeof sanitized.message === "string") {
      sanitized.message = stripUrlSecrets(sanitized.message);
    }

    if (sanitized.data && typeof sanitized.data === "object") {
      const data = { ...(sanitized.data as Record<string, unknown>) };

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          data[key] = stripUrlSecrets(value);
        }
      }

      sanitized.data = data;
    }

    return sanitized;
  });
};

const sanitizeExceptionValues = (values: SentryExceptionValues) => {
  if (!values) {
    return values;
  }

  return values.map((value) => {
    if (!value || typeof value !== "object") {
      return value;
    }

    const sanitized = { ...value } as Record<string, unknown>;

    if (typeof sanitized.value === "string") {
      sanitized.value = stripUrlSecrets(sanitized.value);
    }

    return sanitized;
  });
};

export const sanitizeSentryEvent = (
  event: ErrorEvent,
  _hint: EventHint
): ErrorEvent | null => {
  if (event.request) {
    if (typeof event.request.url === "string") {
      event.request.url = sanitizeRequestUrl(event.request.url);
    }

    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.data;
    event.request.headers = sanitizeHeaders(event.request.headers);
  }

  delete event.user;

  if (typeof event.message === "string") {
    event.message = stripUrlSecrets(event.message);
  }

  event.breadcrumbs = sanitizeBreadcrumbs(event.breadcrumbs);

  if (event.exception?.values) {
    event.exception.values = sanitizeExceptionValues(event.exception.values);
  }

  return event;
};
