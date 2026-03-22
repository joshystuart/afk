export interface DockerStatusCodeError extends Error {
  statusCode: number;
  reason?: string;
}

export function isDockerStatusCodeError(
  error: unknown,
): error is DockerStatusCodeError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  );
}
