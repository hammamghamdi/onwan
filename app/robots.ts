import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/login",
        "/register",
        "/setup",
        "/success",
        "/manage",
        "/addresses",
        "/insights",
      ],
      disallow: ["/api/", "/*"],
    },
  };
}
