# LuminaWeb — Business & investor narrative

Internal reference for positioning, marketing copy, and investor conversations. Product facts are aligned with the current codebase (browser cloud IDE, AI agent, WebContainer preview, Convex real-time, Clerk billing).

---

## One-line pitch

**LuminaWeb is a zero-install, browser-native cloud IDE where an AI agent edits your real project files, runs a terminal and live preview in the browser, and syncs in real time—so developers can ship from any machine without cloning the “desktop AI editor” workflow.**

Alternate (shorter): **“Cursor-class AI coding, entirely in the browser—chat, inline edits, terminal, preview, GitHub, deploy.”**

**Roadmap hook (when you want to tease depth):** **“A LuminaWeb-native coding model—Composer-class—tuned for our agent loop, not generic chat.”**

---

## Problem

1. **Friction**: Local IDEs plus AI plugins assume a powerful laptop, installs, and environment parity. Many contexts (Chromebooks, locked-down corp machines, quick fixes on the road) still block that.
2. **Fragmentation**: Chat UIs that don’t own the filesystem create copy-paste loops; “AI in the editor” wins when the model can **read, write, and validate** the same tree the human sees.
3. **Collaboration & continuity**: Teams want shared state, auditability, and billing that maps to **usage**, not just seats—especially as model costs dominate margins.

---

## Solution (what the product is)

LuminaWeb delivers a **full-stack dev surface in the tab**:

