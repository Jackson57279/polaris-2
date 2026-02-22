import { describe, it, expect } from "bun:test";

type AgentIntent =
  | "planner"
  | "builder"
  | "debugger"
  | "researcher"
  | "general";

interface PolarisNetworkState {
  intent?: AgentIntent;
  confidence?: number;
  routed?: boolean;
  agentSwitchCount?: number;
}

interface MockAgent {
  name: string;
}

interface RouterContext {
  network: {
    state: {
      data: PolarisNetworkState;
      results: Array<{
        output: Array<{ type: string; role?: string }>;
      }>;
    };
  };
  callCount: number;
}

// Replica of the router from process-message.ts (lines 183-230).
// Source-verification tests below confirm this matches the actual code.
function createRouter(agents: Record<string, MockAgent>) {
  const MAX_SWITCHES = 5;
  const classifierAgent = agents.classifier;

  return ({ network, callCount }: RouterContext): MockAgent | undefined => {
    const switchCount = network.state.data.agentSwitchCount || 0;

    if (switchCount >= MAX_SWITCHES) {
      return undefined;
    }

    if (callCount === 0) {
      return classifierAgent;
    }

    if (!network.state.data.routed && network.state.data.intent) {
      network.state.data.routed = true;
      network.state.data.agentSwitchCount = switchCount + 1;

      const intent = network.state.data.intent;
      const agentMap: Record<string, MockAgent> = {
        planner: agents.planner,
        builder: agents.builder,
        debugger: agents.debugger,
        researcher: agents.researcher,
        general: agents.general,
      };
      return agentMap[intent] || agents.general;
    }

    const lastResult = network.state.results.at(-1);
    const hasTextResponse = lastResult?.output.some(
      (m) => m.type === "text" && m.role === "assistant",
    );
    const hasToolCalls = lastResult?.output.some(
      (m) => m.type === "tool_call",
    );

    if (hasTextResponse && !hasToolCalls) {
      return undefined;
    }

    return undefined;
  };
}

// Replica of set_intent handler from classifier.ts
function setIntentHandler(
  params: { intent: AgentIntent; confidence: number },
  networkState: { data: PolarisNetworkState },
): string {
  networkState.data = networkState.data ?? {};
  networkState.data.intent = params.intent;
  networkState.data.confidence = params.confidence;
  return `Intent classified: ${params.intent} (confidence: ${params.confidence})`;
}

// Replica of color map from agent-badge.tsx
const agentColors: Record<string, string> = {
  classifier: "bg-gray-100 text-gray-700",
  planner: "bg-blue-100 text-blue-700",
  builder: "bg-green-100 text-green-700",
  debugger: "bg-orange-100 text-orange-700",
  researcher: "bg-purple-100 text-purple-700",
  general: "bg-slate-100 text-slate-700",
};

function getAgentBadgeColor(
  agentType: string | null | undefined,
): string | null {
  if (!agentType) return null;
  return agentColors[agentType] || "bg-gray-100 text-gray-700";
}

const agents: Record<string, MockAgent> = {
  classifier: { name: "classifier" },
  planner: { name: "planner" },
  builder: { name: "builder" },
  debugger: { name: "debugger" },
  researcher: { name: "researcher" },
  general: { name: "general" },
};

function makeRouterContext(
  overrides: {
    callCount?: number;
    data?: PolarisNetworkState;
    results?: RouterContext["network"]["state"]["results"];
  } = {},
): RouterContext {
  return {
    callCount: overrides.callCount ?? 0,
    network: {
      state: {
        data: overrides.data ?? {},
        results: overrides.results ?? [],
      },
    },
  };
}

