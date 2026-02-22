/**
 * Feature flag for the skill system.
 * Controls whether the skill system is enabled or disabled.
 * Defaults to false for safe rollout.
 */

export function isSkillSystemEnabled(): boolean {
  return process.env.ENABLE_SKILL_SYSTEM === 'true';
}
