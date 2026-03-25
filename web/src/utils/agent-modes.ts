/**
 * Generic agent modes - agnostic to any specific orchestrator (Claude, etc.)
 * Each orchestrator provides its own mapper from these generic modes.
 */

export const AGENT_MODES = [
  {
    id: 'plan',
    label: 'Plan',
    description: 'Plan before acting – outline steps, then execute',
  },
  {
    id: 'agent',
    label: 'Agent',
    description: 'Act autonomously – execute tasks without planning first',
  },
] as const;

export type AgentModeId = (typeof AGENT_MODES)[number]['id'];

export const DEFAULT_AGENT_MODE: AgentModeId = 'agent';

export function getAgentModeLabel(mode?: string | null): string {
  return AGENT_MODES.find((m) => m.id === mode)?.label ?? mode ?? 'Plan';
}

export function getNextAgentMode(current: AgentModeId): AgentModeId {
  const currentIndex = AGENT_MODES.findIndex((m) => m.id === current);
  const nextIndex = (currentIndex + 1) % AGENT_MODES.length;
  return AGENT_MODES[nextIndex].id;
}

/**
 * Orchestrator-specific mappers.
 * Maps generic AgentModeId → orchestrator-native mode string.
 */

const CLAUDE_MODE_MAP: Record<AgentModeId, string> = {
  plan: 'plan',
  agent: 'agent',
};

export function toClaudeMode(mode: AgentModeId): string {
  return CLAUDE_MODE_MAP[mode] ?? CLAUDE_MODE_MAP[DEFAULT_AGENT_MODE];
}