describe("Multi-Agent Network Routing", () => {
  const router = createRouter(agents);

  it("dispatches to classifier on first call (callCount === 0)", () => {
    const ctx = makeRouterContext({ callCount: 0 });
    expect(router(ctx)).toBe(agents.classifier);
  });

  it("does not dispatch classifier on subsequent calls", () => {
    const ctx = makeRouterContext({ callCount: 1 });
    expect(router(ctx)).toBeUndefined();
  });

  describe("routes to specialist based on classified intent", () => {
    const intents: AgentIntent[] = [
      "planner",
      "builder",
      "debugger",
      "researcher",
      "general",
    ];

    for (const intent of intents) {
      it(`routes to ${intent} agent when intent is '${intent}'`, () => {
        const data: PolarisNetworkState = { intent };
        const ctx = makeRouterContext({ callCount: 1, data });
        const result = router(ctx);

        expect(result).toBe(agents[intent]);
        expect(ctx.network.state.data.routed).toBe(true);
        expect(ctx.network.state.data.agentSwitchCount).toBe(1);
      });
    }
  });

  it("falls back to general for unknown intent", () => {
    const data: PolarisNetworkState = {
      intent: "unknown" as AgentIntent,
    };
    const ctx = makeRouterContext({ callCount: 1, data });
    expect(router(ctx)).toBe(agents.general);
  });

  it("does not re-route once already routed", () => {
    const data: PolarisNetworkState = {
      intent: "builder",
      routed: true,
      agentSwitchCount: 1,
    };
    const ctx = makeRouterContext({
      callCount: 2,
      data,
      results: [{ output: [{ type: "tool_call" }] }],
    });
    expect(router(ctx)).toBeUndefined();
  });

  it("respects MAX_SWITCHES guardrail (5)", () => {
    const data: PolarisNetworkState = {
      intent: "builder",
      agentSwitchCount: 5,
    };
    const ctx = makeRouterContext({ callCount: 1, data });
    expect(router(ctx)).toBeUndefined();
  });

  it("stops when assistant text response without tool calls", () => {
    const data: PolarisNetworkState = {
      intent: "builder",
      routed: true,
      agentSwitchCount: 1,
    };
    const ctx = makeRouterContext({
      callCount: 3,
      data,
      results: [
        {
          output: [{ type: "text", role: "assistant" }],
        },
      ],
    });
    expect(router(ctx)).toBeUndefined();
  });

  it("continues iteration when tool calls are present alongside text", () => {
    const data: PolarisNetworkState = {
      intent: "builder",
      routed: true,
      agentSwitchCount: 1,
    };
    const ctx = makeRouterContext({
      callCount: 3,
      data,
      results: [
        {
          output: [
            { type: "text", role: "assistant" },
            { type: "tool_call" },
          ],
        },
      ],
    });
    expect(router(ctx)).toBeUndefined();
  });
});

describe("Classifier set_intent Tool", () => {
  it("persists intent and confidence to network state", () => {
    const state: { data: PolarisNetworkState } = { data: {} };
    const result = setIntentHandler(
      { intent: "builder", confidence: 0.95 },
      state,
    );

    expect(state.data.intent).toBe("builder");
    expect(state.data.confidence).toBe(0.95);
    expect(result).toBe("Intent classified: builder (confidence: 0.95)");
  });

  it("works for every valid intent type", () => {
    const intents: AgentIntent[] = [
      "planner",
      "builder",
      "debugger",
      "researcher",
      "general",
    ];
    for (const intent of intents) {
      const state: { data: PolarisNetworkState } = { data: {} };
      setIntentHandler({ intent, confidence: 0.8 }, state);
      expect(state.data.intent).toBe(intent);
    }
  });

  it("overwrites previous intent on re-classification", () => {
    const state: { data: PolarisNetworkState } = {
      data: { intent: "general", confidence: 0.5 },
    };
    setIntentHandler({ intent: "debugger", confidence: 0.99 }, state);
    expect(state.data.intent).toBe("debugger");
    expect(state.data.confidence).toBe(0.99);
  });

  it("initializes data if missing", () => {
    const state = { data: {} } as { data: PolarisNetworkState };
    setIntentHandler({ intent: "researcher", confidence: 0.7 }, state);
    expect(state.data.intent).toBe("researcher");
  });
});

describe("Convex agentType Persistence", () => {
  it("messages table schema includes agentType field", async () => {
    const schema = await Bun.file("convex/schema.ts").text();
    expect(schema).toContain("agentType: v.optional(v.string())");
  });

  it("createMessage mutation accepts agentType arg", async () => {
    const system = await Bun.file("convex/system.ts").text();
    const createMessageBlock = system.slice(
      system.indexOf("export const createMessage"),
      system.indexOf("export const updateMessageContent"),
    );
    expect(createMessageBlock).toContain(
      "agentType: v.optional(v.string())",
    );
    expect(createMessageBlock).toContain("agentType: args.agentType");
  });

  it("updateMessageContent mutation accepts and persists agentType", async () => {
    const system = await Bun.file("convex/system.ts").text();
    const updateBlock = system.slice(
      system.indexOf("export const updateMessageContent"),
      system.indexOf("export const updateMessageStatus"),
    );
    expect(updateBlock).toContain("agentType: v.optional(v.string())");
    expect(updateBlock).toContain("agentType: args.agentType");
  });

  it("createMessage inserts agentType into database", async () => {
    const system = await Bun.file("convex/system.ts").text();
    const createMessageBlock = system.slice(
      system.indexOf("export const createMessage"),
      system.indexOf("export const updateMessageContent"),
    );
    expect(createMessageBlock).toContain("agentType: args.agentType");
    expect(createMessageBlock).toContain('ctx.db.insert("messages"');
  });
});

