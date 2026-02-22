import { createAgent, createTool } from '@inngest/agent-kit';
import { z } from 'zod';
declare const openai: any;
import { ToolOptions } from '../tools';
import { AgentIntent } from '../types';
import { CLASSIFIER_SYSTEM_PROMPT } from '../constants';

export const createClassifierAgent = (opts: ToolOptions) => {
  // Tool: set_intent
  const setIntentTool = createTool({
    name: 'set_intent',
    description: 'Save the classified intent for routing',
    parameters: z.object({
      intent: z.enum(['planner', 'builder', 'debugger', 'researcher', 'general']),
      confidence: z.number().min(0).max(1),
    }),
    handler: ({ intent, confidence }, { network }) => {
      // Persist intent to the network state
      (network.state as any).data = (network.state as any).data ?? {};
      (network.state as any).data.intent = intent as AgentIntent;
      (network.state as any).data.confidence = confidence;
      return `Intent classified: ${intent} (confidence: ${confidence})`;
    },
  });

  return createAgent({
    name: 'classifier',
    description: 'Classifies user intent for routing to specialist agents',
    system: CLASSIFIER_SYSTEM_PROMPT,
    model: openai({
      model: 'x-ai/grok-4.1-fast',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    tools: [setIntentTool],
  });
};
