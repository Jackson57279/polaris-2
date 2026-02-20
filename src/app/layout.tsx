import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

import "allotment/dist/style.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: baseUrl ? new URL(baseUrl) : undefined,
  title: {
    default: "Polaris – Cloud IDE with AI",
    template: "%s | Polaris",
  },
  description:
    "Browser-based IDE with AI suggestions, quick edit (Cmd+K), in-editor chat, and GitHub integration. Build and run code in the cloud.",
  keywords: [
    "cloud IDE",
    "online code editor",
    "AI code editor",
    "Cursor alternative",
    "browser IDE",
    "collaborative coding",
  ],
  authors: [{ name: "Polaris" }],
  creator: "Polaris",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Polaris",
    title: "Polaris – Cloud IDE with AI",
    description:
      "Browser-based IDE with AI suggestions, quick edit, and GitHub integration.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Polaris – Cloud IDE with AI",
    description:
      "Browser-based IDE with AI suggestions, quick edit, and GitHub integration.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${plexMono.variable} antialiased`}
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
  );
}
