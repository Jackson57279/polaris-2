import { createAgent, openai } from '@inngest/agent-kit';
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
      baseUrl: 'https://openrouter.ai/api/v1',
    }),
    tools: createDebuggingTools(opts),
  });
};
