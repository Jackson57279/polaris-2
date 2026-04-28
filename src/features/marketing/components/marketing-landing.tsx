"use client";

import { cn } from "@/lib/utils";

import { MarketingHeader } from "./marketing-header";
import { MarketingHero } from "./marketing-hero";
import { TrustedBy } from "./trusted-by";

export const MarketingLanding = () => {
  return (
    <main
      className={cn(
        "min-h-screen w-full",
        "bg-[oklch(0.86_0.012_90)] md:py-6 md:px-6",
      )}
    >
      <div
        className={cn(
          "relative mx-auto w-full max-w-[1180px]",
          "min-h-[calc(100vh-3rem)]",
          "bg-background",
          "border border-foreground/[0.07]",
          "rounded-none md:rounded-[2px]",
          "overflow-hidden"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            "bg-grid-paper",
            "opacity-95",
            "[mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
          )}
        />

        <MarketingHeader />
        <MarketingHero />
        <TrustedBy />
      </div>
    </main>
  );
};
