const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

export const getAppBaseUrl = () => {
  if (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    localOriginPattern.test(window.location.origin)
  ) {
    return window.location.origin;
  }

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  return typeof window !== "undefined" ? window.location.origin : "";
};

export const createAppUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getAppBaseUrl();

  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
};

export const createPublicAddressUrl = (username: string) => {
  return createAppUrl(`/${encodeURIComponent(username)}`);
};

export const createDisplayUrl = (url: string) => {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
};
