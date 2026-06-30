const fallbackRedirect = "/addresses";

export const getSafeInternalRedirect = (value: string | null) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallbackRedirect;
  }

  try {
    const parsed = new URL(value, "https://onwans.local");

    if (parsed.origin !== "https://onwans.local") {
      return fallbackRedirect;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackRedirect;
  }
};
