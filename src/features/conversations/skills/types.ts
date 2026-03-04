import type { Tool } from "@inngest/agent-kit";

export interface SkillMetadata {
  version?: string;
  author?: string;
  internal?: boolean;
}

export interface Skill {
  name: string;
  description: string;
  category?: string;
  tools: Tool<string, any, unknown>[];
  instructions?: string;
  metadata?: SkillMetadata;
}

export type SkillFactory<TContext = any> = (context: TContext) => Skill;

export interface SkillRegistrationResult {
  success: boolean;
  skillName: string;
  message?: string;
}

export interface SkillRegistryOptions {
  maxSkills?: number;
  warnOnDuplicate?: boolean;
}
