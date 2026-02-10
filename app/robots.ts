import type { MetadataRoute } from "next";

const BASE_URL = "https://livestock-trading.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/auth/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
