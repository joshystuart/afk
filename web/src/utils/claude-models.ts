export const CLAUDE_MODELS = [
  {
    id: 'claude-opus-4-7',
    label: 'Opus 4.7',
    description: 'Best for harder repo-wide reasoning tasks',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4.6',
    description: 'Best for harder repo-wide reasoning tasks',
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4.6',
    description: 'Balanced quality and speed for most jobs',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    description: 'Fastest option for lighter automation',
  },
] as const;

export const DEFAULT_CLAUDE_MODEL = CLAUDE_MODELS[0].id;

export type ClaudeModelId = (typeof CLAUDE_MODELS)[number]['id'];

export function getClaudeModelLabel(model?: string | null): string {
  return (
    CLAUDE_MODELS.find((candidate) => candidate.id === model)?.label ??
    model ??
    'Default model'
  );
}
