import { createAgent } from '@inngest/agent-kit';
import { openai } from '@ai-sdk/openai';
import { ToolOptions, createDebuggingTools } from '../tools';
import { DEBUGGER_SYSTEM_PROMPT } from '../constants';

export const createDebuggerAgent = (opts: ToolOptions) => {
  return createAgent({
    name: 'debugger',
    description: 'Error analysis and debugging specialist',
    system: DEBUGGER_SYSTEM_PROMPT,
    model: openai({
      model: 'google/gemini-3.1-pro',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    tools: createDebuggingTools(opts),
  });
};
