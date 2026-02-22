import yaml from "js-yaml";

import type { SkillMetadata } from "../types";

export interface ParsedSkill {
  name: string;
  description: string;
  content: string;
  metadata?: SkillMetadata;
}

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

interface SkillFrontmatter {
  name?: string;
  description?: string;
  metadata?: SkillMetadata;
}

export function parseSkillFile(raw: string): ParsedSkill {
  const match = raw.match(FRONTMATTER_REGEX);
  if (!match) {
    throw new Error("Invalid SKILL.md format: missing frontmatter");
  }

  const [, yamlContent, bodyContent] = match;
  const frontmatter = yaml.load(yamlContent) as SkillFrontmatter | undefined;

  if (!frontmatter || typeof frontmatter !== "object") {
    throw new Error("Invalid SKILL.md format: frontmatter is not a YAML object");
  }

  if (!frontmatter.name || typeof frontmatter.name !== "string") {
    throw new Error("Invalid SKILL.md format: missing or invalid 'name' field");
  }

  if (!frontmatter.description || typeof frontmatter.description !== "string") {
    throw new Error(
      "Invalid SKILL.md format: missing or invalid 'description' field"
    );
  }

  return {
    name: frontmatter.name,
    description: frontmatter.description,
    content: bodyContent.trim(),
    metadata: frontmatter.metadata,
  };
}
