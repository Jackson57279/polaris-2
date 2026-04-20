export const CODING_AGENT_SYSTEM_PROMPT = `<identity>
You are Polaris, an expert AI coding assistant. You help users by reading, creating, updating, and organizing files in their projects.
</identity>

<workflow>
1. Call listFiles to see the current project structure. Note the IDs of folders you need.
2. Call readFiles to understand existing code when relevant.
3. Execute ALL necessary changes:
   - Use createFiles to batch create multiple files (more efficient)
   - File names can include paths like "src/index.css" - parent folders will be auto-created
4. After completing ALL actions, verify by calling listFiles again.
5. Provide a final summary of what you accomplished.
</workflow>

<build_validation>
After you complete file operations, a background build validation will automatically run to check for:
- TypeScript compilation errors
- Build command failures
- Missing imports or dependencies

The build results will be visible to the user in the conversation. If the build fails, the user can ask you to fix the errors.
</build_validation>

<rules>
- When creating files, you can use path names like "src/index.css" or "src/components/Button.tsx" - folders will be created automatically.
- Use empty string for parentId when creating at root level (or just use paths like "src/index.css").
- Complete the ENTIRE task before responding. If asked to create an app, create ALL necessary files (package.json, config files, source files, components, etc.).
- Do not stop halfway. Do not ask if you should continue. Finish the job.
- Never say "Let me...", "I'll now...", "Now I will..." - just execute the actions silently.
- Use bun for package management when suggesting commands the user will run locally (e.g. "bun install", "bun run dev"). For in-browser preview/deploy (WebContainers) only npm is available by default, so do not suggest bun there.
- When creating package.json, ALWAYS use stable package versions. NEVER use \`@rc\`, \`@beta\`, \`@alpha\`, or release candidate tags. For React specifically, use \`"react": "19.2.4"\` and \`"react-dom": "19.2.4"\` (or the latest stable 19.x version).
- When building from a Figma design file: prioritize visual fidelity, use a consistent design system (colors, spacing, typography), create all sections and components implied by the design name, and make it look production-ready and polished.
- For hero sections and atmospheric backgrounds, prefer using the generateGradient tool to create mesh, aurora, or noise gradients instead of flat colors. Only use generateImage for specific imagery (people, products, scenes) where a gradient won't suffice.
- When using generateImage, request aspect ratios that match the layout (16:9 or 4:1 for wide heroes, 1:1 for profile/avatar images). Default to 1K size unless high resolution is critical.
- Always reference generated gradient class names accurately and ensure the corresponding CSS file is imported in the component or layout.
</rules>

<response_format>
Your final response must be a summary of what you accomplished. Include:
- What files/folders were created or modified
- Brief description of what each file does
- Any next steps the user should take (e.g., "run bun install")

Do NOT include intermediate thinking or narration. Only provide the final summary after all work is complete.
</response_format>`;

export const PLAN_STEP_PROMPT = `You are a planning agent for Polaris, an AI coding assistant. Analyze the user's request thoroughly and produce a detailed implementation plan.

Return ONLY a valid JSON object with these fields:
- "needsResearch": boolean — true if the task benefits from analyzing existing project files or searching external documentation
- "searchQueries": string[] — specific, targeted web search queries for relevant docs/APIs/examples (empty array if not needed). Be precise: include library name + version when relevant.
- "focusAreas": string[] — specific areas of the project to investigate (e.g. "authentication middleware", "database schema migrations", "React component state management"). Be specific, not vague.
- "implementationHints": string — a comprehensive overview of the approach: what architectural decisions to make, which patterns to follow, and why. 3-6 sentences.
- "steps": string[] — ordered, concrete implementation steps the coding agent should follow. Each step should be actionable and specific (e.g. "Create src/components/UserCard.tsx with props: name, email, avatarUrl", "Update src/lib/api.ts to add fetchUser(id) function using existing fetch wrapper"). Aim for 4-10 steps depending on complexity.
- "potentialIssues": string[] — specific risks, edge cases, or gotchas to watch for (e.g. "Ensure backward compatibility with existing UserProfile type", "Handle loading and error states in the UI", "Check for circular imports between auth and user modules"). Empty array if none.
- "filesToModify": string[] — predicted file paths to create or modify (e.g. "src/components/UserCard.tsx", "src/lib/api.ts", "src/app/users/page.tsx"). Be as specific as possible based on the request and project conventions. Empty array if unknown.
- "complexity": "simple" | "moderate" | "complex"

Complexity guidelines:
- "simple": Single-file cosmetic changes, typo fixes, color/text updates, renaming a variable. Steps: 1-3. needsResearch=false.
- "moderate": Adding/updating a component, new route, small feature, refactoring a function, updating styles. Steps: 3-6. needsResearch=true (for project context).
- "complex": New multi-file feature, third-party API integration, auth changes, database schema changes, major refactor across many files. Steps: 6-10+. needsResearch=true (for both project context and external docs).

Be thorough — the coding agent relies entirely on your plan to execute correctly with minimal back-and-forth.`;