- **AI that edits the repo**: Conversations drive file tools (read/write/rename/delete, folders, etc.) via background orchestration (Inngest), not a one-shot chat window.
- **Editor-native AI**: Inline suggestions and Cmd+K-style quick edit (CodeMirror 6 extensions calling API routes).
- **Run & preview**: WebContainer + xterm.js for in-browser terminal and app preview without shipping VMs to every user session by default.
- **Real-time workspace**: Convex-backed sync so project state and collaboration can stay reactive.
- **Workflow integrations**: GitHub import/export, Figma import, deploy hooks (e.g. Vercel/Netlify routes in the app), MCP server surface for extensibility.
- **Monetization hooks**: Clerk Billing for subscriptions plus a **Convex wallet ledger** for usage/credits—aligned with variable AI cost.
- **Model strategy (planned)**: Third-party models today; a **proprietary or LuminaWeb-exclusive coding model** on the roadmap—see [Proprietary model roadmap](#proprietary-model-roadmap-composer-class).

---

## Proprietary model roadmap (Composer-class)

**What you mean in plain language:** Products like Composer (and similar “coding-native” models) won the category partly by optimizing for **multi-file edits, tool calling, and IDE context**—not by being the biggest general LLM. LuminaWeb plans a **model program in that spirit**: a coding model **aligned to this product’s agent loop** (file tools, build validation, WebContainer feedback, repo structure).

### Why investors care

| Angle | Narrative |
|-------|-----------|
| **Margins** | At scale, API resale of frontier models compresses gross margin. A **hosted or fine-tuned model** you control (or exclusively license) can improve **$/successful task** and let you offer predictable pricing tiers. |
| **Differentiation** | “Same GPT wrapper as everyone else” is weak. A model **evaluated on LuminaWeb tasks** (apply patch, pass build, respect project layout) is a credible **product moat** when paired with your editor + runtime. |
| **Latency & UX** | Smaller, task-tuned models can target **faster first token** and **shorter tool loops** for inline edit and iteration—critical in the browser. |
| **Enterprise story** | Optional path: **no third-party training on customer code**, **regional hosting**, **fixed contracts**—easier to sell when you own the inference stack for the flagship SKU. |

### How it fits the current architecture (technical credibility)

Today the app already uses **role-based routing** (e.g. manager, research, review, iteration) with OpenRouter (`src/lib/ai-models.ts`). That is the right seam: **swap or pin the “manager” / coding role to a LuminaWeb endpoint** without rewiring the whole product. Investors like hearing you’re not betting the company on a monolith rewrite—**you’re upgrading the engine**.

### Realistic phases (say this so you sound grounded)

1. **Now**: Best-in-class third-party models + strong evals (acceptance rate, build pass, user revert rate).
2. **Next**: **Distillation / fine-tune** on permitted data (synthetic + licensed + opt-in telemetry if you add it)—optimize for your tool schema and languages you care about first.
3. **Scale**: **Dedicated inference**, caching, maybe **speculative decoding** or routing (small model for drafts, large for hard refactors)—same playbook as mature coding agents.

### Capital & team (high level)

- **People**: ML engineer(s), eval/infra, security review for training data.
- **Spend**: GPU training or fine-tune runs; ongoing inference; legal/licensing for training corpus.
- **Risk to name**: Training cost overruns, eval gaming, and **safety/IP**—mitigate with phased gates (“ship hosted FT model only after X win rate vs baseline”).

### Marketing & positioning lines (website, deck, press)

- **Headline option:** *“Built for how LuminaWeb edits code—not for generic chat.”*
- **Subline:** *“A coding model tuned for multi-file agents, terminal output, and live preview—coming to LuminaWeb.”*
- **Investor one-liner:** *“We’re not only distributing AI in the IDE; we’re compounding toward a **Composer-class model** that improves margins and lock-in on our agent loop.”*
- **Honest variant (if pre-train):** *“Roadmap: LuminaWeb-native model. Today: top third-party models with product-specific evals and routing.”*

---

## Who it’s for (ICP)

| Segment | Why they care |
|--------|----------------|
| **Indie hackers & students** | No install, fast start, AI that mutates the project |
| **Frontend-heavy teams** | Browser preview + quick iteration; design handoff (Figma) |
| **Consultants / agencies** | Client machine constraints; demo and ship from a URL |
| **Enterprises (later)** | Audit trails, SSO (Clerk path), usage-based billing, air-gapped narratives need roadmap honesty |

Primary wedge: **developers who already pay for AI coding but hate environment setup** or **can’t install desktop tools**.

---

## Market context (how to talk to investors)

- **Category**: AI-native developer tools / cloud IDEs—same tailwind as GitHub Copilot, Cursor, Replit, CodeSandbox, StackBlitz, v0-style products, but your story is **browser-first + agentic file operations + real-time backend**.
- **Why now**: Models are good enough for multi-file edits; browsers can run serious workloads (WebContainer); **usage-based economics** force products to meter and gate compute intelligently—you already have ledger + billing plumbing.
- **TAM framing**: Don’t claim “all developers.” Claim **(a)** cloud IDE TAM, **(b)** incremental spend shifting from generic chat to **IDE-integrated** workflows, **(c)** education and emerging markets where install-free matters.

---

## Differentiation (defensible angles)

1. **Ownership of the loop**: Edit → run in WebContainer → validate builds → ship (GitHub / deploy APIs)—tight integration beats “chat + paste.”
2. **Multi-model routing**: OpenRouter + role-based model selection (manager, research, review, iteration, etc.) supports **cost/quality tradeoffs** and fast provider swaps—important when margins are thin.
3. **Real-time data plane**: Convex is a credible story for **presence, sync, and usage accounting** at scale.
4. **Extensibility**: MCP endpoint and keys management position LuminaWeb as a **platform** others can attach to, not only a standalone editor.
5. **Planned proprietary model**: Composer-class coding model **tied to LuminaWeb’s tool and preview loop**—see [Proprietary model roadmap](#proprietary-model-roadmap-composer-class).

Honest gaps investors may probe: enterprise SSO/compliance depth, on-prem, SLA, abuse prevention on free tiers, and WebContainer/browser limits for non-web stacks.

---

## Business model

- **Subscriptions** (Clerk Billing): packaged plans on `/pricing`; customer self-serve on `/customer-portal`.
- **Usage / credits** (Convex wallet + `POST /api/wallet/ledger`): aligns revenue with OpenRouter and infra variable cost—narrate this as **margin protection** and upsell lever (“buy more credits”).
- **Future options** (only if you execute): team seats, **LuminaWeb-hosted or exclusive model tier** (premium margin + enterprise narrative), priority queues, enterprise annual contracts.

---

## Go-to-market (marketing “what to say”)

**Homepage hero (example):**  
*Ship code from your browser. LuminaWeb pairs a serious editor with an AI that edits your files, runs your app, and opens a real terminal—no install, no drift.*

**Three bullets for ads or landing sections:**

1. **Agentic editing** — The assistant doesn’t just answer; it applies multi-file changes in your tree.
2. **Live preview & terminal** — See the app run where you code (WebContainer).
3. **From repo to production** — GitHub in/out, deploy integrations, real-time sync.
4. **(Roadmap)** **LuminaWeb-native coding model** — Composer-class: tuned for agentic edits and your stack, not a generic chatbot.

**Channels that fit the product:**

- **Developer content**: “We rebuilt the Cursor loop in the browser—here’s the architecture (Next.js, Convex, Inngest, WebContainer).”
- **Comparisons**: Honest matrices vs Replit / CodeSandbox / StackBlitz / Cursor (strength: browser + agent; tradeoff: heavy native or backend workloads).
- **SEO**: “cloud IDE,” “browser code editor,” “AI that edits files,” “no install development environment”—match `structured-data` and blog topics.

**Social proof to collect early**: GitHub stars, time-to-first-preview, # of projects created, retention D7, paid conversion—not vanity traffic.

---

## Metrics investors expect (prepare these)

| Area | Examples |
|------|-----------|
| **Growth** | Signups, activated projects (first successful preview or first AI edit applied), WAU/MAU |
| **Engagement** | AI messages per active user, files touched per session, return rate |
| **Revenue** | MRR, ARPA, expansion via credits |
| **Unit economics** | Gross margin after model + WebContainer + Convex; cost per activated user; **post-proprietary-model** target margin if you publish a scenario |
| **Retention** | D1/D7/D30 for activated users; churn by cohort |

If pre-revenue: show **activation funnel** and **technical milestones** (latency, error rates, build validation pass rate).

---

## Roadmap themes (investor-safe, non-committal)

- **Teams**: shared projects, roles, org billing.
- **Trust & safety**: rate limits, abuse detection, content policy for hosted previews.
- **Deeper integrations**: CI status in UI, issue trackers, design systems.
- **Enterprise**: SSO, audit logs, VPC or dedicated deployments (only promise what you’ll build).
- **LuminaWeb model program**: eval harness → fine-tune/distill → hosted inference → optional enterprise-only or premium tier (tie to [Proprietary model roadmap](#proprietary-model-roadmap-composer-class)).

---

## Risks (say them first—builds credibility)

- **Browser execution limits** for some stacks vs local VMs.
- **Model cost volatility**—mitigate with routing, caching, and credit pricing; **long-term** with a proprietary or self-hosted tier.
- **Model program execution risk**—training cost, eval quality, and timeline slips; mitigate with phased milestones and fallback to best-in-class APIs.
- **Incumbent competition** (Microsoft/GitHub, Anthropic ecosystem, Replit) — your angle is **focus + speed + usage-aligned economics + open integration (MCP)**.
- **Security**: user code execution in the browser and server-side tools must be explained clearly (sandboxing story, data handling).

---

## FAQ — short answers for pitches

**“Isn’t this just Replit?”**  
Similar surface; we emphasize **agentic repo editing**, **multi-model control**, **MCP**, and **billing/ledger** built for AI-variable cost.

**“Why browser?”**  
Acquisition, onboarding, and distribution—URL beats installer; huge for education and occasional developers.

**“Moat?”**  
No single silver bullet—**workflow depth**, **latency**, **reliability**, **distribution**, and **enterprise trust** compound. Technical moat is the integrated stack (editor + agent + run + sync + billing), not one library. A **LuminaWeb-tuned coding model** strengthens moat and margins if execution is disciplined.

**“Why build your own model instead of only using OpenRouter?”**  
You still can for most traffic. The thesis is **selective ownership**: the flagship experience (agent + build loop) gets a model **evaluated and trained for that loop**, improving **quality per dollar** and enabling **enterprise and pricing** stories generic resellers can’t match.

**“What do you need funding for?”**  
Model spend subsidies, **model program** (eval + training + inference), infra, security/compliance, GTM (devrel + content), and team to harden WebContainer workflows and team features.

---

## Appendix — codebase map (for technical diligence)

| Layer | Location / tech |
|-------|------------------|
| App & APIs | `src/app/` — Next.js 16 App Router; REST-style `route.ts` for chat, suggestions, GitHub, deploy, MCP, wallet, Inngest webhook |
| Features | `src/features/` — `auth`, `conversations` (Inngest + tools/workers), `editor` (CodeMirror + Zustand), `preview` (WebContainer), `projects` |
| Backend | `convex/` — schema, queries, mutations, large system surface |
| Jobs | Inngest (`src/app/api/inngest`, feature `inngest/` folders) |
| AI | OpenRouter via `@inngest/agent-kit` / Vercel AI SDK compatible client; roles in `src/lib/ai-models.ts` — **planned**: pin “coding” roles to a LuminaWeb-hosted or exclusive model endpoint |
| Auth & billing | Clerk; wallet ledger API + webhooks |

---

*This document is a narrative aid—not financial advice or a securities offering.*
