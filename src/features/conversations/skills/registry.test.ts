import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { SkillRegistry } from "./registry";
import type { Skill } from "./types";

const makeTool = (name: string) =>
  createTool({
    name,
    description: `Tool: ${name}`,
    parameters: z.object({}),
    handler: async () => "ok",
  });

const makeSkill = (name: string, opts: Partial<Skill> = {}): Skill => ({
  name,
  description: `Skill: ${name}`,
  tools: [makeTool(`${name}_tool`)],
  ...opts,
});

describe("SkillRegistry", () => {
  let registry: SkillRegistry;

  beforeEach(() => {
    registry = new SkillRegistry();
  });

  describe("empty registry", () => {
    it("getAll returns empty array", () => {
      expect(registry.getAll()).toEqual([]);
    });

    it("get returns undefined for unknown skill", () => {
      expect(registry.get("nonexistent")).toBeUndefined();
    });

    it("getTools returns empty array", () => {
      expect(registry.getTools()).toEqual([]);
    });

    it("getSystemInstructions returns empty string", () => {
      expect(registry.getSystemInstructions()).toBe("");
    });
  });

  describe("register", () => {
    it("registers a skill and makes it retrievable by name", () => {
      const skill = makeSkill("alpha");
      registry.register(skill);
      expect(registry.get("alpha")).toBe(skill);
    });

    it("registered skill appears in getAll", () => {
      const skill = makeSkill("beta");
      registry.register(skill);
      expect(registry.getAll()).toContain(skill);
    });

    it("registers multiple skills", () => {
      const a = makeSkill("a");
      const b = makeSkill("b");
      registry.register(a);
      registry.register(b);
      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe("get", () => {
    it("returns the correct skill by name", () => {
      const skill = makeSkill("target");
      registry.register(makeSkill("other"));
      registry.register(skill);
      expect(registry.get("target")).toBe(skill);
    });

    it("returns undefined for unregistered name", () => {
      registry.register(makeSkill("registered"));
      expect(registry.get("missing")).toBeUndefined();
    });
  });

  describe("getAll", () => {
    it("returns all registered skills", () => {
      const skills = [makeSkill("x"), makeSkill("y"), makeSkill("z")];
      skills.forEach((s) => registry.register(s));
      const all = registry.getAll();
      expect(all).toHaveLength(3);
      skills.forEach((s) => expect(all).toContain(s));
    });
  });

  describe("getTools", () => {
    it("returns tools from all registered skills flattened", () => {
      const tool1 = makeTool("tool_one");
      const tool2 = makeTool("tool_two");
      const tool3 = makeTool("tool_three");

      registry.register(makeSkill("s1", { tools: [tool1, tool2] }));
      registry.register(makeSkill("s2", { tools: [tool3] }));

      const tools = registry.getTools();
      expect(tools).toHaveLength(3);
      expect(tools).toContain(tool1);
      expect(tools).toContain(tool2);
      expect(tools).toContain(tool3);
    });

    it("returns empty array when no skills registered", () => {
      expect(registry.getTools()).toEqual([]);
    });

    it("returns empty array when skills have no tools", () => {
      registry.register(makeSkill("empty", { tools: [] }));
      expect(registry.getTools()).toEqual([]);
    });
  });

  describe("getSystemInstructions", () => {
    it("returns empty string when no skills have instructions", () => {
      registry.register(makeSkill("no-instructions", { instructions: undefined }));
      expect(registry.getSystemInstructions()).toBe("");
    });

    it("formats a single skill's instructions with header", () => {
      registry.register(makeSkill("my-skill", { instructions: "Do something useful." }));
      expect(registry.getSystemInstructions()).toBe("## my-skill\nDo something useful.");
    });

    it("concatenates multiple skills' instructions separated by blank lines", () => {
      registry.register(makeSkill("skill-a", { instructions: "Instructions A." }));
      registry.register(makeSkill("skill-b", { instructions: "Instructions B." }));
      const result = registry.getSystemInstructions();
      expect(result).toBe("## skill-a\nInstructions A.\n\n## skill-b\nInstructions B.");
    });

    it("skips skills without instructions", () => {
      registry.register(makeSkill("with-instructions", { instructions: "Has instructions." }));
      registry.register(makeSkill("without-instructions", { instructions: undefined }));
      expect(registry.getSystemInstructions()).toBe("## with-instructions\nHas instructions.");
    });
  });

  describe("duplicate handling", () => {
    it("overwrites existing skill when registering same name", () => {
      const original = makeSkill("dup");
      const replacement = makeSkill("dup");
      registry.register(original);
      registry.register(replacement);
      expect(registry.get("dup")).toBe(replacement);
      expect(registry.getAll()).toHaveLength(1);
    });

    it("logs a warning when overwriting a skill", () => {
      const warnSpy = spyOn(console, "warn");
      registry.register(makeSkill("dup"));
      registry.register(makeSkill("dup"));
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("dup")
      );
    });
  });
});