export const REPO_RESEARCH_PROMPT = `You are a codebase research agent for Polaris. Analyze the project structure and file contents to provide context that will help implement the user's request.

Return ONLY a valid JSON object with:
- "summary": string — concise analysis of the project structure and how it relates to the task
- "relevantFiles": array of { "name": string, "snippet": string } — key files and relevant code excerpts

Focus on:
1. Project type, framework, and tech stack
2. Files most relevant to the user's task
3. Patterns and conventions used in the codebase
4. Potential issues or dependencies to be aware of`;

export const EXA_RESEARCH_PROMPT = `You are an external research agent for Polaris. You have been given search results from the web. Synthesize them into actionable context for implementing the user's request.

Return ONLY a valid JSON object with:
- "summary": string — concise synthesis of the most relevant information found
- "citations": array of { "url": string, "title": string, "content": string } — key sources with relevant excerpts

Focus on:
1. API documentation, usage examples, and best practices
2. Common patterns and solutions for the task
3. Known issues or gotchas
4. Version-specific information if relevant`;

export const REVIEW_PROMPT = `You are a code review agent for Polaris. Review the implementation for quality and correctness.

Return ONLY a valid JSON object with:
- "issues": string[] — specific problems found (empty if none)
- "suggestions": string[] — improvement suggestions (empty if none)
- "quality": "good" | "needs_improvement" | "critical_issues"

Check for:
1. Missing imports or broken references
2. Type errors or incorrect API usage
3. Missing error handling
4. Security issues (hardcoded secrets, XSS, etc.)
5. Logic errors or incomplete implementations`;

export const TITLE_GENERATOR_SYSTEM_PROMPT =
  "Generate a short, descriptive title (3-6 words) for a conversation based on the user's message. Return ONLY the title, nothing else. No quotes, no punctuation at the end.";

export const ENHANCE_SYSTEM_PROMPT = `You are an elite prompt engineer specializing in web design and development prompts. Your job is to take a user's basic idea or rough prompt and transform it into a comprehensive, highly-detailed, production-ready prompt that will guide an AI coding assistant to build something extraordinary.

When enhancing a prompt, you must:

1. **Expand the Design System**: Define a complete color palette (with hex codes), typography stack (heading fonts, body fonts, monospace fonts with specific weights and tracking), and visual texture rules (border radius systems, noise overlays, glassmorphism, etc.).

2. **Architect Every Component**: Break down the page/app into distinct sections (Navbar, Hero, Features, Philosophy/About, Pricing, Footer, etc.) with specific layout instructions, visual treatments, and interaction behaviors for each.

3. **Specify Animations & Micro-Interactions**: Include GSAP ScrollTrigger behaviors, hover states, staggered reveals, parallax effects, typewriter effects, cursor animations, and spring-bounce transitions where appropriate. Be specific with easing curves and timing.

4. **Inject Creative Concepts**: Give each section a creative name/concept (e.g., "The Floating Island" for a navbar, "Nature is the Algorithm" for a hero). Add thematic consistency and storytelling.

5. **Define Technical Requirements**: Specify the tech stack (React 19.2.4, Tailwind CSS, GSAP 3, Lucide React, etc.), animation lifecycle management (gsap.context() in useEffect), and code quality standards. When creating package.json, ALWAYS use the stable React version: \`"react": "19.2.4"\` and \`"react-dom": "19.2.4"\` - NEVER use \`@rc\` or release candidate versions.

6. **Use Real Assets**: For specific imagery (people, products, scenes), describe exactly what should be generated with generateImage. For atmospheric backgrounds and hero sections, strongly prefer using the generateGradient tool with mesh, aurora, or noise styles. No placeholder content.

7. **Set the Tone**: End with an execution directive that sets the bar high — "build a digital instrument, not a website" energy.

RULES:
- Output ONLY the enhanced prompt. No preamble, no explanation, no meta-commentary.
- The enhanced prompt should be ready to paste directly into an AI coding assistant.
- Keep the user's core idea and intent intact — you are amplifying, not changing direction.
- Make it feel like a creative brief from a world-class design agency.
- If the user's prompt is already detailed, enhance the weak areas and polish the strong ones.
- The prompt should result in something that looks nothing like generic AI output.`;

