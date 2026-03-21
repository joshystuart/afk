export const CLAUDE_MODES = [
  {
    id: 'agent',
    label: 'Agent',
    description: 'Full autonomy — reads, writes, and executes',
  },
  {
    id: 'plan',
    label: 'Plan',
    description: 'Read-only planning — no writes or execution',
  },
] as const;

export const DEFAULT_CLAUDE_MODE = CLAUDE_MODES[0].id;

export type ClaudeModeId = (typeof CLAUDE_MODES)[number]['id'];

export function getClaudeModeLabel(mode?: string | null): string {
  return (
    CLAUDE_MODES.find((candidate) => candidate.id === mode)?.label ??
    mode ??
    'Agent'
  );
}
