import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllSlugs } from "@/lib/blog-posts";
import type { BlogSection } from "@/lib/blog-posts";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://luminaweb.app";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | LuminaWeb Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: ["LuminaWeb"],
      siteName: "LuminaWeb",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

function renderSection(section: BlogSection, index: number) {
  switch (section.type) {
    case "h2":
      return (
        <h2
          key={index}
          className="text-2xl font-semibold text-gray-900 mt-10 mb-4"
        >
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={index}
          className="text-xl font-semibold text-gray-800 mt-7 mb-3"
        >
          {section.text}
        </h3>
      );
    case "p":
      return (
        <p key={index} className="text-gray-600 leading-relaxed mb-4">
          {section.text}
        </p>
      );
    case "ul":
      return (
        <ul
          key={index}
          className="list-disc list-inside space-y-2 mb-4 text-gray-600"
        >
          {section.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol
          key={index}
          className="list-decimal list-inside space-y-2 mb-4 text-gray-600"
        >
          {section.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-gray-200 pl-4 italic text-gray-500 my-6"
        >
          {section.text}
        </blockquote>
      );
    case "cta":
      return (
        <div
          key={index}
          className="bg-gray-50 rounded-xl p-6 mt-10 text-center"
        >
          <p className="text-gray-700 mb-4">{section.text}</p>
          <a
            href={section.href || "/"}
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            {section.ctaText || "Get Started Free"}
          </a>
        </div>
      );
    default:
      return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: "LuminaWeb",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "LuminaWeb",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mb-6">
        <Link
          href="/blog"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← All posts
        </Link>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {post.category}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            {post.readingTime} min read
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          {post.description}
        </p>
        <div className="mt-5 text-sm text-gray-400">
          <time dateTime={post.publishedAt}>
            Published{" "}
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {post.updatedAt !== post.publishedAt && (
            <>
              {" "}
              · Updated{" "}
              <time dateTime={post.updatedAt}>
                {new Date(post.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </>
          )}
        </div>
      </header>

      <div className="prose-gray max-w-none">
        {post.content.map((section, i) => renderSection(section, i))}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-100">
        <Link
          href="/blog"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to all posts
        </Link>
      </div>
    </article>
  );
}
