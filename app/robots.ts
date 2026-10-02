import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://baronquinn.com").trim().replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/08088adminpanel", "/api/", "/orders/", "/wallet", "/studio", "/checkout", "/pay/"]
    },
    sitemap: `${base}/sitemap.xml`
  };
}
