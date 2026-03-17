import type { MetadataRoute } from "next";

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";
const BASE_URL = isDevelopment
  ? "https://dev.livestock-trading.com"
  : "https://livestock-trading.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/auth/", "/api/"],
      },
      ...(isDevelopment
        ? [
            {
              userAgent: "*",
              disallow: ["/"],
            },
          ]
        : []),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
