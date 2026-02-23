import { createAgent, openai } from '@inngest/agent-kit';
import { ToolOptions, createReadOnlyTools } from '../tools';
import { RESEARCHER_SYSTEM_PROMPT } from '../constants';

export const createResearcherAgent = (opts: ToolOptions) => {
  return createAgent({
    name: 'researcher',
    description: 'Documentation and research specialist',
    system: RESEARCHER_SYSTEM_PROMPT,
    model: openai({
      model: 'x-ai/grok-4.1-fast',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
    tools: createReadOnlyTools(opts),
  });
};
