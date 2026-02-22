import { createAgent } from '@inngest/agent-kit';
import { openai } from '@ai-sdk/openai';
import { ToolOptions, createPlanningTools } from '../tools';
import { PLANNER_SYSTEM_PROMPT } from '../constants';

export const createPlannerAgent = (opts: ToolOptions) => {
  return createAgent({
    name: 'planner',
    description: 'Architecture and planning specialist (read-only, creates .md plans)',
    system: PLANNER_SYSTEM_PROMPT,
    model: openai({
      model: 'google/gemini-3.1-pro',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    tools: createPlanningTools(opts),
  });
};
