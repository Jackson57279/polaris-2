import { createAgent } from '@inngest/agent-kit';
import { openai } from '@ai-sdk/openai';
import { ToolOptions, createFullTools } from '../tools';
import { BUILDER_SYSTEM_PROMPT } from '../constants';

export const createBuilderAgent = (opts: ToolOptions) => {
  return createAgent({
    name: 'builder',
    description: 'File modification specialist (create, update, delete files)',
    system: BUILDER_SYSTEM_PROMPT,
    model: openai({
      model: 'google/gemini-3.1-pro',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    tools: createFullTools(opts),
  });
};
