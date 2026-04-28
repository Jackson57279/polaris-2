"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

import { MarketingLogo } from "./marketing-logo";

const NAV_LINKS = [
  { label: "Solutions", href: "#solutions" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Developers", href: "#developers" },
  { label: "Resources", href: "/blog" },
  { label: "Pricing", href: "#pricing" },
];

export const MarketingHeader = () => {
  const { isSignedIn } = useAuth();

  return (
    <header className="relative z-20 flex items-center justify-between px-6 md:px-10 h-16 md:h-[72px] border-b border-foreground/[0.07]">
      <Link
        href="/"
        className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
      >
        <MarketingLogo size={28} />
      </Link>

      <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={cn(
              "text-[13px] text-foreground/70 hover:text-foreground transition-colors",
              "font-normal tracking-tight"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        {isSignedIn ? (
          <Link
            href="/projects"
            className="text-[13px] text-foreground/70 hover:text-foreground transition-colors hidden md:inline"
          >
            Dashboard
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button className="text-[13px] text-foreground/70 hover:text-foreground transition-colors hidden md:inline">
              Login
            </button>
          </SignInButton>
        )}
        {isSignedIn ? (
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-md bg-foreground text-background h-8 px-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-foreground/90 transition-colors"
          >
            Open App
          </Link>
        ) : (
          <SignUpButton mode="modal">
            <button className="inline-flex items-center justify-center rounded-md bg-foreground text-background h-8 px-3.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-foreground/90 transition-colors">
              Get Started
            </button>
          </SignUpButton>
        )}
      </div>
    </header>
  );
};
