import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/structured-data";

import "allotment/dist/style.css";
import "./globals.css";

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
    default: "LuminaWeb – Cloud IDE with AI",
    template: "%s | LuminaWeb",
  },
  description:
    "Browser-based IDE with AI suggestions, quick edit (Cmd+K), in-editor chat, and GitHub integration. Build and run code in the cloud.",
  keywords: [
    "cloud IDE",
    "browser IDE",
    "online code editor",
    "AI code editor",
    "AI IDE",
    "Cursor alternative",
    "Cursor alternative browser",
    "VS Code online",
    "browser-based coding",
    "WebContainer IDE",
    "no-install code editor",
    "GitHub IDE",
    "web development IDE",
    "TypeScript online editor",
    "React online IDE",
    "Next.js cloud IDE",
    "code in browser",
    "LuminaWeb",
  ],
  authors: [{ name: "LuminaWeb" }],
  creator: "LuminaWeb",
  publisher: "LuminaWeb",
  category: "Developer Tools",
  classification: "Integrated Development Environment (IDE), Developer Tool",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LuminaWeb",
    title: "LuminaWeb – Cloud IDE with AI",
    description:
      "Browser-based cloud IDE with AI code suggestions, Cmd+K quick edit, GitHub integration, and WebContainer-powered in-browser execution. No installation required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LuminaWeb – Cloud IDE with AI",
    description:
      "Browser-based cloud IDE with AI code suggestions, Cmd+K quick edit, GitHub integration, and in-browser execution.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <StructuredData />
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </body>
      </html>
  );
}