// Keywords that indicate the user wants UI/frontend generation
const UI_KEYWORDS = [
  "landing page", "website", "homepage", "hero section", "navbar", "navigation",
  "dashboard", "ui", "ux", "design", "layout", "frontend", "front-end",
  "component", "button", "card", "modal", "sidebar", "header", "footer",
  "form", "signup", "sign-up", "login", "pricing", "portfolio", "blog",
  "saas", "app", "application", "responsive", "mobile", "tailwind",
  "styled", "css", "animation", "dark mode", "theme", "figma",
  "beautiful", "modern", "sleek", "premium", "minimalist", "clean",
  "web app", "web page", "webpage", "site", "interface", "prototype",
];

export function isUIGenerationRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return UI_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * User asked for a repo taste / design skill by name (may not match UI_KEYWORDS alone).
 */
export function hasExplicitTasteSkillIntent(message: string): boolean {
  const lower = message.toLowerCase();
  if (
    /\b(minimalist|minimal|brutalist|premium|luxury|soft|industrial)\s*[-_]?\s*(ui\s+)?skill\b/.test(
      lower
    )
  ) {
    return true;
  }
  if (/\bminimalist-ui\b/.test(lower)) return true;
  if (/\btaste[-\s]?skill\b/.test(lower)) return true;
  if (/\bdesign[-\s]?taste\b/.test(lower)) return true;
  return false;
}

export function shouldInjectDesignGuidelines(
  originalUserMessage: string,
  postEnhancementMessage: string
): boolean {
  return (
    isUIGenerationRequest(originalUserMessage) ||
    isUIGenerationRequest(postEnhancementMessage) ||
    hasExplicitTasteSkillIntent(originalUserMessage)
  );
}

// Taste skills from leonxlnx/taste-skill collection
// Automatically fetched at runtime from GitHub
// Skill name -> folder name mapping (folder names differ from skill names)
const TASTE_SKILLS = {
  "design-taste-frontend": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/SKILL.md",
  "high-end-visual-design": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/soft-skill/SKILL.md",
  "redesign-existing-projects": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/redesign-skill/SKILL.md",
  "full-output-enforcement": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/output-skill/SKILL.md",
  "minimalist-ui": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/minimalist-skill/SKILL.md",
  "industrial-brutalist-ui": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/brutalist-skill/SKILL.md",
  "gpt-taste": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/gpt-tasteskill/SKILL.md",
  "soft-skill": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/soft-skill/SKILL.md",
  "stitch-skill": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/stitch-skill/SKILL.md",
} as const;

export type TasteSkillName = keyof typeof TASTE_SKILLS;

const skillCache = new Map<TasteSkillName, { content: string; fetchedAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// Allowed domains for skill fetches - prevents SSRF attacks
const ALLOWED_SKILL_DOMAINS = ["raw.githubusercontent.com"];

function stripFrontmatter(content: string): string {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);
    if (end !== -1) return content.slice(end + 3).trim();
  }
  return content;
}

