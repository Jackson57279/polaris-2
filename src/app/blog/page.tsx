import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog-posts";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://luminaweb.app";

export const metadata: Metadata = {
  title: "Blog — LuminaWeb Cloud IDE",
  description:
    "Guides, tutorials, and insights on cloud IDEs, AI-assisted development, browser-based coding, and modern web development workflows.",
  openGraph: {
    title: "Blog — LuminaWeb Cloud IDE",
    description:
      "Guides on cloud IDEs, AI code editors, browser-based development, and GitHub integration.",
    url: `${baseUrl}/blog`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
};

export default function BlogIndexPage() {
  const postsByCategory = blogPosts.reduce<Record<string, typeof blogPosts>>(
    (acc, post) => {
      if (!acc[post.category]) acc[post.category] = [];
      acc[post.category].push(post);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        LuminaWeb Blog
      </h1>
      <p className="text-lg text-gray-500 mb-12">
        Guides and insights on cloud IDEs, AI-assisted development, and
        browser-based coding.
      </p>

      {Object.entries(postsByCategory).map(([category, posts]) => (
        <section key={category} className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
            {category}
          </h2>
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    {post.description}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · {post.readingTime} min read
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
