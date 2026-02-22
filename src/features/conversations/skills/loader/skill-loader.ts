import { parseSkillFile } from "../parser/skill-parser";
import type { Skill } from "../types";
import fs from "fs/promises";
import path from "path";

export async function discoverSkills(projectRoot: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  const skillDir = path.join(projectRoot, ".agents/skills");

  try {
    const entries = await fs.readdir(skillDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(skillDir, entry.name, "SKILL.md");

      try {
        const content = await fs.readFile(skillPath, "utf-8");
        const parsed = parseSkillFile(content);

        skills.push({
          name: parsed.name,
          description: parsed.description,
          category: "external",
          tools: [], // External skills don't have tools yet
          instructions: parsed.content,
          metadata: parsed.metadata,
        });
      } catch (e) {
        console.warn(`Failed to parse skill at ${skillPath}:`, e);
      }
    }
  } catch {
    // Directory doesn't exist, return empty array
  }

  return skills;
}
