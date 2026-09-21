import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { CartProvider } from "@/lib/cart-context";
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
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-sans bg-paper text-ink antialiased`}>
        <Providers>
          <CartProvider>{children}</CartProvider>
        </Providers>
      </body>
    </html>
  );
}
