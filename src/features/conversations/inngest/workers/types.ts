export interface WorkerInput {
  messageId: string;
  projectId: string;
  conversationId: string;
  userMessage: string;
}

export interface RepoResearchInput extends WorkerInput {
  focusAreas: string[];
}

export interface ExaResearchInput extends WorkerInput {
  searchQueries: string[];
}

export interface ReviewInput extends WorkerInput {
  implementationSummary: string;
}

export interface ResearchArtifact {
  summary: string;
  relevantFiles?: { name: string; snippet: string }[];
  citations?: { url: string; title: string; content: string }[];
}

export interface ReviewArtifact {
  issues: string[];
  suggestions: string[];
  quality: "good" | "needs_improvement" | "critical_issues";
}

export interface AgentPlan {
  needsResearch: boolean;
  searchQueries: string[];
  focusAreas: string[];
  implementationHints: string;
  complexity: "simple" | "moderate" | "complex";
}
