export class ContainerNotFoundError extends Error {
  constructor(
    public readonly containerId: string,
    cause?: Error,
  ) {
    super(`Container not found: ${containerId}`, { cause });
  }
}
