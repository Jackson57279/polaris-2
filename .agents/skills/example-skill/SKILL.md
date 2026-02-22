---
name: example-skill
description: An example external skill demonstrating the skills.sh format
metadata:
  version: 1.0.0
  author: polaris-team
  tags:
    - example
    - documentation
---

## Overview

This is an example external skill for the Polaris skill system. It demonstrates how to create skills using the skills.sh/Agent Skills format.

## When to Use

Use this skill as a template when creating new external skills for Polaris. It shows the proper YAML frontmatter format and markdown instruction structure.

## Instructions

External skills in Polaris are loaded from `.agents/skills/{skill-name}/SKILL.md` files. Each skill consists of:

1. **YAML Frontmatter** (between `---` delimiters):
   - `name`: Unique identifier for the skill (lowercase, hyphens only)
   - `description`: Brief description of what the skill does
   - `metadata`: Optional metadata object with version, author, tags, etc.

2. **Markdown Body** (after frontmatter):
   - Contains instructions for the AI agent
   - Explains when and how to use the skill
   - Provides examples and context

## Best Practices

- Keep skill names descriptive but concise
- Use lowercase with hyphens (kebab-case)
- Provide clear, actionable instructions
- Include examples where helpful
- Document any assumptions or prerequisites

## Example Usage

When the skill system is enabled (`ENABLE_SKILL_SYSTEM=true`), this skill's instructions will be appended to the system prompt automatically.

Skills are loaded at runtime from the filesystem, making them easy to update without code changes.
