import { createAgent, openai } from '@inngest/agent-kit';
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
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
    tools: createPlanningTools(opts),
  });
};
