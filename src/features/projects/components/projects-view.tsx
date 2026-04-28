"use client";

import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { SearchIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

import { MarketingHeader } from "@/features/marketing/components/marketing-header";

import { ProjectsList } from "./projects-list";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ImportGithubDialog } from "./import-github-dialog";
import { NewProjectDialog } from "./new-project-dialog";

export const ProjectsView = () => {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandDialogOpen(true);
        }
        if (e.key === "i") {
          e.preventDefault();
          setImportDialogOpen(true);
        }
        if (e.key === "j") {
          e.preventDefault();
          setNewProjectDialogOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <ProjectsCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />
      <ImportGithubDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
      />

      <main className="min-h-screen w-full bg-[oklch(0.86_0.012_90)] md:py-6 md:px-6">
        <div
          className={cn(
            "relative mx-auto w-full max-w-[1180px]",
            "min-h-[calc(100vh-3rem)]",
            "bg-background border border-foreground/[0.07]",
            "rounded-none md:rounded-[2px] overflow-hidden"
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 z-0 bg-grid-paper opacity-90",
              "[mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
            )}
          />

          <MarketingHeader />

          <section className="relative z-10 px-6 md:px-10 pt-14 md:pt-20 pb-20 max-w-3xl mx-auto">
            <h1 className="font-serif text-foreground text-[44px] sm:text-[52px] leading-[1.05] tracking-[-0.02em]">
              Your workspace.
            </h1>
            <p className="mt-4 text-[14px] md:text-[15px] text-foreground/60 max-w-[52ch] leading-[1.6]">
              Pick up where you left off, spin up a new project, or import an
              existing repo from GitHub.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <ActionTile
                icon={<SparklesIcon className="size-4" strokeWidth={1.6} />}
                label="New project"
                description="Start from a prompt"
                kbd="⌘J"
                onClick={() => setNewProjectDialogOpen(true)}
              />
              <ActionTile
                icon={<FaGithub className="size-4" />}
                label="Import"
                description="Bring a GitHub repo"
                kbd="⌘I"
                onClick={() => setImportDialogOpen(true)}
              />
              <ActionTile
                icon={<SearchIcon className="size-4" strokeWidth={1.6} />}
                label="Search"
                description="Jump to a project"
                kbd="⌘K"
                onClick={() => setCommandDialogOpen(true)}
              />
            </div>

            <div className="mt-12">
              <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

const ActionTile = ({
  icon,
  label,
  description,
  kbd,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  kbd: string;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-3 rounded-md p-4",
        "border border-foreground/[0.1] bg-background/60 backdrop-blur-sm",
        "hover:border-foreground/25 hover:bg-background transition-colors",
        "text-left"
      )}
    >
      <div className="flex items-center justify-between w-full text-foreground/70">
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-foreground/[0.04] border border-foreground/[0.06] group-hover:bg-foreground/[0.06]">
          {icon}
        </span>
        <Kbd className="bg-background border border-foreground/15 text-foreground/60">
          {kbd}
        </Kbd>
      </div>
      <div>
        <div className="text-[14px] font-medium text-foreground">{label}</div>
        <div className="text-[12px] text-foreground/55 mt-0.5">{description}</div>
      </div>
    </button>
  );
};
