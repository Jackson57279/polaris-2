import { cn } from "@/lib/utils";

type Mark = {
  name: string;
  weight?: "normal" | "medium" | "semibold" | "bold";
  italic?: boolean;
  family?: "sans" | "serif" | "mono";
  tracking?: "tight" | "normal" | "wide";
  transform?: "uppercase" | "none";
};

const ROW_ONE: Mark[] = [
  { name: "Vercel", weight: "semibold", tracking: "tight" },
  { name: "Linear", weight: "medium" },
  { name: "Supabase", weight: "medium", tracking: "tight" },
  { name: "Convex", weight: "semibold", italic: true, family: "serif" },
  { name: "Clerk", weight: "bold" },
];

const ROW_TWO: Mark[] = [
  { name: "Inngest", weight: "medium", tracking: "tight" },
  { name: "Resend", weight: "semibold" },
  { name: "Cursor", weight: "medium", italic: true, family: "serif" },
  { name: "PostHog", weight: "semibold", tracking: "tight" },
  { name: "Sentry", weight: "medium" },
];

const ROW_THREE: Mark[] = [
  { name: "Tailwind", weight: "medium", tracking: "tight" },
  { name: "shadcn/ui", weight: "medium", family: "mono" },
  { name: "Anthropic", weight: "semibold", tracking: "tight" },
];

const LogoMark = ({ mark }: { mark: Mark }) => (
  <span
    className={cn(
      "inline-flex items-center justify-center text-[15px]",
      "text-foreground/55 hover:text-foreground/85 transition-colors select-none",
      mark.weight === "normal" && "font-normal",
      mark.weight === "medium" && "font-medium",
      mark.weight === "semibold" && "font-semibold",
      mark.weight === "bold" && "font-bold",
      mark.italic && "italic",
      mark.family === "serif" && "font-serif text-[18px] leading-none",
      mark.family === "mono" && "font-mono text-[13px]",
      mark.tracking === "tight" && "tracking-[-0.02em]",
      mark.tracking === "wide" && "tracking-[0.18em]",
      mark.transform === "uppercase" && "uppercase"
    )}
  >
    {mark.name}
  </span>
);

export const TrustedBy = () => {
  return (
    <section className="relative z-10 px-6 pb-20 md:pb-28">
      <h2 className="text-center text-[20px] md:text-[22px] font-medium text-foreground tracking-[-0.01em] max-w-md mx-auto leading-snug">
        Trusted by the teams redefining
        <br className="hidden sm:block" />
        productivity
      </h2>

      <div className="mt-10 flex flex-col items-center gap-y-6">
        <Row marks={ROW_ONE} />
        <Row marks={ROW_TWO} />
        <Row marks={ROW_THREE} />
      </div>
    </section>
  );
};

const Row = ({ marks }: { marks: Mark[] }) => (
  <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
    {marks.map((m) => (
      <LogoMark key={m.name} mark={m} />
    ))}
  </div>
);
