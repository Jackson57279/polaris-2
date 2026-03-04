import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { discoverSkills } from "./skill-loader";
import { join } from "path";
import { tmpdir } from "os";

const TEST_TIMEOUT = 10000;

describe("discoverSkills", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skill-loader-test-${Date.now()}`);
    await mkdir(join(testDir, ".agents/skills"), { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("when skills directory does not exist", () => {
    it("returns empty array", async () => {
      const nonExistentDir = join(tmpdir(), `non-existent-${Date.now()}`);
      const skills = await discoverSkills(nonExistentDir);
      expect(skills).toEqual([]);
    }, TEST_TIMEOUT);
  });

  describe("when skills directory exists but is empty", () => {
    it("returns empty array", async () => {
      const skills = await discoverSkills(testDir);
      expect(skills).toEqual([]);
    }, TEST_TIMEOUT);
  });

  describe("when skills exist", () => {
    it("discovers single skill", async () => {
      const skillDir = join(testDir, ".agents/skills", "test-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `---
name: test-skill
description: A test skill
---

## Instructions

Test instructions.`
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe("test-skill");
      expect(skills[0].description).toBe("A test skill");
      expect(skills[0].category).toBe("external");
      expect(skills[0].tools).toEqual([]);
      expect(skills[0].instructions).toContain("Test instructions");
    }, TEST_TIMEOUT);

    it("discovers multiple skills", async () => {
      const skill1Dir = join(testDir, ".agents/skills", "skill-one");
      const skill2Dir = join(testDir, ".agents/skills", "skill-two");
      
      await mkdir(skill1Dir, { recursive: true });
      await mkdir(skill2Dir, { recursive: true });
      
      await writeFile(
        join(skill1Dir, "SKILL.md"),
        `---
name: skill-one
description: First skill
---

Instructions one.`
      );
      
      await writeFile(
        join(skill2Dir, "SKILL.md"),
        `---
name: skill-two
description: Second skill
---

Instructions two.`
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toHaveLength(2);
      
      const names = skills.map((s) => s.name).sort();
      expect(names).toEqual(["skill-one", "skill-two"]);
    }, TEST_TIMEOUT);

    it("parses metadata when present", async () => {
      const skillDir = join(testDir, ".agents/skills", "meta-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `---
name: meta-skill
description: A skill with metadata
metadata:
  version: 1.0.0
  author: test-author
---

Instructions.`
      );

      const skills = await discoverSkills(testDir);

      expect(skills[0].metadata).toEqual({
        version: "1.0.0",
        author: "test-author",
      });
    }, TEST_TIMEOUT);
  });

  describe("when skills are malformed", () => {
    it("skips skill with invalid SKILL.md", async () => {
      const skillDir = join(testDir, ".agents/skills", "invalid-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `Invalid content without frontmatter`
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toEqual([]);
    }, TEST_TIMEOUT);

    it("skips skill with missing SKILL.md", async () => {
      const skillDir = join(testDir, ".agents/skills", "no-skill-file");
      await mkdir(skillDir, { recursive: true });
      // Don't create SKILL.md

      const skills = await discoverSkills(testDir);

      expect(skills).toEqual([]);
    }, TEST_TIMEOUT);

    it("loads valid skills and skips invalid ones", async () => {
      const validDir = join(testDir, ".agents/skills", "valid-skill");
      const invalidDir = join(testDir, ".agents/skills", "invalid-skill");
      
      await mkdir(validDir, { recursive: true });
      await mkdir(invalidDir, { recursive: true });
      
      await writeFile(
        join(validDir, "SKILL.md"),
        `---
name: valid-skill
description: Valid skill
---

Instructions.`
      );
      
      await writeFile(
        join(invalidDir, "SKILL.md"),
        `Invalid content`
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe("valid-skill");
    }, TEST_TIMEOUT);
  });

  describe("edge cases", () => {
    it("ignores non-directory entries in skills folder", async () => {
      const skillDir = join(testDir, ".agents/skills", "good-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `---
name: good-skill
description: Good skill
---

Instructions.`
      );
      
      // Create a file in skills directory (should be ignored)
      await writeFile(
        join(testDir, ".agents/skills", "not-a-skill.txt"),
        "This is a file, not a skill directory"
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe("good-skill");
    }, TEST_TIMEOUT);

    it("handles skill with empty instructions", async () => {
      const skillDir = join(testDir, ".agents/skills", "empty-instructions");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `---
name: empty-instructions
description: Skill with empty body
---`
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe("empty-instructions");
      expect(skills[0].instructions).toBe("");
    }, TEST_TIMEOUT);

    it("handles deeply nested skill content", async () => {
      const skillDir = join(testDir, ".agents/skills", "nested-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `---
name: nested-skill
description: A skill with nested content
---

# Header

- Item 1
- Item 2

\`\`\`typescript
const x = 1;
\`\`\`

More text here.`
      );

      const skills = await discoverSkills(testDir);

      expect(skills).toHaveLength(1);
      expect(skills[0].instructions).toContain("# Header");
      expect(skills[0].instructions).toContain("\`\`\`typescript");
    }, TEST_TIMEOUT);
  });
});