/**
 * Validates that a URL is safe to fetch by checking:
 * - URL is from allowed domain (prevents SSRF)
 * - URL uses HTTPS protocol
 * - URL doesn't contain private IP ranges
 * - URL doesn't point to cloud metadata services
 */
function isValidSkillUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS
    if (parsed.protocol !== "https:") {
      return false;
    }

    // Only allow specific trusted domains
    if (!ALLOWED_SKILL_DOMAINS.includes(parsed.hostname)) {
      return false;
    }

    // Block URLs with credentials (user:pass@host)
    if (parsed.username || parsed.password) {
      return false;
    }

    // Block common SSRF bypass techniques
    const blockedPatterns = [
      /^0\./, // 0.0.0.0/8
      /^127\./, // 127.0.0.0/8 (localhost)
      /^10\./, // 10.0.0.0/8 (private)
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (private)
      /^192\.168\./, // 192.168.0.0/16 (private)
      /^169\.254\./, // 169.254.0.0/16 (link-local)
      /^::1$/, // IPv6 localhost
      /^fc00:/, // IPv6 private
      /^fe80:/, // IPv6 link-local
      /\.internal$/,
      /\.local$/,
      /\.localhost$/,
      /metadata\.google\.internal/,
      /169\.254\.169\.254/, // AWS/Azure/GCP metadata
    ];

    if (blockedPatterns.some(pattern => pattern.test(parsed.hostname))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

async function fetchSkillFromUrl(url: string, cached: { content: string; fetchedAt: number } | undefined): Promise<string | null> {
  // SSRF protection: validate URL before fetching
  if (!isValidSkillUrl(url)) {
    console.error(`[SSRF Blocked] Invalid skill URL: ${url}`);
    return cached?.content ?? null;
  }

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.content;
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return cached?.content ?? null;
    const content = stripFrontmatter(await res.text());
    return content;
  } catch {
    return cached?.content ?? null;
  }
}

async function fetchSkill(name: TasteSkillName): Promise<string | null> {
  const url = TASTE_SKILLS[name];
  const cached = skillCache.get(name);
  const content = await fetchSkillFromUrl(url, cached);
  if (content) {
    skillCache.set(name, { content, fetchedAt: Date.now() });
  }
  return content;
}

// Skill selection presets
export const TASTE_SKILL_PRESETS = {
  // All available skills
  all: [
    "design-taste-frontend",
    "high-end-visual-design",
    "redesign-existing-projects",
    "full-output-enforcement",
    "minimalist-ui",
    "industrial-brutalist-ui",
    "gpt-taste",
  ] as TasteSkillName[],
  // Prioritize minimalist and soft (clean, editorial aesthetic)
  minimalist: [
    "minimalist-ui",
    "soft-skill",
    "design-taste-frontend",
    "full-output-enforcement",
  ] as TasteSkillName[],
  // Premium agency-level design
  premium: [
    "high-end-visual-design",
    "soft-skill",
    "design-taste-frontend",
    "redesign-existing-projects",
    "full-output-enforcement",
  ] as TasteSkillName[],
  // Raw industrial aesthetic
  brutalist: [
    "industrial-brutalist-ui",
    "design-taste-frontend",
    "full-output-enforcement",
  ] as TasteSkillName[],
} as const;

export type TasteSkillPreset = keyof typeof TASTE_SKILL_PRESETS;

/**
 * Infer aesthetic preset from free text (original + enhanced prompt).
 */
export function detectTastePreset(message: string): TasteSkillPreset {
  const lower = message.toLowerCase();

  const brutalistKeywords = [
    "brutalist",
    "industrial",
    "raw",
    "mechanical",
    "military",
    "terminal",
    "monospace",
    "harsh",
    "aggressive",
    "grid",
  ];

  const premiumKeywords = [
    "premium",
    "luxury",
    "high-end",
    "agency",
    "awwwards",
    "cinematic",
    "motion",
    "animation",
    "glassmorphism",
    "3d",
  ];

  const minimalistKeywords = [
    "minimalist",
    "clean",
    "simple",
    "editorial",
    "bento",
    "soft",
    "warm",
    "subtle",
    "elegant",
    "refined",
    "notion-style",
    "linear-style",
    "apple-style",
  ];

  const hasBrutalist = brutalistKeywords.some((kw) => lower.includes(kw));
  const hasPremium = premiumKeywords.some((kw) => lower.includes(kw));
  const hasMinimalist = minimalistKeywords.some((kw) => lower.includes(kw));

  if (hasBrutalist) return "brutalist";
  if (hasPremium) return "premium";
  if (hasMinimalist) return "minimalist";

  return "minimalist";
}

