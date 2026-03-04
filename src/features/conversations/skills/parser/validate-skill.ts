export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSkill(name: string, description: string): ValidationResult {
  const errors: string[] = [];

  // Name: lowercase, hyphens, max 64 chars
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push('Name must be lowercase with hyphens only');
  }
  if (name.length > 64) {
    errors.push('Name must be 64 characters or less');
  }

  // Description: max 1024 chars
  if (description.length > 1024) {
    errors.push('Description must be 1024 characters or less');
  }

  return { valid: errors.length === 0, errors };
}