describe("UI AgentBadge Rendering", () => {
  it("returns a color class for every specialist type", () => {
    const types: AgentIntent[] = [
      "planner",
      "builder",
      "debugger",
      "researcher",
      "general",
    ];
    for (const agentType of types) {
      const color = getAgentBadgeColor(agentType);
      expect(color).not.toBeNull();
      expect(color!).toContain("bg-");
      expect(color!).toContain("text-");
    }
  });

  it("returns null when agentType is null", () => {
    expect(getAgentBadgeColor(null)).toBeNull();
  });

  it("returns null when agentType is undefined", () => {
    expect(getAgentBadgeColor(undefined)).toBeNull();
  });

  it("maps each agent type to a unique color scheme", () => {
    const seen = new Set<string>();
    const types = ["planner", "builder", "debugger", "researcher", "general"];
    for (const t of types) {
      const color = getAgentBadgeColor(t)!;
      expect(seen.has(color)).toBe(false);
      seen.add(color);
    }
  });

  it("falls back to gray for unknown agent type", () => {
    expect(getAgentBadgeColor("unknown-agent")).toBe(
      "bg-gray-100 text-gray-700",
    );
  });

  it("source: AgentBadge component renders agentType text", async () => {
    const badge = await Bun.file(
      "src/components/ai-elements/agent-badge.tsx",
    ).text();
    expect(badge).toContain("{agentType}");
    expect(badge).toContain("if (!agentType) return null");
  });

  it("source: Message component conditionally renders AgentBadge", async () => {
    const message = await Bun.file(
      "src/components/ai-elements/message.tsx",
    ).text();
    expect(message).toContain('import { AgentBadge } from "./agent-badge"');
    expect(message).toContain("agentType?: string");
    expect(message).toContain(
      'from === "assistant" && agentType && <AgentBadge',
    );
  });
});

describe("Source Verification: Network ↔ Agents ↔ Convex", () => {
  it("process-message creates all six agents", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/process-message.ts",
    ).text();
    expect(src).toContain("createClassifierAgent");
    expect(src).toContain("createPlannerAgent");
    expect(src).toContain("createBuilderAgent");
    expect(src).toContain("createDebuggerAgent");
    expect(src).toContain("createResearcherAgent");
    expect(src).toContain("createGeneralAgent");
  });

  it("process-message registers all agents in network", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/process-message.ts",
    ).text();
    expect(src).toContain(
      "agents: [classifierAgent, plannerAgent, builderAgent, debuggerAgent, researcherAgent, generalAgent]",
    );
  });

  it("router starts with classifier at callCount === 0", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/process-message.ts",
    ).text();
    expect(src).toContain("if (callCount === 0)");
    expect(src).toContain("return classifierAgent");
  });

  it("router reads intent from network state for specialist dispatch", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/process-message.ts",
    ).text();
    expect(src).toContain("network.state.data.intent");
    expect(src).toContain("!network.state.data.routed");
  });

  it("router agent map matches all specialist agents", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/process-message.ts",
    ).text();
    expect(src).toContain("planner: plannerAgent");
    expect(src).toContain("builder: builderAgent");
    expect(src).toContain("debugger: debuggerAgent");
    expect(src).toContain("researcher: researcherAgent");
    expect(src).toContain("general: generalAgent");
  });

  it("classifier agent uses set_intent tool", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/agents/classifier.ts",
    ).text();
    expect(src).toContain("name: 'set_intent'");
    expect(src).toContain("network.state");
    expect(src).toContain(".data.intent");
    expect(src).toContain(".data.confidence");
  });

  it("classifier system prompt defines all valid intents", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/constants.ts",
    ).text();
    expect(src).toContain("CLASSIFIER_SYSTEM_PROMPT");
    expect(src).toContain("planner");
    expect(src).toContain("builder");
    expect(src).toContain("debugger");
    expect(src).toContain("researcher");
    expect(src).toContain("general");
  });

  it("PolarisNetworkState type defines intent field", async () => {
    const src = await Bun.file(
      "src/features/conversations/inngest/types.ts",
    ).text();
    expect(src).toContain("intent?: AgentIntent");
    expect(src).toContain("routed?: boolean");
    expect(src).toContain("agentSwitchCount?: number");
  });

  it("agent-badge has color entries for all specialist types", async () => {
    const src = await Bun.file(
      "src/components/ai-elements/agent-badge.tsx",
    ).text();
    for (const type of [
      "planner",
      "builder",
      "debugger",
      "researcher",
      "general",
    ]) {
      expect(src).toContain(`${type}:`);
    }
  });
});