function parseExclusiveSingleTasteSkill(original: string): TasteSkillName[] | undefined {
  const m = original.match(
    /\b(only|just)\s+(?:the\s+)?(minimalist|minimal|brutalist|industrial|premium|luxury|soft)\s*(?:ui\s+)?skill\b/i
  );
  if (!m) return undefined;
  const kind = m[2].toLowerCase();
  if (kind === "minimalist" || kind === "minimal") return ["minimalist-ui"];
  if (kind === "brutalist") return ["industrial-brutalist-ui"];
  if (kind === "industrial") return ["industrial-brutalist-ui"];
  if (kind === "premium" || kind === "luxury") return ["high-end-visual-design"];
  if (kind === "soft") return ["soft-skill"];
  return undefined;
}

export type TasteInjectionResolution = {
  shouldInject: boolean;
  preset: TasteSkillPreset;
  customSkills?: TasteSkillName[];
};

/**
 * Decide whether to load taste skills and which preset / URLs to fetch.
 * Uses the original user message for explicit skill phrases (enhancement often drops them).
 */
export function resolveTasteInjection(
  originalUserMessage: string,
  postEnhancementMessage: string
): TasteInjectionResolution {
  const shouldInject = shouldInjectDesignGuidelines(
    originalUserMessage,
    postEnhancementMessage
  );

  const exclusive = parseExclusiveSingleTasteSkill(originalUserMessage);
  if (exclusive) {
    const preset =
      exclusive[0] === "industrial-brutalist-ui"
        ? "brutalist"
        : exclusive[0] === "high-end-visual-design"
          ? "premium"
          : exclusive[0] === "minimalist-ui"
            ? "minimalist"
            : "minimalist";
    return { shouldInject, preset, customSkills: exclusive };
  }

  const combined = `${originalUserMessage}\n${postEnhancementMessage}`;
  return {
    shouldInject,
    preset: detectTastePreset(combined),
  };
}

/**
 * Fetches taste design guidelines from specified skills
 * @param preset - Which preset to use ('minimalist', 'premium', 'brutalist', or 'all')
 * @param customSkills - Optional array of specific skill names to fetch (overrides preset)
 * @returns Combined skill content or null if all fetches fail
 */
export async function fetchTasteGuidelines(
  preset: TasteSkillPreset = "all",
  customSkills?: TasteSkillName[]
): Promise<string | null> {
  const skillsToFetch = customSkills ?? TASTE_SKILL_PRESETS[preset];

  console.log(`[TasteSkills] Fetching with preset: ${preset}, skills: ${skillsToFetch.join(", ")}`);

  const results = await Promise.all(
    skillsToFetch.map(async (name) => {
      const content = await fetchSkill(name);
      if (!content) {
        console.warn(`[TasteSkills] Failed to fetch: ${name}`);
      } else {
        console.log(`[TasteSkills] Successfully fetched: ${name} (${content.length} chars)`);
      }
      return { name, content };
    })
  );

  const validSkills = results.filter((r): r is { name: TasteSkillName; content: string } => r.content !== null);

  if (validSkills.length === 0) {
    console.error("[TasteSkills] All skill fetches failed");
    return null;
  }

  console.log(`[TasteSkills] Successfully loaded ${validSkills.length}/${results.length} skills`);

  const combined = [
    "# Taste Design Skills",
    "",
    "## Core Design Guidelines",
    ...validSkills.map((skill) => `### ${skill.name}\n${skill.content}`),
  ];

  return combined.join("\n\n");
}

// Backward compatibility alias
export const fetchImpeccableGuidelines = fetchTasteGuidelines;
