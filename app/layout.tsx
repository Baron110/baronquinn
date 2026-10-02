import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { CartProvider } from "@/lib/cart-context";
import PageViewTracker from "@/components/PageViewTracker";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display"
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Baronquinn — gifts worth sending",
  description: "Curated gifts, delivered. Flowers, keepsakes, and custom pieces for every occasion."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://baronquinn.com").trim().replace(/\/+$/, "");

  // Tells Google explicitly "this is a real business," not just a name —
  // the clearest signal available for disambiguating from unrelated
  // same-name topics in search results.
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Baronquinn",
    alternateName: ["Baron-Quinn", "The Gift Guy"],
    url: siteUrl,
    logo: `${siteUrl}/logo-mark.png`,
    description: "Curated gifts, delivered. Flowers, keepsakes, and custom pieces for every occasion."
  };

  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-sans bg-paper text-ink antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Providers>
          <CartProvider>{children}</CartProvider>
        </Providers>
        <PageViewTracker />
      </body>
    </html>
  );
}