"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import { ArrowLeftIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { McpKeysSection } from "./mcp-keys-section";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const SettingsView = () => {
  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center p-6 md:p-16">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="size-8">
              <Link href="/">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <h1
              className={cn(
                "text-2xl md:text-3xl font-semibold",
                font.className,
              )}
            >
              Settings
            </h1>
          </div>
          <UserButton />
        </div>

        <McpKeysSection />
      </div>
    </div>
  );
};
