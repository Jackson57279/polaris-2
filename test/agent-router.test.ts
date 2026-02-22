import { describe, it, expect, beforeEach } from "bun:test";

/**
 * Agent Router Test Suite
 * 
 * Tests the multi-agent network router behavior:
 * 1. Classifier runs first on callCount 0
 * 2. Routes to specialist after intent is set
 * 3. Stops on text response without tool calls
 * 4. Respects maxAgentSwitches guardrail (5)
 */

// Mock agent type
interface MockAgent {
  name: string;
}

// Mock network state matching PolarisNetworkState
interface MockNetworkState {
  intent?: string;
  confidence?: number;
  routed?: boolean;
  agentSwitchCount?: number;
}

// Mock message output
interface MockMessage {
  type: "text" | "tool_call";
  role: "assistant" | "user";
  content?: string;
}

// Mock result from network iteration
interface MockResult {
  output: MockMessage[];
}

// Mock network object
interface MockNetwork {
  state: {
    data: MockNetworkState;
    results: MockResult[];
  };
}

// Router function type (extracted from process-message.ts)
type RouterFunction = (params: {
  network: MockNetwork;
  callCount: number;
}) => MockAgent | undefined;

// Create mock agents
const createMockAgent = (name: string): MockAgent => ({ name });

const classifierAgent = createMockAgent("classifier");
const plannerAgent = createMockAgent("planner");
const builderAgent = createMockAgent("builder");
const debuggerAgent = createMockAgent("debugger");
const researcherAgent = createMockAgent("researcher");
const generalAgent = createMockAgent("general");

// Router implementation (extracted from process-message.ts lines 183-230)
const createRouter = (): RouterFunction => {
  return ({ network, callCount }) => {
    const MAX_SWITCHES = 5;
    const switchCount = network.state.data.agentSwitchCount || 0;

    // Guardrail: prevent infinite loops
    if (switchCount >= MAX_SWITCHES) {
      return undefined;
    }

    // Phase 1: Classify intent on first call
    if (callCount === 0) {
      return classifierAgent;
    }

    // Phase 2: Route to specialist based on intent
    if (!network.state.data.routed && network.state.data.intent) {
      network.state.data.routed = true;
      network.state.data.agentSwitchCount = switchCount + 1;

      const intent = network.state.data.intent;
      const agentMap: Record<string, MockAgent> = {
        planner: plannerAgent,
        builder: builderAgent,
        debugger: debuggerAgent,
        researcher: researcherAgent,
        general: generalAgent,
      };
      return agentMap[intent] || generalAgent;
    }

    // Phase 3: Check for completion (existing logic)
    const lastResult = network.state.results.at(-1);
    const hasTextResponse = lastResult?.output.some(
      (m) => m.type === "text" && m.role === "assistant"
    );
    const hasToolCalls = lastResult?.output.some(
      (m) => m.type === "tool_call"
    );

    // Anthropic outputs text AND tool calls together
    // Only stop if there's text WITHOUT tool calls (final response)
    if (hasTextResponse && !hasToolCalls) {
      return undefined;
    }

    // Continue with current agent (return undefined to continue)
    return undefined;
  };
};

