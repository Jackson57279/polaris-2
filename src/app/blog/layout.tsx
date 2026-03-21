import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 py-4">
        <div className="mx-auto max-w-3xl px-6">
          <a
            href="/"
            className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors"
            aria-label="LuminaWeb home"
          >
            LuminaWeb
          </a>
          <span className="ml-3 text-sm text-gray-400">Cloud IDE Blog</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="mx-auto max-w-3xl px-6 text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} LuminaWeb — Browser-based cloud
            IDE with AI assistance.{" "}
            <a href="/" className="text-gray-600 hover:underline">
              Start coding free
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
