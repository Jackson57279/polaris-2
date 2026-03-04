import { cn } from "@/lib/utils";

interface AgentBadgeProps {
  agentType?: string | null;
}

const agentColors: Record<string, string> = {
  classifier: "bg-gray-100 text-gray-700",
  planner: "bg-blue-100 text-blue-700",
  builder: "bg-green-100 text-green-700",
  debugger: "bg-orange-100 text-orange-700",
  researcher: "bg-purple-100 text-purple-700",
  general: "bg-slate-100 text-slate-700",
};

export function AgentBadge({ agentType }: AgentBadgeProps) {
  if (!agentType) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded",
        agentColors[agentType] || "bg-gray-100 text-gray-700"
      )}
    >
      {agentType}
    </span>
  );
}
