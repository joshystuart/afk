export const SESSION_PERMISSION_MODES = ['agent', 'plan'] as const;

export type SessionPermissionMode = (typeof SESSION_PERMISSION_MODES)[number];

export const DEFAULT_SESSION_PERMISSION_MODE: SessionPermissionMode = 'agent';

export function isSessionPermissionMode(
  value: string | undefined,
): value is SessionPermissionMode {
  return (
    value !== undefined &&
    SESSION_PERMISSION_MODES.includes(value as SessionPermissionMode)
  );
}
