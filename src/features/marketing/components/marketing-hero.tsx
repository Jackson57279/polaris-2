"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignUpButton } from "@clerk/nextjs";
import ky from "ky";
import posthog from "posthog-js";
import { toast } from "sonner";
import {
  ArrowRightIcon,
  ImageIcon,
  MicIcon,
  PaperclipIcon,
  CodeIcon,
  LayoutDashboardIcon,
  GlobeIcon,
  BookOpenIcon,
  RocketIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

type QuickAction = { icon: LucideIcon; label: string; prompt: string };

const QUICK_ACTIONS_ROW_1: QuickAction[] = [
  {
    icon: GlobeIcon,
    label: "Landing Page",
    prompt:
      "Build a modern marketing landing page with hero, features, pricing, and a call-to-action.",
  },
  {
    icon: LayoutDashboardIcon,
    label: "Dashboard",
    prompt:
      "Build an analytics dashboard with charts, tables, and key metric cards.",
  },
  {
    icon: CodeIcon,
    label: "Internal Tool",
    prompt:
      "Build an internal admin tool with authentication, a data table, and CRUD forms.",
  },
];

const QUICK_ACTIONS_ROW_2: QuickAction[] = [
  {
    icon: RocketIcon,
    label: "SaaS Starter",
    prompt:
      "Build a SaaS starter with sign in, billing, dashboard, and a marketing site.",
  },
  {
    icon: BookOpenIcon,
    label: "Docs Site",
    prompt:
      "Build a documentation site with sidebar nav, search, and Markdown content.",
  },
  {
    icon: GlobeIcon,
    label: "AI Assistant",
    prompt:
      "Build an AI chat assistant with streaming, tool-use, and persistent threads.",
  },
];

export const MarketingHero = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSubmitting) return;

    if (!isSignedIn) {
      toast.message("Sign in to start building", {
        description: "Create an account to spin up your project.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { projectId } = await ky
        .post("/api/projects/create-with-prompt", {
          json: { prompt: trimmed, imageUrls: [] },
          timeout: 60000,
        })
        .json<{ projectId: Id<"projects"> }>();

      posthog.capture("project_created", {
        source: "marketing_hero",
        project_id: projectId,
      });
      toast.success("Project created");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      posthog.captureException(error);
      toast.error("Unable to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 md:pt-20 pb-12">
      <div className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.09] bg-background/70 backdrop-blur-sm pl-3 pr-[3px] py-[3px] text-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <span className="text-foreground/65 leading-none">
          Introducing LuminaWeb
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-2.5 h-5 text-[11px] font-medium leading-none">
          Try now
        </span>
      </div>

      <h1 className="mt-7 font-serif text-foreground text-[46px] sm:text-[58px] md:text-[68px] leading-[1.02] tracking-[-0.02em] max-w-[14ch]">
        Meet your first
        <br />
        autonomous builder.
      </h1>

      <p className="mt-5 text-[13.5px] md:text-[14px] leading-[1.6] text-foreground/55 max-w-[46ch]">
        LuminaWeb helps teams design, ship, and scale software in the browser —
        from prompt to production with a single conversation.
      </p>

      <PromptCard
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        isSubmitting={isSubmitting}
        isSignedIn={Boolean(isSignedIn)}
      />

      <div className="mt-8 flex flex-col items-center gap-2.5">
        <ChipRow actions={QUICK_ACTIONS_ROW_1} onSelect={setInput} />
        <ChipRow actions={QUICK_ACTIONS_ROW_2} onSelect={setInput} />
      </div>
    </section>
  );
};

const ChipRow = ({
  actions,
  onSelect,
}: {
  actions: QuickAction[];
  onSelect: (prompt: string) => void;
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onSelect(action.prompt)}
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-foreground/[0.12]",
            "bg-background/80 backdrop-blur-sm px-3.5 h-[34px]",
            "text-[13px] text-foreground/80 hover:text-foreground",
            "hover:border-foreground/25 hover:bg-background transition-colors",
            "shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
          )}
        >
          <action.icon
            className="size-[14px] text-foreground/55"
            strokeWidth={1.6}
          />
          {action.label}
        </button>
      ))}
    </div>
  );
};

const PromptCard = ({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  isSubmitting,
  isSignedIn,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isSubmitting: boolean;
  isSignedIn: boolean;
}) => {
  const submitButton = (
    <button
      type="button"
      onClick={onSubmit}
      disabled={!value.trim() || isSubmitting}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md",
        "bg-white/10 text-white/90 hover:bg-white/20 transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed"
      )}
      aria-label="Send"
    >
      <ArrowRightIcon className="size-3.5" strokeWidth={2.25} />
    </button>
  );

  const card = (
    <div
      className={cn(
        "relative w-full max-w-[640px] mt-10 mx-auto",
        "rounded-[14px] bg-[#1d1d1f] text-white/95",
        "shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45),0_2px_6px_rgba(0,0,0,0.18)]",
        "ring-1 ring-black/40"
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Automate my client onboarding flow and send progress reports weekly."
        disabled={isSubmitting}
        className={cn(
          "w-full resize-none bg-transparent text-left",
          "text-[14px] leading-[1.55] text-white/95 placeholder:text-white/45",
          "px-5 pt-4.5 pb-3 outline-none",
          "min-h-[68px] max-h-[260px] overflow-y-auto",
          "[scrollbar-color:theme(colors.zinc.700)_transparent]"
        )}
        style={{ paddingTop: 18, paddingBottom: 14 }}
      />

      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          <ToolButton aria-label="Attach file">
            <PaperclipIcon className="size-3.5" strokeWidth={1.75} />
          </ToolButton>
          <ToolButton aria-label="Attach image">
            <ImageIcon className="size-3.5" strokeWidth={1.75} />
          </ToolButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolButton aria-label="Voice">
            <MicIcon className="size-3.5" strokeWidth={1.75} />
          </ToolButton>
          {submitButton}
        </div>
      </div>
    </div>
  );

  if (isSignedIn) return card;

  return (
    <SignUpButton mode="modal">
      <div role="button" tabIndex={0} className="w-full focus:outline-none">
        {card}
      </div>
    </SignUpButton>
  );
};

const ToolButton = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md",
        "text-white/55 hover:text-white/95 hover:bg-white/8 transition-colors"
      )}
      {...props}
    >
      {children}
    </button>
  );
};
