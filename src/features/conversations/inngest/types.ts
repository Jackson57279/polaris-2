export type AgentIntent = 'planner' | 'builder' | 'debugger' | 'researcher' | 'general';

export interface PolarisNetworkState {
  intent?: AgentIntent;
  confidence?: number;
  routed?: boolean;
  agentSwitchCount?: number;
}