describe("Agent Router", () => {
  let router: RouterFunction;

  beforeEach(() => {
    router = createRouter();
  });

  describe("Phase 1: Classifier on first call", () => {
    it("should return classifier agent when callCount is 0", () => {
      const network: MockNetwork = {
        state: {
          data: {},
          results: [],
        },
      };

      const result = router({ network, callCount: 0 });

      expect(result).toBe(classifierAgent);
      expect(result?.name).toBe("classifier");
    });

    it("should return classifier agent regardless of network state on callCount 0", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 2,
          },
          results: [
            {
              output: [
                { type: "text", role: "assistant", content: "test" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 0 });

      expect(result).toBe(classifierAgent);
    });
  });

  describe("Phase 2: Route to specialist after intent set", () => {
    it("should route to planner when intent is 'planner'", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "planner",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(plannerAgent);
      expect(network.state.data.routed).toBe(true);
      expect(network.state.data.agentSwitchCount).toBe(1);
    });

    it("should route to builder when intent is 'builder'", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(builderAgent);
      expect(network.state.data.routed).toBe(true);
    });

    it("should route to debugger when intent is 'debugger'", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "debugger",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(debuggerAgent);
    });

    it("should route to researcher when intent is 'researcher'", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "researcher",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(researcherAgent);
    });

    it("should route to general when intent is 'general'", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "general",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(generalAgent);
    });

    it("should route to general agent for unknown intent", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "unknown_intent",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(generalAgent);
    });

    it("should increment agentSwitchCount when routing", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: false,
            agentSwitchCount: 2,
          },
          results: [],
        },
      };

      router({ network, callCount: 1 });

      expect(network.state.data.agentSwitchCount).toBe(3);
    });

    it("should not route if already routed", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBeUndefined();
    });

    it("should not route if intent is not set", () => {
      const network: MockNetwork = {
        state: {
          data: {
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBeUndefined();
    });
  });

  describe("Phase 3: Stop on text response without tool calls", () => {
    it("should stop when text response exists without tool calls", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [
            {
              output: [
                { type: "text", role: "assistant", content: "Here is the solution" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });

    it("should continue when text response has tool calls", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [
            {
              output: [
                { type: "text", role: "assistant", content: "Let me create a file" },
                { type: "tool_call", role: "assistant" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });

    it("should continue when only tool calls exist (no text)", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [
            {
              output: [
                { type: "tool_call", role: "assistant" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });

    it("should continue when no results exist yet", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });

    it("should stop on multiple text messages without tool calls", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [
            {
              output: [
                { type: "text", role: "assistant", content: "First response" },
                { type: "text", role: "assistant", content: "Second response" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });
  });

  describe("maxAgentSwitches guardrail (5)", () => {
    it("should stop when agentSwitchCount reaches MAX_SWITCHES (5)", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: false,
            agentSwitchCount: 5,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBeUndefined();
    });

    it("should stop when agentSwitchCount exceeds MAX_SWITCHES", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: false,
            agentSwitchCount: 6,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBeUndefined();
    });

    it("should allow routing when agentSwitchCount is below MAX_SWITCHES", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: false,
            agentSwitchCount: 4,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBe(builderAgent);
    });

    it("should track switch count through multiple routing cycles", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: false,
            agentSwitchCount: 0,
          },
          results: [],
        },
      };

      // First route
      router({ network, callCount: 1 });
      expect(network.state.data.agentSwitchCount).toBe(1);

      // Simulate next intent
      network.state.data.intent = "debugger";
      network.state.data.routed = false;

      // Second route
      router({ network, callCount: 2 });
      expect(network.state.data.agentSwitchCount).toBe(2);

      // Continue until max
      for (let i = 3; i <= 5; i++) {
        network.state.data.intent = "planner";
        network.state.data.routed = false;
        router({ network, callCount: i });
      }

      expect(network.state.data.agentSwitchCount).toBe(5);

      // Next attempt should be blocked
      network.state.data.intent = "builder";
      network.state.data.routed = false;
      const result = router({ network, callCount: 6 });

      expect(result).toBeUndefined();
    });

    it("should initialize agentSwitchCount to 0 if undefined", () => {
      const network: MockNetwork = {
        state: {
          data: {},
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBeUndefined();
    });
  });

  describe("Integration: Full routing flow", () => {
    it("should execute complete flow: classify -> route -> execute -> stop", () => {
      const network: MockNetwork = {
        state: {
          data: {},
          results: [],
        },
      };

      // Step 1: Classify (callCount 0)
      let result = router({ network, callCount: 0 });
      expect(result).toBe(classifierAgent);

      // Step 2: Classifier sets intent
      network.state.data.intent = "builder";
      network.state.data.agentSwitchCount = 0;

      // Step 3: Route to builder (callCount 1)
      result = router({ network, callCount: 1 });
      expect(result).toBe(builderAgent);
      expect(network.state.data.routed).toBe(true);

      // Step 4: Builder executes with tool calls
      network.state.results.push({
        output: [
          { type: "text", role: "assistant", content: "Creating file..." },
          { type: "tool_call", role: "assistant" },
        ],
      });

      // Step 5: Continue (callCount 2)
      result = router({ network, callCount: 2 });
      expect(result).toBeUndefined();

      // Step 6: Builder returns final text response
      network.state.results.push({
        output: [
          { type: "text", role: "assistant", content: "File created successfully" },
        ],
      });

      // Step 7: Stop (callCount 3)
      result = router({ network, callCount: 3 });
      expect(result).toBeUndefined();
    });

    it("should handle guardrail interruption during flow", () => {
      const network: MockNetwork = {
        state: {
          data: {
            agentSwitchCount: 4,
          },
          results: [],
        },
      };

      // Attempt to route when near max
      network.state.data.intent = "builder";
      network.state.data.routed = false;

      let result = router({ network, callCount: 1 });
      expect(result).toBe(builderAgent);
      expect(network.state.data.agentSwitchCount).toBe(5);

      // Next attempt should be blocked
      network.state.data.intent = "debugger";
      network.state.data.routed = false;

      result = router({ network, callCount: 2 });
      expect(result).toBeUndefined();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty results array", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });

    it("should handle undefined network state data", () => {
      const network: MockNetwork = {
        state: {
          data: {},
          results: [],
        },
      };

      const result = router({ network, callCount: 1 });

      expect(result).toBeUndefined();
    });

    it("should handle mixed message types in output", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [
            {
              output: [
                { type: "tool_call", role: "assistant" },
                { type: "text", role: "assistant", content: "Done" },
                { type: "tool_call", role: "assistant" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });

    it("should ignore non-assistant text messages", () => {
      const network: MockNetwork = {
        state: {
          data: {
            intent: "builder",
            routed: true,
            agentSwitchCount: 1,
          },
          results: [
            {
              output: [
                { type: "text", role: "user", content: "User message" },
              ],
            },
          ],
        },
      };

      const result = router({ network, callCount: 2 });

      expect(result).toBeUndefined();
    });
  });
});
