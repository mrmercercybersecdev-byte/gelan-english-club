import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/profile", "/submit", "/meet/", "/verify/"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
