const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://luminaweb.app";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: "LuminaWeb",
  url: baseUrl,
  logo: {
    "@type": "ImageObject",
    url: `${baseUrl}/logo.svg`,
    caption: "LuminaWeb Cloud IDE",
  },
  description:
    "LuminaWeb is a cloud IDE (Integrated Development Environment) that runs entirely in your web browser. Write, edit, and run code with AI assistance, GitHub integration, and real-time project previews.",
  foundingDate: "2024",
  applicationCategory: "DeveloperApplication",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${baseUrl}/#software`,
  name: "LuminaWeb",
  alternateName: ["LuminaWeb Cloud IDE", "LuminaWeb IDE"],
  url: baseUrl,
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "Integrated Development Environment",
  operatingSystem: "Web Browser, Chrome, Firefox, Safari, Edge",
  browserRequirements: "Requires a modern web browser",
  softwareVersion: "2.0",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Free Plan",
      description: "Free tier with core cloud IDE features",
    },
  ],
  description:
    "LuminaWeb is a browser-based cloud IDE for writing, running, and deploying code. It is not a scraping service. LuminaWeb is a developer tool — an online code editor with AI-powered suggestions (Cmd+K quick edit), an in-editor AI chat assistant, GitHub import/export, WebContainer-based in-browser code execution, integrated terminal, real-time project preview, and CodeMirror 6 editor with full syntax highlighting.",
  featureList: [
    "AI code suggestions and inline completions",
    "Cmd+K quick edit — AI-powered refactoring in the editor",
    "In-editor AI chat assistant for code generation and debugging",
    "GitHub repository import and export",
    "WebContainer — run Node.js code directly in the browser",
    "Integrated browser terminal",
    "Real-time project preview",
    "Multi-file project management",
    "Syntax highlighting for JavaScript, TypeScript, HTML, CSS, and more",
    "One-click deploy to Vercel and Netlify",
    "No installation required",
  ],
  publisher: {
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "LuminaWeb",
  },
  isAccessibleForFree: true,
  keywords:
    "cloud IDE, browser IDE, online code editor, AI code editor, WebContainer IDE, Cursor alternative browser, no-install IDE",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is LuminaWeb?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LuminaWeb is a cloud IDE (Integrated Development Environment) that runs entirely in your web browser. It provides a complete coding environment with AI-powered code suggestions, Cmd+K quick edit, an in-editor AI chat assistant, GitHub integration, WebContainer-based code execution, and real-time project previews — with no installation required.",
      },
    },
    {
      "@type": "Question",
      name: "Is LuminaWeb a web scraping service or scraping tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. LuminaWeb is not a scraping service, scraping tool, or data extraction product. LuminaWeb is a cloud-based code editor and IDE built for software developers. It is a developer productivity tool for writing, editing, running, and deploying code in the browser.",
      },
    },
    {
      "@type": "Question",
      name: "How is LuminaWeb different from VS Code, Cursor, or other IDEs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LuminaWeb is a browser-based cloud IDE — there is nothing to install or configure. Unlike desktop IDEs such as VS Code or Cursor, LuminaWeb runs entirely in your browser using WebContainer technology for in-browser Node.js execution. You can open it on any device and start coding immediately.",
      },
    },
    {
      "@type": "Question",
      name: "Does LuminaWeb require installation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No installation is required. LuminaWeb is a web application — open it in any modern browser and start coding immediately. Your projects are saved in the cloud.",
      },
    },
    {
      "@type": "Question",
      name: "What programming languages does LuminaWeb support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "LuminaWeb supports JavaScript, TypeScript, React, HTML, CSS, JSON, Markdown, and other web technologies through CodeMirror 6 syntax highlighting. The AI assistant can help with many additional languages and frameworks.",
      },
    },
    {
      "@type": "Question",
      name: "Can LuminaWeb run code in the browser?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. LuminaWeb uses WebContainer technology to run Node.js code directly in the browser sandbox, with an integrated terminal and real-time preview — no server-side execution needed.",
      },
    },
    {
      "@type": "Question",
      name: "Does LuminaWeb integrate with GitHub?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. LuminaWeb lets you import any GitHub repository directly into the browser IDE and export your changes back to GitHub — without needing Git installed locally.",
      },
    },
  ],
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": `${baseUrl}/#webapp`,
  name: "LuminaWeb",
  url: baseUrl,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (Web Browser)",
  description:
    "LuminaWeb is a cloud IDE web application. Write and run code in your browser with AI assistance.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webAppSchema),
        }}
      />
    </>
  );
}
