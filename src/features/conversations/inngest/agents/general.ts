import { createAgent } from '@inngest/agent-kit';
import { openai } from '@ai-sdk/openai';
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
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    tools: createFullTools(opts),
  });
};
