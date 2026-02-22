import type { Skill } from "./types";
import type { Tool } from "@inngest/agent-kit";

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  /**
   * Register a skill in the registry.
   * If a skill with the same name already exists, logs a warning and overwrites it.
   */
  register(skill: Skill): void {
    if (this.skills.has(skill.name)) {
      console.warn(
        `Skill "${skill.name}" already registered, overwriting with new version`
      );
    }
    this.skills.set(skill.name, skill);
  }

  /**
   * Get a skill by name.
   */
  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all registered skills.
   */
  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get all tools from all registered skills, flattened into a single array.
   */
  getTools(): Tool<string, any, unknown>[] {
    return this.getAll().flatMap((skill) => skill.tools);
  }

  /**
   * Get concatenated system instructions from all skills.
   * Each skill's instructions are prefixed with a header and separated by blank lines.
   */
  getSystemInstructions(): string {
    return this.getAll()
      .filter((skill) => skill.instructions)
      .map((skill) => `## ${skill.name}\n${skill.instructions}`)
      .join("\n\n");
  }
}
