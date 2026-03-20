# Luminaweb ✨

a browser-based AI code editor. like cursor but it lives in your browser and you built it yourself.



---

## what is this

cloud IDE with an AI agent that actually edits your files. runs in the browser. no install. just vibes.

- AI chat that reads and writes your code
- inline suggestions + Cmd+K quick edit
- in-browser terminal & preview via WebContainer
- GitHub import/export
- real-time everything (convex goes hard)

---

## stack

| thing | tech |
|---|---|
| frontend | Next.js 16, React 19, TypeScript, Tailwind 4 |
| editor | CodeMirror 6 with custom extensions |
| backend | Convex + Inngest |
| AI | OpenRouter (grok, claude, whatever) |
| auth | Clerk |
| execution | WebContainer + xterm.js |
| ui | shadcn/ui |

---

## run it

**you need:**
- bun
- a [Clerk](https://clerk.com) account
- a [Convex](https://convex.dev) account
- an [OpenRouter](https://openrouter.ai) API key
- [Inngest](https://inngest.com) (for background jobs)

```bash
git clone https://github.com/Zapdev-labs/Luminaweb.git
cd Luminaweb
bun install
cp .env.example .env.local
```

fill in `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
POLARIS_CONVEX_INTERNAL_KEY=  # any random string
OPENROUTER_API_KEY=
```

then spin up 3 terminals:

```bash
npx convex dev
```
```bash
bun run dev
```
```bash
npx inngest-cli@latest dev
```

hit [localhost:3000](http://localhost:3000) and cook.

---

## billing

uses Clerk Billing + a Convex wallet ledger for credits.

routes: `/pricing`, `/customer-portal`, `POST /api/webhooks/clerk`, `POST /api/wallet/ledger`

env vars needed: `CLERK_WEBHOOK_SIGNING_SECRET`, `POLARIS_CONVEX_INTERNAL_KEY`

---

## scripts

```bash
bun run dev    # dev
bun run build  # build
bun run lint   # lint
bun test       # test
```
