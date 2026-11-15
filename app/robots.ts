import type { MetadataRoute } from "next";

/**
 * Crawlers may fetch "/" so they can read its robots meta tag
 * (noindex unless the admin turned on "검색엔진 노출"). The admin area is always off-limits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth"] },
  };
}