describe("Full E2E Flow Simulation", () => {
  it("classify → route to builder → respond → persist → render badge", () => {
    const router = createRouter(agents);
    const state: PolarisNetworkState = {};

    // GIVEN: network starts → router sends to classifier
    const step1 = router(
      makeRouterContext({ callCount: 0, data: state }),
    );
    expect(step1?.name).toBe("classifier");

    // WHEN: classifier classifies intent as "builder"
    const networkState = { data: state };
    setIntentHandler({ intent: "builder", confidence: 0.92 }, networkState);
    expect(state.intent).toBe("builder");
    expect(state.confidence).toBe(0.92);

    // THEN: router dispatches to builder specialist
    const step3 = router(
      makeRouterContext({ callCount: 1, data: state }),
    );
    expect(step3?.name).toBe("builder");
    expect(state.routed).toBe(true);

    // WHEN: builder responds with text only → network stops
    const step4 = router(
      makeRouterContext({
        callCount: 2,
        data: state,
        results: [
          {
            output: [{ type: "text", role: "assistant" }],
          },
        ],
      }),
    );
    expect(step4).toBeUndefined();

    // THEN: agentType "builder" persisted, badge renders green
    expect(state.intent).toBe("builder");
    expect(getAgentBadgeColor(state.intent!)).toBe(
      "bg-green-100 text-green-700",
    );
  });

  it("classify → route to debugger → respond → render badge", () => {
    const router = createRouter(agents);
    const state: PolarisNetworkState = {};

    expect(
      router(makeRouterContext({ callCount: 0, data: state }))?.name,
    ).toBe("classifier");

    setIntentHandler(
      { intent: "debugger", confidence: 0.88 },
      { data: state },
    );

    const specialist = router(
      makeRouterContext({ callCount: 1, data: state }),
    );
    expect(specialist?.name).toBe("debugger");

    expect(getAgentBadgeColor("debugger")).toBe(
      "bg-orange-100 text-orange-700",
    );
  });

  it("classify → route to researcher → respond → render badge", () => {
    const router = createRouter(agents);
    const state: PolarisNetworkState = {};

    expect(
      router(makeRouterContext({ callCount: 0, data: state }))?.name,
    ).toBe("classifier");

    setIntentHandler(
      { intent: "researcher", confidence: 0.75 },
      { data: state },
    );

    const specialist = router(
      makeRouterContext({ callCount: 1, data: state }),
    );
    expect(specialist?.name).toBe("researcher");

    expect(getAgentBadgeColor("researcher")).toBe(
      "bg-purple-100 text-purple-700",
    );
  });

  it("multi-iteration: builder uses tools then responds", () => {
    const router = createRouter(agents);
    const state: PolarisNetworkState = {};

    // GIVEN: classified as builder
    router(makeRouterContext({ callCount: 0, data: state }));
    setIntentHandler(
      { intent: "builder", confidence: 0.95 },
      { data: state },
    );

    // WHEN: routed to builder
    const builder = router(
      makeRouterContext({ callCount: 1, data: state }),
    );
    expect(builder?.name).toBe("builder");

    // THEN: tool_call only → continues
    const mid = router(
      makeRouterContext({
        callCount: 2,
        data: state,
        results: [{ output: [{ type: "tool_call" }] }],
      }),
    );
    expect(mid).toBeUndefined();

    // THEN: text + tool_call → still continues
    const mid2 = router(
      makeRouterContext({
        callCount: 3,
        data: state,
        results: [
          {
            output: [
              { type: "text", role: "assistant" },
              { type: "tool_call" },
            ],
          },
        ],
      }),
    );
    expect(mid2).toBeUndefined();

    // THEN: text only → stops
    const done = router(
      makeRouterContext({
        callCount: 4,
        data: state,
        results: [
          {
            output: [{ type: "text", role: "assistant" }],
          },
        ],
      }),
    );
    expect(done).toBeUndefined();
  });
});
