import { describe, it, expect } from "bun:test";
import { parseSkillFile } from "./skill-parser";
import { validateSkill } from "./validate-skill";

describe("parseSkillFile", () => {
  describe("valid SKILL.md files", () => {
    it("parses valid SKILL.md with all fields", () => {
      const content = `---
name: my-skill
description: A helpful skill for doing things
metadata:
  version: 1.0.0
  author: test
---

## Instructions

These are the skill instructions.`;

      const result = parseSkillFile(content);

      expect(result.name).toBe("my-skill");
      expect(result.description).toBe("A helpful skill for doing things");
      expect(result.content).toBe("## Instructions\n\nThese are the skill instructions.");
      expect(result.metadata).toEqual({ version: "1.0.0", author: "test" });
    });

    it("parses valid SKILL.md without metadata", () => {
      const content = `---
name: simple-skill
description: A simple skill
---

Do simple things.`;

      const result = parseSkillFile(content);

      expect(result.name).toBe("simple-skill");
      expect(result.description).toBe("A simple skill");
      expect(result.content).toBe("Do simple things.");
      expect(result.metadata).toBeUndefined();
    });

    it("parses empty content body", () => {
      const content = `---
name: empty-skill
description: A skill with empty body
---`;

      const result = parseSkillFile(content);

      expect(result.name).toBe("empty-skill");
      expect(result.description).toBe("A skill with empty body");
      expect(result.content).toBe("");
    });

    it("preserves markdown formatting in content", () => {
      const content = `---
name: markdown-skill
description: A skill with markdown
---

# Header

- Item 1
- Item 2

\`\`\`typescript
const x = 1;
\`\`\``;

      const result = parseSkillFile(content);

      expect(result.content).toContain("# Header");
      expect(result.content).toContain("- Item 1");
      expect(result.content).toContain("\`\`\`typescript");
    });

    it("handles multi-line description in frontmatter", () => {
      const content = `---
name: multi-line
description: |
  This is a multi-line
  description that spans
  multiple lines
---

Content here.`;

      const result = parseSkillFile(content);

      expect(result.description).toContain("This is a multi-line");
      expect(result.description).toContain("multiple lines");
    });
  });

  describe("invalid SKILL.md files", () => {
    it("throws error when frontmatter is missing", () => {
      const content = `No frontmatter here`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: missing frontmatter"
      );
    });

    it("throws error when YAML is malformed", () => {
      const content = `---
name: test
description: test
  invalid yaml here:
---

Content`;

      expect(() => parseSkillFile(content)).toThrow();
    });

    it("throws error when name field is missing", () => {
      const content = `---
description: A skill without name
---

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: missing or invalid 'name' field"
      );
    });

    it("throws error when name is not a string", () => {
      const content = `---
name: 123
description: A skill
---

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: missing or invalid 'name' field"
      );
    });

    it("throws error when description field is missing", () => {
      const content = `---
name: no-desc-skill
---

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: missing or invalid 'description' field"
      );
    });

    it("throws error when description is not a string", () => {
      const content = `---
name: test-skill
description: true
---

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: missing or invalid 'description' field"
      );
    });

    it("throws error when frontmatter is empty", () => {
      const content = `---

---

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: frontmatter is not a YAML object"
      );
    });

    it("throws error when frontmatter is not an object", () => {
      const content = `---
just a string
---

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: frontmatter is not a YAML object"
      );
    });

    it("throws error for single frontmatter delimiter", () => {
      const content = `---
name: test
description: test

Content`;

      expect(() => parseSkillFile(content)).toThrow(
        "Invalid SKILL.md format: missing frontmatter"
      );
    });
  });
});

describe("validateSkill", () => {
  describe("valid names and descriptions", () => {
    it("returns valid for simple lowercase name", () => {
      const result = validateSkill("my-skill", "A description");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns valid for name with numbers", () => {
      const result = validateSkill("skill-123", "A description");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns valid for name with only hyphens", () => {
      const result = validateSkill("my-skill-name", "A description");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns valid for name exactly 64 characters", () => {
      const name = "a".repeat(64);
      const result = validateSkill(name, "A description");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("returns valid for description exactly 1024 characters", () => {
      const description = "b".repeat(1024);
      const result = validateSkill("my-skill", description);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("invalid names", () => {
    it("returns error for name with uppercase letters", () => {
      const result = validateSkill("MySkill", "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
    });

    it("returns error for name with spaces", () => {
      const result = validateSkill("my skill", "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
    });

    it("returns error for name with special characters", () => {
      const result = validateSkill("my@skill!", "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
    });

    it("returns error for name with underscores", () => {
      const result = validateSkill("my_skill", "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
    });

    it("returns error for name with dots", () => {
      const result = validateSkill("my.skill", "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
    });

    it("returns error for name longer than 64 characters", () => {
      const name = "a".repeat(65);
      const result = validateSkill(name, "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be 64 characters or less");
    });

    it("returns multiple errors for multiple violations", () => {
      const name = "My_Invalid_Skill_Name_" + "a".repeat(50);
      const result = validateSkill(name, "A description");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
      expect(result.errors).toContain("Name must be 64 characters or less");
      expect(result.errors.length).toBe(2);
    });
  });

  describe("invalid descriptions", () => {
    it("returns error for description longer than 1024 characters", () => {
      const description = "c".repeat(1025);
      const result = validateSkill("my-skill", description);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Description must be 1024 characters or less");
    });
  });

  describe("combined validations", () => {
    it("returns errors for both invalid name and invalid description", () => {
      const name = "My Skill";
      const description = "d".repeat(1025);
      const result = validateSkill(name, description);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Name must be lowercase with hyphens only");
      expect(result.errors).toContain("Description must be 1024 characters or less");
      expect(result.errors.length).toBe(2);
    });
  });
});
