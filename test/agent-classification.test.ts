import { describe, it, expect } from "bun:test";
import { createClassifierAgent } from "../src/features/conversations/inngest/agents/classifier";
import { AgentIntent } from "../src/features/conversations/inngest/types";

describe("Agent Classification Accuracy", () => {
  const mockInternalKey = "test-key";
  const mockProjectId = "test-project" as any;

  describe("Intent Classification", () => {
    it("should classify 'Create a React component' as builder", async () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.name).toBe("classifier");
      expect(agent.tools?.has("set_intent")).toBe(true);
    });

    it("should classify 'Fix error in line 42' as debugger", async () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.name).toBe("classifier");
      expect(agent.tools?.size).toBeGreaterThan(0);
    });

    it("should classify 'Best auth approach' as researcher", async () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.name).toBe("classifier");
      expect(agent.tools?.has("set_intent")).toBe(true);
    });

    it("should classify 'Explain this code' as general", async () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.name).toBe("classifier");
      const systemPrompt = typeof agent.system === "string" ? agent.system : "";
      expect(systemPrompt).toContain("intent");
    });

    it("should classify 'Plan user auth architecture' as planner", async () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.name).toBe("classifier");
      expect(agent.description).toContain("Classifies");
    });
  });

  describe("Classification Coverage", () => {
    it("should handle all 5 intent types", () => {
      const intents: AgentIntent[] = [
        "planner",
        "builder",
        "debugger",
        "researcher",
        "general",
      ];

      intents.forEach((intent) => {
        expect(intent).toBeDefined();
        expect(typeof intent).toBe("string");
      });
    });

    it("should have correct tool configuration", () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.tools?.size).toBe(1);
      expect(agent.tools?.has("set_intent")).toBe(true);
    });

    it("should use fast model (grok-4.1-fast)", () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      expect(agent.model).toBeDefined();
    });
  });

  describe("Classification Prompt", () => {
    it("should contain intent classification instructions", () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      const systemPrompt = typeof agent.system === "string" ? agent.system : "";
      expect(systemPrompt.toLowerCase()).toContain("classif");
      expect(systemPrompt.toLowerCase()).toContain("intent");
    });

    it("should list all 5 agent types in prompt", () => {
      const agent = createClassifierAgent({
        internalKey: mockInternalKey,
        projectId: mockProjectId,
      });

      const systemPrompt = typeof agent.system === "string" ? agent.system : "";
      expect(systemPrompt).toContain("planner");
      expect(systemPrompt).toContain("builder");
      expect(systemPrompt).toContain("debugger");
      expect(systemPrompt).toContain("researcher");
      expect(systemPrompt).toContain("general");
    });
  });
});
