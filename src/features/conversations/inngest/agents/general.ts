import { createAgent, openai } from '@inngest/agent-kit';
import { ToolOptions, createFullTools } from '../tools';
import { GENERAL_SYSTEM_PROMPT } from '../constants';

export const createGeneralAgent = (opts: ToolOptions) => {
  return createAgent({
    name: 'general',
    description: 'General coding assistant (fallback for all intents)',
    system: GENERAL_SYSTEM_PROMPT,
    model: openai({
      model: 'google/gemini-3.1-pro',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
    tools: createFullTools(opts),
  });
};
